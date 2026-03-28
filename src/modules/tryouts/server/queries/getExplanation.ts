import z from "zod";
import { protectedProcedure } from "@/trpc/init";
import { resolvePaymentType } from "@/modules/tryouts/server/services/payment.service";

/**
 * Resolve the actual PDF download URL from a populated media document.
 * Tries multiple strategies in order of reliability:
 * 1. Uploadthing CDN via _key
 * 2. The url field directly (if it's an absolute URL)
 * 3. null if nothing works
 */
function resolvePdfUrl(mediaDoc: Record<string, unknown> | null | undefined): string | null {
  if (!mediaDoc) return null;

  // Strategy 1: direct Uploadthing CDN URL from _key
  const key = mediaDoc._key as string | undefined;
  if (key) {
    return `https://hivpn20u1z.ufs.sh/f/${key}`;
  }

  // Strategy 2: url field (might be absolute URL from Uploadthing)
  const url = mediaDoc.url as string | undefined;
  if (url && url.startsWith("http")) {
    return url;
  }

  return null;
}

export const getExplanation = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) {
      return { allowed: false as const, pdfUrl: null, paymentType: "free" as const, paymentReviewStatus: null };
    }

    const [attemptResult, scoreResult, paymentResult, settingsResult] = await Promise.all([
      ctx.db.find({
        collection: "tryout-attempts",
        where: {
          and: [
            { user: { equals: userId } },
            { tryout: { equals: input.tryoutId } },
            { status: { equals: "completed" } },
          ],
        },
        limit: 1,
        sort: "-createdAt",
        depth: 0,
      }),
      ctx.db.find({
        collection: "tryout-scores",
        where: {
          and: [
            { user: { equals: userId } },
            { tryout: { equals: input.tryoutId } },
          ],
        },
        limit: 1,
        depth: 0,
      }),
      ctx.db.find({
        collection: "tryout-payments",
        where: {
          and: [
            { user: { equals: userId } },
            { tryout: { equals: input.tryoutId } },
          ],
        },
        limit: 1,
        sort: "-createdAt",
        depth: 0,
      }),
      ctx.db.findGlobal({
        slug: "app-settings",
        depth: 0,
      }).catch(() => null),
    ]);

    const attempt = (attemptResult.docs[0] ?? undefined) as unknown as Record<string, unknown> | undefined;
    const scoreDoc = (scoreResult.docs[0] ?? undefined) as unknown as Record<string, unknown> | undefined;
    const paymentDoc = (paymentResult.docs[0] ?? undefined) as {
      status?: "pending" | "verified" | "rejected";
      paymentMethod?: "free" | "qris" | "voucher";
    } | undefined;
    
    const settings = (settingsResult || {}) as Record<string, unknown>;
    const isBypassEnabled = settings.bypassExplanationAccess === true;

    const resultPlan = (attempt?.resultPlan as "none" | "free" | "paid" | undefined) ?? "none";
    const paymentType = resolvePaymentType(resultPlan, scoreDoc);

    if (!attempt) {
      return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? null };
    }

    // Only enforce payment requirement if bypass is not enabled
    if (!isBypassEnabled) {
      if (paymentType !== "paid") {
        return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? null };
      }

      if (paymentDoc?.status !== "verified") {
        return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? "pending" };
      }
    }

    // Fetch explanation with depth:1 so the 'pdf' upload field is populated
    // with the full explanation-media document (including _key, url, filename)
    const explanationResult = await ctx.db.find({
      collection: "tryout-explanations",
      where: { tryout: { equals: input.tryoutId } },
      limit: 1,
      depth: 1,
    });

    const explanationDoc = (explanationResult.docs[0] ?? undefined) as unknown as Record<string, unknown> | undefined;
    if (!explanationDoc) {
      return {
        allowed: true as const,
        pdfUrl: null,
        paymentType,
        paymentReviewStatus: paymentDoc?.status ?? null,
      };
    }

    // The 'pdf' field with depth:1 is the full media document object
    const pdfMedia = explanationDoc.pdf as Record<string, unknown> | string | undefined;

    let pdfUrl: string | null = null;

    if (typeof pdfMedia === "object" && pdfMedia !== null) {
      pdfUrl = resolvePdfUrl(pdfMedia);
    } else if (typeof pdfMedia === "string") {
      // Not populated (just the ID) — fallback: lookup directly
      try {
        const mediaDoc = await ctx.db.findByID({
          collection: "explanation-media",
          id: pdfMedia,
          depth: 0,
        }) as unknown as Record<string, unknown> | null;
        pdfUrl = resolvePdfUrl(mediaDoc);
      } catch (err) {
        console.error("[getExplanation] findByID failed:", err);
        pdfUrl = null;
      }
    }

    return {
      allowed: true as const,
      pdfUrl,
      title: (explanationDoc.title as string) || "Pembahasan Tryout",
      paymentType,
      paymentMethod: paymentDoc?.paymentMethod ?? "qris",
      paymentReviewStatus: paymentDoc?.status ?? null,
    };
  });
