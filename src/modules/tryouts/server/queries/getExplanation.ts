import z from "zod";
import { protectedProcedure } from "@/trpc/init";
import { resolvePaymentType } from "@/modules/tryouts/server/services/payment.service";

export const getExplanation = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) {
      return { allowed: false as const, pdfUrl: null, paymentType: "free" as const, paymentReviewStatus: null };
    }

    const [attemptResult, scoreResult, paymentResult] = await Promise.all([
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

    const attempt = (attemptResult.docs[0] ?? undefined) as unknown as Record<string, unknown> | undefined;
    const scoreDoc = (scoreResult.docs[0] ?? undefined) as unknown as Record<string, unknown> | undefined;
    const paymentDoc = (paymentResult.docs[0] ?? undefined) as {
      status?: "pending" | "verified" | "rejected";
      paymentMethod?: "free" | "qris" | "voucher";
    } | undefined;
    const resultPlan = (attempt?.resultPlan as "none" | "free" | "paid" | undefined) ?? "none";
    const paymentType = resolvePaymentType(resultPlan, scoreDoc);

    if (!attempt) {
      return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? null };
    }

    if (paymentType !== "paid") {
      return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? null };
    }

    if (paymentDoc?.status !== "verified") {
      return { allowed: false as const, pdfUrl: null, paymentType, paymentReviewStatus: paymentDoc?.status ?? "pending" };
    }

    const explanationResult = await ctx.db.find({
      collection: "tryout-explanations",
      where: { tryout: { equals: input.tryoutId } },
      limit: 1,
      depth: 0, // Don't populate — get the raw media ID
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

    // Get the PDF media document ID (with depth: 0 it's just a string ID)
    const pdfMediaId = explanationDoc.pdf as string | undefined;
    let pdfUrl: string | null = null;

    if (pdfMediaId) {
      try {
        // Query explanation-media directly to get the _key field
        const mediaDoc = await ctx.db.findByID({
          collection: "explanation-media",
          id: pdfMediaId,
          depth: 0,
        }) as unknown as Record<string, unknown> | null;

        if (mediaDoc?._key) {
          // Direct Uploadthing CDN URL
          pdfUrl = `https://hivpn20u1z.ufs.sh/f/${mediaDoc._key}`;
        } else if (mediaDoc?.url) {
          // Fallback
          pdfUrl = mediaDoc.url as string;
        }
      } catch {
        // fallback: if findByID fails, try to construct from the old url field
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
