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

    const pdf = explanationDoc.pdf as Record<string, unknown> | string | undefined;
    let pdfUrl: string | null = null;
    if (pdf && typeof pdf === "object" && "_key" in pdf && pdf._key) {
      // Construct the direct Uploadthing CDN URL from the file key
      pdfUrl = `https://hivpn20u1z.ufs.sh/f/${pdf._key}`;
    } else if (pdf && typeof pdf === "object" && "url" in pdf) {
      // Fallback to the url field
      pdfUrl = (pdf as { url?: string }).url ?? null;
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
