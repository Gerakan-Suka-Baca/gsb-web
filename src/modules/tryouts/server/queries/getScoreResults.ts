import z from "zod";
import { protectedProcedure } from "@/trpc/init";
import { resolvePaymentType } from "@/modules/tryouts/server/services/payment.service";
import { TryoutScoreDoc } from "@/modules/tryouts/server/types/procedure.types";

export const getScoreResults = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) return { released: false, releaseDate: null, scores: null, subtestStats: [], finalScore: null };

    const tryout = await ctx.db.findByID({
      collection: "tryouts",
      id: input.tryoutId,
      depth: 0,
    }) as unknown as { scoreReleaseDate?: string; title?: string };

    const now = new Date();
    const releaseDate = tryout.scoreReleaseDate || null;
    const released = releaseDate ? new Date(releaseDate) <= now : false;

    if (!released) {
      return { released: false, releaseDate, scores: null, subtestStats: [], finalScore: null, tryoutTitle: tryout.title || "" };
    }

    const [scoreResult, attemptResult, paymentResult] = await Promise.all([
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
        collection: "tryout-attempts",
        where: {
          and: [
            { user: { equals: userId } },
            { tryout: { equals: input.tryoutId } },
            { status: { equals: "completed" } },
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

    const scoreDoc = (scoreResult.docs[0] ?? undefined) as TryoutScoreDoc | undefined;
    const attemptDoc = (attemptResult.docs[0] ?? undefined) as unknown as Record<string, unknown> | undefined;
    const paymentDoc = (paymentResult.docs[0] ?? undefined) as {
      status?: "pending" | "verified" | "rejected";
      paymentMethod?: "free" | "qris" | "voucher";
    } | undefined;
    const resultPlan = (attemptDoc?.resultPlan as "none" | "free" | "paid" | undefined) ?? "none";
    const paymentType = resolvePaymentType(resultPlan, scoreDoc);

    const questionResults = Array.isArray(attemptDoc?.questionResults) ? attemptDoc.questionResults : [];

    const questionsDocs = await ctx.db.find({
      collection: "questions",
      where: { tryout: { equals: input.tryoutId } },
      depth: 0,
      pagination: false,
    });

    const subtestIdToCode = new Map<string, string>();
    for (const qDoc of questionsDocs.docs as unknown as Record<string, unknown>[]) {
      if (qDoc.id && qDoc.subtest) {
        subtestIdToCode.set(String(qDoc.id), String(qDoc.subtest));
      }
    }

    type QR = { subtestId?: string; isCorrect?: boolean; selectedLetter?: string | null };
    const statsMap = new Map<string, { correct: number; wrong: number; empty: number; total: number }>();

    for (const qr of questionResults as QR[]) {
      const rawId = qr.subtestId || "unknown";
      const sid = subtestIdToCode.get(rawId) || rawId;
      if (!statsMap.has(sid)) statsMap.set(sid, { correct: 0, wrong: 0, empty: 0, total: 0 });
      const s = statsMap.get(sid)!;
      s.total++;
      if (!qr.selectedLetter) { s.empty++; }
      else if (qr.isCorrect) { s.correct++; }
      else { s.wrong++; }
    }

    const subtestStats = Array.from(statsMap.entries()).map(([subtestId, stats]) => ({
      subtestId,
      ...stats,
    }));

    const scores = scoreDoc ? {
      score_PU: scoreDoc.score_PU as number ?? null,
      score_PK: scoreDoc.score_PK as number ?? null,
      score_PM: scoreDoc.score_PM as number ?? null,
      score_LBE: scoreDoc.score_LBE as number ?? null,
      score_LBI: scoreDoc.score_LBI as number ?? null,
      score_PPU: scoreDoc.score_PPU as number ?? null,
      score_KMBM: scoreDoc.score_KMBM as number ?? null,
    } : null;

    return {
      released: true,
      releaseDate,
      scores,
      subtestStats,
      finalScore: (scoreDoc?.finalScore as number) ?? null,
      tryoutTitle: tryout.title || "",
      totalCorrect: attemptDoc?.correctAnswersCount as number ?? 0,
      totalQuestions: attemptDoc?.totalQuestionsCount as number ?? 0,
      subtestDurations: (attemptDoc?.subtestDurations as Record<string, number>) || {},
      paymentType,
      paymentMethod: paymentDoc?.paymentMethod ?? (paymentType === "paid" ? "qris" : "free"),
      paymentReviewStatus: ((paymentDoc as { status?: "pending" | "verified" | "rejected" } | undefined)?.status ?? null),
    };
  });
