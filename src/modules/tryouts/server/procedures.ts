import z from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Question } from "@/payload-types";

type ProgramMetric = {
  admissionMetric?: string;
  capacity?: number;
  applicants?: number;
  predictedApplicants?: number;
  passingPercentage?: string;
  avgUkt?: string;
  maxUkt?: string;
};

type UniversityProgram = {
  id?: string;
  _id?: unknown;
  name?: string;
  category?: string;
  metrics?: ProgramMetric[];
  capacity?: number;
  avgUkt?: string;
  maxUkt?: string;
  admissionMetric?: string;
  applicantsPreviousYear?: number;
  predictedApplicants?: number;
  passingPercentage?: string;
  level?: string;
  accreditation?: string;
  description?: unknown;
  courses?: unknown;
  history?: unknown;
  faculty?: string;
};

type UniversityDoc = {
  id?: string;
  name?: string;
  programs?: UniversityProgram[];
  abbreviation?: string;
  status?: string;
  accreditation?: string;
  website?: string;
};

type TryoutScoreDoc = {
  finalScore?: number;
  score_PU?: number;
  score_PK?: number;
  score_PM?: number;
  score_LBE?: number;
  score_LBI?: number;
  score_PPU?: number;
  score_KMBM?: number;
};

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

import { getMyPaymentHistory } from "./queries/getMyPaymentHistory";
import { getExplanation } from "./queries/getExplanation";
import { getLeaderboard } from "./queries/getLeaderboard";

export const tryoutsRouter = createTRPCRouter({
  getMyPaymentHistory: getMyPaymentHistory,
  getExplanation: getExplanation,
  getLeaderboard: getLeaderboard,
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
        sort: "-dateOpen",
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
      ]);

      const scoreDoc = (scoreResult.docs[0] ?? undefined) as TryoutScoreDoc | undefined;
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
          collection: "tryout-scores",
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

      const scoreDoc = (scoreResult.docs[0] ?? undefined) as TryoutScoreDoc | undefined;
      const finalScore = (scoreDoc?.finalScore as number) ?? 0;

      // Function to search MongoDB for a program
        const searchProgram = async (univName: string, majorName: string) => {
          if (!univName || !majorName) return null;
          
          const results = await ctx.db.find({
            collection: "university-programs",
            where: {
              and: [
                { universityName: { contains: univName } },
                { name: { contains: majorName } },
                { category: { equals: "snbt" } }
              ]
            },
            limit: 1,
            depth: 0,
          });
  
          if (results.docs.length === 0) return null;
          const match = results.docs[0] as any;

        const latestMetric = (match.metrics?.[0] ?? {}) as ProgramMetric;
        const passingGrade = parseFloat(latestMetric.admissionMetric || match.admissionMetric || "0") || 0;
        if (!passingGrade) return { found: true, passingGrade: 0, targetPTN: univName, targetMajor: majorName, name: match.name, universityName: match.universityName };

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
          dbUnivName: match.universityName,
          dbMajorName: match.name,
          level,
          color,
          chance,
          passingGrade,
        };
      };

      const userData = user as {
        targetPTN?: string;
        targetMajor?: string;
        targetPTN2?: string;
        targetMajor2?: string;
        targetPTN3?: string;
        targetMajor3?: string;
      };
      const choice1 = await searchProgram(userData.targetPTN ?? "", userData.targetMajor ?? "");
      const choice2 = await searchProgram(userData.targetPTN2 ?? "", userData.targetMajor2 ?? "");
      const choice3 = await searchProgram(userData.targetPTN3 ?? "", userData.targetMajor3 ?? "");

      return {
        finalScore,
        choice1: choice1 || { found: false, targetPTN: userData.targetPTN, targetMajor: userData.targetMajor },
        choice2: choice2 || { found: false, targetPTN: userData.targetPTN2, targetMajor: userData.targetMajor2 },
        choice3: choice3 || { found: false, targetPTN: userData.targetPTN3, targetMajor: userData.targetMajor3 },
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
        collection: "tryout-scores",
        where: {
          and: [
            { user: { equals: userId } },
            { tryout: { equals: input.tryoutId } },
          ],
        },
        limit: 1,
        depth: 0,
      }).then(res => res.docs);

      const finalScore = (scoreResult as TryoutScoreDoc | undefined)?.finalScore ?? 0;

      // Extract raw user major intents loosely
      const getKeywords = (major: string | undefined | null) => {
        if (!major) return [];
        // very naïve extraction of core subject: "Teknik Informatika" -> "Informatika"
        const lower = major.toLowerCase();
        const blacklist = ["teknik", "pendidikan", "ilmu", "sistem", "manajemen", "studi"];
        const words = lower.split(" ").filter(w => w.length > 3 && !blacklist.includes(w));
        return words.length > 0 ? words : [major.split(" ")[0]];
      };

      const userProfile = user as {
        targetMajor?: string;
        targetMajor2?: string;
      };
      const kw1 = getKeywords(userProfile.targetMajor ?? "");
      const kw2 = getKeywords(userProfile.targetMajor2 ?? "");
      const allKws = Array.from(new Set([...kw1, ...kw2])).filter(Boolean);

      if (allKws.length === 0) {
        return { finalScore, recommendations: [] };
      }

      // Find programs matching keywords derived from the user's target majors
      const results = await ctx.db.find({
        collection: "university-programs",
        where: {
          and: [
            { category: { equals: "snbt" } },
            {
              or: allKws.map(kw => ({
                name: { contains: kw }
              }))
            }
          ]
        },
        pagination: false,
        depth: 0,
      });

      const recs = results.docs.map((prog: any) => {
        const latestMetric = (prog.metrics?.[0] ?? {}) as ProgramMetric;
        const passingGrade = parseFloat(latestMetric.admissionMetric || prog.admissionMetric || "0") || 0;
        
        const k = 0.05;
        const rawChance = 100 / (1 + Math.exp(-k * (finalScore - passingGrade)));
        const chance = Math.max(5, Math.min(95, Math.round(rawChance)));

        return {
          id: prog.id,
          name: prog.name,
          universityName: prog.universityName || "Unknown",
          passingGrade,
          chance, 
          capacity: latestMetric.capacity || prog.capacity || 0,
          avgUkt: latestMetric.avgUkt || prog.avgUkt,
          maxUkt: latestMetric.maxUkt || prog.maxUkt
        };
      }).filter((r) => r.chance >= 70);
      
      // Sort by chance descending
      recs.sort((a, b) => b.chance - a.chance);

      // Return top 20 safe choices
      return { finalScore, recommendations: recs.slice(0, 20) };
    }),

  getProgramStudyDetail: protectedProcedure
    .input(z.object({ programId: z.string(), tryoutId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const prog = await ctx.db.findByID({
        collection: "university-programs",
        id: input.programId,
        depth: 1, // Get university details
      }) as any;

      if (!prog) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program Studi tidak ditemukan" });
      }

      const university = prog.university as UniversityDoc | undefined;
      
      let finalScore = 0;
      if (input.tryoutId && ctx.session?.user?.id) {
        const [scoreResult] = await ctx.db.find({
          collection: "tryout-scores",
          where: {
            and: [
              { user: { equals: ctx.session.user.id } },
              { tryout: { equals: input.tryoutId } },
            ],
          },
          limit: 1,
          depth: 0,
        }).then(res => res.docs);
        finalScore = (scoreResult as TryoutScoreDoc | undefined)?.finalScore ?? 0;
      }

      // Hide sensitive backend-only variables like 'baseValue' / 'ptn_id' from the frontend
      const latestMetric = (prog.metrics?.[0] ?? {}) as ProgramMetric;
      
      return {
        id: prog.id || (prog._id ? prog._id.toString() : null),
        name: prog.name,
        level: prog.level,
        category: prog.category,
        accreditation: prog.accreditation,
        capacity: latestMetric.capacity || prog.capacity,
        applicantsPreviousYear: latestMetric.applicants || prog.applicantsPreviousYear,
        predictedApplicants: latestMetric.predictedApplicants || prog.predictedApplicants,
        passingPercentage: latestMetric.passingPercentage || prog.passingPercentage,
        avgUkt: latestMetric.avgUkt || prog.avgUkt,
        maxUkt: latestMetric.maxUkt || prog.maxUkt,
        description: prog.description,
        courses: prog.courses,
        history: prog.history, 
        passingGrade: parseFloat(latestMetric.admissionMetric || prog.admissionMetric || "0") || 0,
        finalScore,
        university: {
          name: university?.name || prog.universityName,
          abbreviation: university?.abbreviation,
          status: university?.status,
          accreditation: university?.accreditation,
          website: university?.website,
          image: null,
        }
      };
    }),
});
