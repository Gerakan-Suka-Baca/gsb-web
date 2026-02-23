import z from "zod";

import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Question } from "@/payload-types";

const stripAnswerKeyFromSubtest = (subtest: Question): Question => {
  const tryoutQuestions = Array.isArray(subtest.tryoutQuestions)
    ? subtest.tryoutQuestions
    : [];

  const sanitizedQuestions = tryoutQuestions.map((question) => {
    const tryoutAnswers = Array.isArray(question.tryoutAnswers)
      ? question.tryoutAnswers
      : [];

    return {
      ...question,
      tryoutAnswers: tryoutAnswers.map((answer) => {
        const runtimeAnswer = { ...answer } as Record<string, unknown>;
        delete runtimeAnswer.isCorrect;
        return runtimeAnswer;
      }),
    };
  });

  return {
    ...subtest,
    tryoutQuestions: sanitizedQuestions,
  } as unknown as Question;
};

export const tryoutsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        tryoutId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const [tryout, questions] = await Promise.all([
        ctx.db.findByID({
          collection: "tryouts",
          id: input.tryoutId,
          depth: 0,
        }),
        ctx.db.find({
          collection: "questions",
          where: { tryout: { equals: input.tryoutId } },
          limit: 200,
          sort: "createdAt",
          depth: 1,
        }),
      ]);

      const runtimeTests = questions.docs.map((doc) =>
        stripAnswerKeyFromSubtest(doc as Question)
      );

      return {
        ...tryout,
        tests: runtimeTests,
      };
    }),

  getMetadata: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tryout = await ctx.db.findByID({
        collection: "tryouts",
        id: input.tryoutId,
        depth: 0,
      });

      const rawTryout = tryout as { questions?: Array<string | { id?: string }> };
      const orderedIds: string[] = (Array.isArray(rawTryout.questions) ? rawTryout.questions : [])
        .map((q) => (typeof q === "string" ? q : q?.id ? String(q.id) : null))
        .filter((id): id is string => id !== null);

      let finalTests: Question[] = [];

      if (orderedIds.length > 0) {
        const manualDocs = await ctx.db.find({
          collection: "questions",
          where: { id: { in: orderedIds } },
          limit: 200,
          depth: 0,
          select: {
            id: true,
            title: true,
            duration: true,
            subtest: true,
          },
        });
        const docsMap = new Map(manualDocs.docs.map((d) => [String(d.id), d]));
        finalTests = orderedIds
          .map((id) => docsMap.get(id))
          .filter((doc): doc is Question => !!doc);
      }
      if (finalTests.length === 0) {
        const fallbackDocs = await ctx.db.find({
          collection: "questions",
          where: { tryout: { equals: input.tryoutId } },
          limit: 200,
          sort: "createdAt",
          depth: 0,
          select: {
            id: true,
            title: true,
            duration: true,
            subtest: true,
          },
        });
        finalTests = fallbackDocs.docs as Question[];
      }
      finalTests = finalTests.map(t => ({
        ...t,
        duration: t.duration || 0,
        tryoutQuestions: t.tryoutQuestions || [],
      }));

      return {
        ...tryout,
        tests: finalTests,
      };
    }),

  getSubtest: protectedProcedure
    .input(z.object({ subtestId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.subtestId || input.subtestId.trim().length === 0) {
        return null;
      }
      const subtest = await ctx.db.findByID({
        collection: "questions",
        id: input.subtestId,
        depth: 2,
      });

      return stripAnswerKeyFromSubtest(subtest as Question);
    }),
  getMany: baseProcedure
    .input(
      z.object({
        year: z.string().nullable().optional(),
      })
    )
    .query(async ({ ctx }) => {
      const data = await ctx.db.find({
        collection: "tryouts",
        depth: 0,
        pagination: false,
        limit: 100,
      });

      return {
        ...data,
        totalDocs: data.totalDocs,
      };
    }),

  getScoreResults: protectedProcedure
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

      const [scoreResult, attemptResult] = await Promise.all([
        ctx.db.find({
          collection: "tryout-scores" as any,
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
      ]);

      const scoreDoc = (scoreResult.docs[0] ?? undefined) as Record<string, unknown> | undefined;
      const attemptDoc = (attemptResult.docs[0] ?? undefined) as unknown as Record<string, unknown> | undefined;

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
        const sid = subtestIdToCode.get(rawId) || rawId; // Map to "PU" or fallback to raw
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
      };
    }),
});
