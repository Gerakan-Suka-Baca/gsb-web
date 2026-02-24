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

  getTargetAnalysis: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) return null;

      const user = await ctx.db.findByID({
        collection: "users",
        id: userId,
        depth: 0,
      });

      if (!user) return null;

      const [scoreResult] = await Promise.all([
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
        })
      ]);

      const scoreDoc = (scoreResult.docs[0] ?? undefined) as Record<string, unknown> | undefined;
      const finalScore = (scoreDoc?.finalScore as number) ?? 0;

      // Function to search MongoDB for a program
      const searchProgram = async (univName: string, majorName: string) => {
        if (!univName || !majorName) return null;
        
        // Exact matching or partial matching can be tricky due to casing/accents
        // We will try a "contains" search for robustness. Payload supports 'like' or 'contains'.
        const results = await ctx.db.find({
          collection: "studyPrograms",
          where: {
            and: [
              { name: { contains: majorName } },
              { category: { equals: "snbt" } }
            ]
          },
          depth: 1,
          limit: 100,
        });

        // Filter by user's university string (case insensitive)
        const match = results.docs.find((doc: any) => {
          const uName = doc.university?.name || "";
          return uName.toLowerCase().includes(univName.toLowerCase()) || univName.toLowerCase().includes(uName.toLowerCase());
        }) as any;

        if (!match) return null;

        const passingGrade = parseFloat(match.admissionMetric) || 0;
        if (!passingGrade) return { found: true, passingGrade: 0, targetPTN: univName, targetMajor: majorName, name: match.name, universityName: match.university?.name };

        // Statistical Logistic Function for Chance Calculation
        // Formula: P(x) = 1 / (1 + e^(-k(x - x0)))
        // Where x = user score, x0 = passing grade, k = steepness curve
        const k = 0.05; // Curve steepness
        const rawChance = 100 / (1 + Math.exp(-k * (finalScore - passingGrade)));
        
        // Clamp chance between 5% and 95% for realistic probabilistic outputs
        const chance = Math.max(5, Math.min(95, Math.round(rawChance)));

        let level = "Sangat Sulit";
        let color = "red";

        if (chance >= 85) { level = "Sangat Aman"; color = "green"; }
        else if (chance >= 70) { level = "Aman"; color = "green"; }
        else if (chance >= 50) { level = "Kompetitif"; color = "yellow"; }
        else if (chance >= 30) { level = "Risiko"; color = "red"; }

        return {
          found: true,
          targetPTN: univName,
          targetMajor: majorName,
          dbUnivName: match.university?.name,
          dbMajorName: match.name,
          level,
          color,
          chance,
          passingGrade,
        };
      };

      const choice1 = await searchProgram(user.targetPTN as string, user.targetMajor as string);
      const choice2 = await searchProgram(user.targetPTN2 as string, user.targetMajor2 as string);

      return {
        finalScore,
        choice1: choice1 || { found: false, targetPTN: user.targetPTN, targetMajor: user.targetMajor },
        choice2: choice2 || { found: false, targetPTN: user.targetPTN2, targetMajor: user.targetMajor2 },
      };
    }),

  getRecommendations: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) return null;

      const user = await ctx.db.findByID({
        collection: "users",
        id: userId,
        depth: 0,
      });

      if (!user) return null;

      const [scoreResult] = await ctx.db.find({
        collection: "tryout-scores" as any,
        where: {
          and: [
            { user: { equals: userId } },
            { tryout: { equals: input.tryoutId } },
          ],
        },
        limit: 1,
        depth: 0,
      }).then(res => res.docs);

      const finalScore = ((scoreResult as any)?.finalScore as number) ?? 0;

      // Extract raw user major intents loosely
      const getKeywords = (major: string | undefined | null) => {
        if (!major) return [];
        // very naïve extraction of core subject: "Teknik Informatika" -> "Informatika"
        const lower = major.toLowerCase();
        const blacklist = ["teknik", "pendidikan", "ilmu", "sistem", "manajemen", "studi"];
        const words = lower.split(" ").filter(w => w.length > 3 && !blacklist.includes(w));
        return words.length > 0 ? words : [major.split(" ")[0]];
      };

      const kw1 = getKeywords(user.targetMajor as string);
      const kw2 = getKeywords(user.targetMajor2 as string);
      const allKws = Array.from(new Set([...kw1, ...kw2])).filter(Boolean);

      if (allKws.length === 0) {
        return { finalScore, recommendations: [] };
      }

      // Query broad matches
      const rawProms = await ctx.db.find({
        collection: "studyPrograms",
        where: {
          and: [
            {
              or: allKws.map(kw => ({ name: { contains: kw } }))
            },
            { category: { equals: "snbt" } }
          ]
        },
        depth: 1,
        limit: 300,
      });

      const recs = rawProms.docs.map((doc: any) => {
        const passingGrade = parseFloat(doc.admissionMetric) || 0;
        
        const k = 0.05;
        const rawChance = 100 / (1 + Math.exp(-k * (finalScore - passingGrade)));
        const chance = Math.max(5, Math.min(95, Math.round(rawChance)));

        return {
          id: doc.id,
          name: doc.name,
          universityName: doc.university?.name || "Unknown",
          passingGrade,
          chance, 
          capacity: doc.capacity || 0,
          avgUkt: doc.avgUkt,
          maxUkt: doc.maxUkt
        };
      }).filter(r => r.chance >= 70) 
      // strict filter: only recommend universities where statistical chance >= 70%
      
      // Sort by chance descending
      recs.sort((a, b) => b.chance - a.chance);

      // Return top 20 safe choices
      return { finalScore, recommendations: recs.slice(0, 20) };
    }),
});
