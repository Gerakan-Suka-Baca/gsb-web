import z from "zod";
import { optionalUserProcedure } from "@/trpc/init";
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

export const getExplanation = optionalUserProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    // 1. Initial Identity Checks
    const { headers } = await import("next/headers");
    const reqHeaders = await headers();
    const { user: payloadUser } = await ctx.db.auth({ headers: reqHeaders });
    
    const isAdmin = payloadUser && payloadUser.collection === "admins" && ["super-admin", "admin", "volunteer"].includes((payloadUser as any).role || "");
    const userId = ctx.session?.user?.id;

    if (!userId && !isAdmin) {
      return { allowed: false as const, pdfUrl: null, paymentType: "free" as const, paymentReviewStatus: null };
    }

    let attempt: Record<string, unknown> | undefined;
    let scoreDoc: Record<string, unknown> | undefined;
    let paymentDoc: { status?: "pending" | "verified" | "rejected"; paymentMethod?: "free" | "qris" | "voucher" } | undefined;
    let paymentType = "free";

    // 2. Fetch User Attempt Info Only If Not Admin
    const settingsResult = await ctx.db.findGlobal({ slug: "app-settings", depth: 0 }).catch(() => null);
    const settings = (settingsResult || {}) as Record<string, unknown>;
    const isBypassEnabled = settings.bypassExplanationAccess === true;

    if (!isAdmin) {
       const [attemptRes, scoreRes, paymentRes] = await Promise.all([
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
       ]);

       attempt = attemptRes.docs[0] as unknown as Record<string, unknown> | undefined;
       scoreDoc = scoreRes.docs[0] as unknown as Record<string, unknown> | undefined;
       paymentDoc = paymentRes.docs[0] as any;
       
       const resultPlan = (attempt?.resultPlan as "none" | "free" | "paid" | undefined) ?? "none";
       paymentType = resolvePaymentType(resultPlan, scoreDoc);

       if (!attempt) {
         return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? null };
       }

       if (!isBypassEnabled) {
         if (paymentType !== "paid") {
           return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? null };
         }
         if (paymentDoc?.status !== "verified") {
           return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? "pending" };
         }
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
