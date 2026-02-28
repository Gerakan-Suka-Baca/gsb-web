import z from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Question } from "@/payload-types";

const extractId = (val: unknown): string | null => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj.$oid === "string") return obj.$oid;
    if (typeof obj.toString === "function") {
      const s = obj.toString();
      if (s !== "[object Object]") return s;
    }
  }
  return String(val);
};

type ProgramMetric = {
  admissionMetric?: string;
  capacity?: number;
  applicants?: number;
  predictedApplicants?: number;
  passingPercentage?: string;
  avgUkt?: string;
  maxUkt?: string;
};

type UniversityProgramDoc = {
  id?: string;
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
  university?: string | { id?: string };
  universityName?: string;
  abbreviation?: string;
  status?: string;
  universityAccreditation?: string;
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

type CacheEntry<T> = {
  expires: number;
  value: T;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();

const getCacheValue = <T,>(key: string): T | null => {
  const hit = cacheStore.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  return hit.value as T;
};

const setCacheValue = <T,>(key: string, value: T, ttlMs: number) => {
  cacheStore.set(key, { value, expires: Date.now() + ttlMs });
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
      };
    }),

  getTargetAnalysis: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) return null;
      const cachedTarget = getCacheValue<{
        finalScore: number;
        choice1: unknown;
        choice2: unknown;
        choice3: unknown;
      }>(`target:${userId}:${input.tryoutId}`);
      if (cachedTarget) return cachedTarget;

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

      const searchProgram = async (univName: string, majorName: string) => {
        if (!univName || !majorName) return null;

        const results = await ctx.db.find({
          collection: "university-programs",
          where: {
            and: [
              { category: { equals: "snbt" } },
              { universityName: { contains: univName } },
              { name: { contains: majorName } },
            ],
          },
          limit: 1,
          depth: 0,
        });

        if (results.docs.length === 0) return null;
        const match = results.docs[0] as UniversityProgramDoc;

        const latestMetric = (match.metrics?.[0] ?? {}) as ProgramMetric;
        const passingGrade = parseFloat(latestMetric.admissionMetric || match.admissionMetric || "0") || 0;
        const programIdValue = extractId(match.id);
        const universityIdValue = extractId(
          (match.university as { id?: unknown } | undefined)?.id ?? (match.university as string | undefined)
        );

        if (!passingGrade) {
          return {
            found: true,
            passingGrade: 0,
            targetPTN: univName,
            targetMajor: majorName,
            name: match.name,
            universityName: match.universityName,
            programId: programIdValue,
            universityId: universityIdValue,
          };
        }

        const k = 0.05;
        const rawChance = 100 / (1 + Math.exp(-k * (finalScore - passingGrade)));
        
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
          programId: programIdValue,
          universityId: universityIdValue,
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

      const payload = {
        finalScore,
        choice1: choice1 || { found: false, targetPTN: userData.targetPTN, targetMajor: userData.targetMajor },
        choice2: choice2 || { found: false, targetPTN: userData.targetPTN2, targetMajor: userData.targetMajor2 },
        choice3: choice3 || { found: false, targetPTN: userData.targetPTN3, targetMajor: userData.targetMajor3 },
      };
      setCacheValue(`target:${userId}:${input.tryoutId}`, payload, 3 * 60 * 1000);
      return payload;
    }),

  getRecommendations: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) return null;
      const cachedRecs = getCacheValue<{ finalScore: number; recommendations: unknown[] }>(
        `recs:${userId}:${input.tryoutId}`
      );
      if (cachedRecs) return cachedRecs;

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

      const getKeywords = (major: string | undefined | null) => {
        if (!major) return [];
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

      const rawPrograms = await ctx.db.find({
        collection: "university-programs",
        where: {
          and: [
            { category: { equals: "snbt" } },
            {
              or: allKws.map((kw) => ({
                name: { contains: kw },
              })),
            },
          ],
        },
        limit: 300,
        depth: 0,
      });

      const allMatches = rawPrograms.docs as UniversityProgramDoc[];

      const recs = allMatches.map((prog) => {
        const latestMetric = (prog.metrics?.[0] ?? {}) as ProgramMetric;
        const passingGrade = parseFloat(latestMetric.admissionMetric || prog.admissionMetric || "0") || 0;
        
        const k = 0.05;
        const rawChance = 100 / (1 + Math.exp(-k * (finalScore - passingGrade)));
        const chance = Math.max(5, Math.min(95, Math.round(rawChance)));

        return {
          id: extractId(prog.id),
          name: prog.name,
          universityName: prog.universityName || "Unknown",
          passingGrade,
          chance, 
          capacity: latestMetric.capacity || prog.capacity || 0,
          avgUkt: latestMetric.avgUkt || prog.avgUkt,
          maxUkt: latestMetric.maxUkt || prog.maxUkt
        };
      }).filter((r) => r.chance >= 70) 
      
      recs.sort((a, b) => b.chance - a.chance);

      const payload = { finalScore, recommendations: recs.slice(0, 20) };
      setCacheValue(`recs:${userId}:${input.tryoutId}`, payload, 5 * 60 * 1000);
      return payload;
    }),

  getProgramStudyDetail: protectedProcedure
    .input(z.object({ programId: z.string(), tryoutId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const cachedProgram = getCacheValue<Record<string, unknown>>(
        `program:${input.programId}:${input.tryoutId ?? ""}`
      );
      if (cachedProgram) return cachedProgram;

      const progResult = await ctx.db.findByID({
        collection: "university-programs",
        id: input.programId,
        depth: 1,
      });

      const prog = progResult as UniversityProgramDoc;
      if (!prog) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Program Studi tidak ditemukan" });
      }

      const universityId = extractId(
        (prog.university as { id?: unknown } | undefined)?.id ?? (prog.university as string | undefined)
      );
      let universityDoc: Record<string, unknown> | null = null;
      if (universityId) {
        try {
          universityDoc = (await ctx.db.findByID({
            collection: "universities",
            id: universityId,
            depth: 1,
          })) as unknown as Record<string, unknown>;
        } catch {
          universityDoc = null;
        }
      }

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

      const latestMetric = (prog.metrics?.[0] ?? {}) as ProgramMetric;

      let imageUrl: string | null = null;
      const rawImage = universityDoc?.image;
      if (rawImage && typeof rawImage === "object" && "url" in rawImage) {
        imageUrl = (rawImage as { url?: string }).url ?? null;
      } else if (typeof rawImage === "string") {
        const media = await ctx.db.findByID({ collection: "media", id: rawImage, depth: 0 });
        imageUrl = (media as { url?: string }).url ?? null;
      }

      const payload = {
        id: extractId(prog.id),
        name: prog.name,
        level: prog.level,
        category: prog.category,
        accreditation: prog.accreditation,
        faculty: prog.faculty,
        metrics: prog.metrics || [],
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
          id: universityId,
          name: (universityDoc?.name as string | undefined) ?? prog.universityName,
          abbreviation: (universityDoc?.abbreviation as string | undefined) ?? prog.abbreviation,
          status: (universityDoc?.status as string | undefined) ?? prog.status,
          accreditation: (universityDoc?.accreditation as string | undefined) ?? prog.universityAccreditation,
          website: (universityDoc?.website as string | undefined) ?? null,
          image: imageUrl,
        },
      };
      setCacheValue(`program:${input.programId}:${input.tryoutId ?? ""}`, payload, 10 * 60 * 1000);
      return payload;
    }),
});
