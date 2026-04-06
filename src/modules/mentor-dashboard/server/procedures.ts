import z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "@/trpc/init";
import { adminProcedure } from "@/trpc/init";
import { getCacheValue, setCacheValue } from "@/modules/shared/server/services/cache.service";
import { extractId } from "@/modules/shared/utils/data.utils";
import { calculateChance, getMajorKeywords } from "@/modules/shared/utils/university.utils";
import type { ProgramMetric, UniversityProgramDoc } from "@/modules/shared/types/university.types";

export const mentorDashboardRouter = createTRPCRouter({
  getDashboardData: adminProcedure
    .input(z.object({ tryoutId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const tryoutWhere: any = input.tryoutId ? { tryout: { equals: input.tryoutId } } : {};
      
      const [scoresResult, settingsResponse] = await Promise.all([
        ctx.db.find({
          collection: "tryout-scores",
          where: tryoutWhere,
          limit: 1000,
          depth: 1, 
        }),
        ctx.db.findGlobal({
          slug: "app-settings",
          depth: 0,
        }).catch(() => null),
      ]);

      const scores = scoresResult.docs;
      const settings = (settingsResponse || {}) as Record<string, number>;

      const chanceConfig = {
        k: typeof settings.chanceAlgorithmK === 'number' ? settings.chanceAlgorithmK : 0.05,
        minPercent: typeof settings.chanceMinPercentage === 'number' ? settings.chanceMinPercentage : 5,
        maxPercent: typeof settings.chanceMaxPercentage === 'number' ? settings.chanceMaxPercentage : 95,
      };

      const thresholdSafe = typeof settings.targetAnalysisSafeThreshold === 'number' ? settings.targetAnalysisSafeThreshold : 70;
      const thresholdVerySafe = typeof settings.targetAnalysisVerySafeThreshold === 'number' ? settings.targetAnalysisVerySafeThreshold : 85;
      const thresholdCompetitive = typeof settings.targetAnalysisCompetitiveThreshold === 'number' ? settings.targetAnalysisCompetitiveThreshold : 50;
      const minChance = typeof settings.recommendationMinChance === 'number' ? settings.recommendationMinChance : 70;

      // Cache university programs to speed up lookups
      const cachedPrograms = await getCacheValue("mentor_univ_programs");
      let allPrograms: UniversityProgramDoc[] = [];
      
      if (cachedPrograms && Array.isArray(cachedPrograms) && cachedPrograms.length > 0) {
         allPrograms = cachedPrograms as UniversityProgramDoc[];
      } else {
         const rawPrograms = await ctx.db.find({
            collection: "university-programs",
            where: { category: { equals: "snbt" } },
            limit: 3000,
            depth: 0,
         });
         allPrograms = rawPrograms.docs as unknown as UniversityProgramDoc[];
         await setCacheValue("mentor_univ_programs", allPrograms, 1000 * 60 * 60 * 24); // 24h cache
      }

      const findProgram = (univName: string, majorName: string) => {
         if (!univName || !majorName) return null;
         const lowerUniv = univName.toLowerCase();
         const lowerMajor = majorName.toLowerCase();
         return allPrograms.find(p => 
            p.universityName && p.universityName.toLowerCase().includes(lowerUniv) &&
            p.name && p.name.toLowerCase().includes(lowerMajor)
         );
      };

      const evaluateChoice = (univName?: string, majorName?: string, score: number = 0) => {
         if (!univName || !majorName) return { found: false, targetPTN: univName, targetMajor: majorName };
         const match = findProgram(univName, majorName);
         if (!match) return { found: true, passingGrade: 0, targetPTN: univName, targetMajor: majorName, chance: 0, level: "Tidak Diketahui" };
         
         const latestMetric = (match.metrics?.[0] ?? {}) as ProgramMetric;
         const passingGrade = parseFloat(latestMetric.admissionMetric || match.admissionMetric || "0") || 0;
         if (passingGrade <= 0) return { found: true, passingGrade: 0, targetPTN: univName, targetMajor: majorName, dbUnivName: match.universityName, dbMajorName: match.name, chance: 0, level: "Data Kosong" };

         const chance = calculateChance(score, passingGrade, chanceConfig);
         let level = "Sangat Sulit";
         if (chance >= thresholdVerySafe) level = "Sangat Aman";
         else if (chance >= thresholdSafe) level = "Aman";
         else if (chance >= thresholdCompetitive) level = "Kompetitif";
         else level = "Risiko";

         return {
            found: true,
            targetPTN: univName,
            targetMajor: majorName,
            dbUnivName: match.universityName,
            dbMajorName: match.name,
            chance,
            level,
            passingGrade
         };
      };

      const mapRecommendations = (userData: any, score: number) => {
         const kw1 = getMajorKeywords(userData.targetMajor ?? "");
         const kw2 = getMajorKeywords(userData.targetMajor2 ?? "");
         const allKws = Array.from(new Set([...kw1, ...kw2])).filter(Boolean);
         
         if (allKws.length === 0) return [];
         return allPrograms.filter(prog => {
            const latestMetric = (prog.metrics?.[0] ?? {}) as ProgramMetric;
            const passingGrade = parseFloat(latestMetric.admissionMetric || prog.admissionMetric || "0") || 0;
            if (passingGrade <= 0) return false;
            
            const pName = prog.name || "";
            const matchKw = allKws.some(kw => pName.toLowerCase().includes(kw.toLowerCase()));
            if (!matchKw) return false;

            const chance = calculateChance(score, passingGrade, chanceConfig);
            return chance >= minChance;
         }).map(prog => {
            const latestMetric = (prog.metrics?.[0] ?? {}) as ProgramMetric;
            const passingGrade = parseFloat(latestMetric.admissionMetric || prog.admissionMetric || "0") || 0;
            return {
               name: prog.name,
               universityName: prog.universityName,
               chance: calculateChance(score, passingGrade, chanceConfig),
            }
         }).sort((a,b) => b.chance - a.chance).slice(0, 5); // Top 5 alternatives
      }

      const results = scores.map(row => {
         const s = row as any;
         const finalScore = s.finalScore || 0;
         const user = s.user || {};
         
         const choice1 = evaluateChoice(user.targetPTN, user.targetMajor, finalScore);
         const choice2 = evaluateChoice(user.targetPTN2, user.targetMajor2, finalScore);
         const choice3 = evaluateChoice(user.targetPTN3, user.targetMajor3, finalScore);

         const alternatives = mapRecommendations(user, finalScore);
         const tryout = s.tryout || {};

         return {
            id: s.id,
            tryout: {
               id: tryout.id || s.tryout,
               title: tryout.title || "Unknown Tryout",
            },
            createdAt: s.createdAt,
            user: {
               id: user.id,
               fullName: user.fullName || "Unknown",
               email: user.email || "",
               whatsapp: user.whatsapp || "",
               schoolOrigin: user.schoolOrigin || "",
               targetPTN: user.targetPTN || "",
            },
            scoreDetails: {
               score_PU: s.score_PU || 0,
               score_PK: s.score_PK || 0,
               score_PM: s.score_PM || 0,
               score_LBE: s.score_LBE || 0,
               score_LBI: s.score_LBI || 0,
               score_PPU: s.score_PPU || 0,
               score_KMBM: s.score_KMBM || 0,
               finalScore: finalScore,
            },
            analysis: {
               choice1,
               choice2,
               choice3,
               alternatives
            }
         }
      });

       return results;
    }),

  getDetailedSubtestStats: adminProcedure
    .query(async ({ ctx }) => {
      const CACHE_KEY = "mentor_dashboard_subtest_stats_v2";
      const cachedData = await getCacheValue(CACHE_KEY);
      if (cachedData) return cachedData;

      const [attemptsResponse, questionsResponse] = await Promise.all([
        ctx.db.find({
          collection: "tryout-attempts",
          where: { status: { equals: "completed" } },
          limit: 5000,
          depth: 1,
          // DB Memory Protection: Select only required fields
          select: { tryout: true, questionResults: true },
        }),
        ctx.db.find({
          collection: "questions",
          limit: 5000,
          depth: 0,
          select: { subtest: true },
        })
      ]);

      const questionSubtestMap = new Map<string, string>();
      for (const q of questionsResponse.docs as any[]) {
         if (q.id) questionSubtestMap.set(String(q.id), q.subtest || "Unknown");
      }

      const aggregated: Record<string, Record<string, { totalCorrect: number, totalWrong: number, totalEmpty: number, count: number }>> = {};

      for (const doc of attemptsResponse.docs) {
        const attempt = doc as any;
        const tryoutTitle = attempt.tryout?.title || "Unknown Tryout";
        
        if (!aggregated[tryoutTitle]) {
           aggregated[tryoutTitle] = {};
        }

        const qResults = Array.isArray(attempt.questionResults) ? attempt.questionResults : [];
        if (qResults.length === 0) continue;

        const stCounts: Record<string, { c: number, w: number, e: number }> = {};
        
        for (const qr of qResults) {
           const rawId = qr.subtestId || "Unknown";
           const stId = questionSubtestMap.get(String(rawId)) || "Unknown";
           if (!stCounts[stId]) stCounts[stId] = { c: 0, w: 0, e: 0 };
           
           if (qr.isCorrect === true) {
              stCounts[stId].c += 1;
           } else {
              const hasAnswer = (typeof qr.selectedLetter === 'string' && qr.selectedLetter.trim().length > 0);
              if (hasAnswer) stCounts[stId].w += 1;
              else stCounts[stId].e += 1;
           }
        }

        for (const [stId, counts] of Object.entries(stCounts)) {
           if (!aggregated[tryoutTitle][stId]) {
              aggregated[tryoutTitle][stId] = { totalCorrect: 0, totalWrong: 0, totalEmpty: 0, count: 0 };
           }
           aggregated[tryoutTitle][stId].totalCorrect += counts.c;
           aggregated[tryoutTitle][stId].totalWrong += counts.w;
           aggregated[tryoutTitle][stId].totalEmpty += counts.e;
           aggregated[tryoutTitle][stId].count += 1;
        }
      }

      const finalAverages: Record<string, Record<string, { avgCorrect: number, avgWrong: number, avgEmpty: number, count: number }>> = {};
      for (const [toTitle, stData] of Object.entries(aggregated)) {
         finalAverages[toTitle] = {};
         for (const [stId, totals] of Object.entries(stData)) {
            const count = totals.count > 0 ? totals.count : 1;
             finalAverages[toTitle][stId] = {
                avgCorrect: Math.round((totals.totalCorrect / count) * 10) / 10,
                avgWrong: Math.round((totals.totalWrong / count) * 10) / 10,
                avgEmpty: Math.round((totals.totalEmpty / count) * 10) / 10,
                count: totals.count
             };
         }
      }

      await setCacheValue(CACHE_KEY, finalAverages, 1000 * 60 * 60 * 12); // 12h cache
      return finalAverages;
    }),

  getCompletionAnalytics: adminProcedure
    .query(async ({ ctx }) => {
      const CACHE_KEY = "mentor_dashboard_completion_analytics_v2";
      const cached = await getCacheValue(CACHE_KEY);
      if (cached) return cached;

      const [attemptsReq, scoresReq] = await Promise.all([
         ctx.db.find({ 
            collection: "tryout-attempts", 
            limit: 5000, 
            depth: 1, 
            sort: "-createdAt",
            select: { user: true, tryout: true, status: true, resultPlan: true, paymentMethod: true, createdAt: true }
         }),
         ctx.db.find({ 
            collection: "tryout-scores", 
            limit: 5000, 
            depth: 0,
            select: { attempt: true, user: true, tryout: true, finalScore: true }
         }),
      ]);

      const scoresDocs = scoresReq.docs as any[];
      const publishedAttemptIds = new Set<string>();
      const scoreMap = new Map<string, number>();
      const scoreByUserTryout = new Map<string, number>();

      const getId = (value: unknown): string | null => {
        if (typeof value === "string" || typeof value === "number") return String(value);
        if (value && typeof value === "object" && "id" in value) {
          const id = (value as { id?: unknown }).id;
          if (typeof id === "string" || typeof id === "number") return String(id);
        }
        return null;
      };

      for (const sc of scoresDocs) {
         const attId = getId(sc.attempt);
         const userId = getId(sc.user);
         const tryoutId = getId(sc.tryout);
         if (attId) {
            publishedAttemptIds.add(attId);
            scoreMap.set(attId, sc.finalScore || 0);
         }
         if (userId && tryoutId) {
            scoreByUserTryout.set(`${userId}::${tryoutId}`, sc.finalScore || 0);
         }
      }

      // Keep one representative attempt per user+tryout:
      // prefer latest completed attempt, otherwise latest attempt.
      const attemptsByUserTryout = new Map<string, any>();
      for (const doc of attemptsReq.docs as any[]) {
         const att = doc as any;
         const userId = getId(att.user);
         const tryoutId = getId(att.tryout);
         if (!userId || !tryoutId) continue;
         const key = `${userId}::${tryoutId}`;
         const existing = attemptsByUserTryout.get(key);
         if (!existing) {
            attemptsByUserTryout.set(key, att);
            continue;
         }
         const existingCompleted = existing.status === "completed";
         const currentCompleted = att.status === "completed";
         if (!existingCompleted && currentCompleted) {
            attemptsByUserTryout.set(key, att);
         }
      }

      const rows = Array.from(attemptsByUserTryout.values()).map((att) => {
         const user = att.user || {};
         const to = att.tryout || {};

         const attemptId = getId(att.id) || "";
         const userId = getId(att.user);
         const tryoutId = getId(att.tryout);
         const scoreKey = userId && tryoutId ? `${userId}::${tryoutId}` : null;

         const hasScoreByAttempt = publishedAttemptIds.has(attemptId);
         const hasScoreByUserTryout = scoreKey ? scoreByUserTryout.has(scoreKey) : false;
         const isPublished = hasScoreByAttempt || hasScoreByUserTryout;
         let finalScore = 0;
         if (hasScoreByAttempt) {
           finalScore = scoreMap.get(attemptId) || 0;
         } else if (scoreKey) {
           finalScore = scoreByUserTryout.get(scoreKey) || 0;
         }

         return {
            id: att.id,
            userName: user.fullName || user.username || "Unknown",
            userEmail: user.email || "",
            tryoutTitle: to.title || "Unknown Tryout",
            status: att.status || "started",
            completionStatus: att.status === "completed" ? "Selesai" : "Mengerjakan",
            scoreStatus: isPublished ? "Sudah Rilis" : "Belum Rilis",
            finalScore: isPublished ? finalScore : null,
            resultPlan: att.resultPlan || "none",
            paymentMethod: att.paymentMethod || "none",
            createdAt: att.createdAt,
            completedAt: att.completedAt || null,
         };
      });

      await setCacheValue(CACHE_KEY, rows, 1000 * 60 * 10); // 10m cache
      return rows;
    }),

  getTargetPtnAnalysis: adminProcedure
    .query(async ({ ctx }) => {
      const CACHE_KEY = "mentor_dashboard_ptn_analysis_v1";
      const cached = await getCacheValue(CACHE_KEY);
      if (cached) return cached;

      const scoresReq = await ctx.db.find({
        collection: "tryout-scores",
        limit: 5000,
        depth: 1,
      });

      const ptnStats: Record<string, { total: number; safe: number }> = {};

      for (const doc of scoresReq.docs) {
        const score = doc as any;
        const user = score.user || {};
        const ptn = user.targetPTN;
        if (!ptn) continue;

        if (!ptnStats[ptn]) ptnStats[ptn] = { total: 0, safe: 0 };
        ptnStats[ptn].total += 1;
        
        // Use 500 as a simple "safe" threshold for global analysis if not specified
        if ((score.finalScore || 0) >= 500) {
          ptnStats[ptn].safe += 1;
        }
      }

      const results = Object.entries(ptnStats)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          passRate: Math.round((stats.safe / stats.total) * 100),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      await setCacheValue(CACHE_KEY, results, 1000 * 60 * 60 * 12);
      return results;
    }),

  getQuestionAnalysis: adminProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      // 1. Ambil data Tryout dan Subtestnya (termasuk soal-soalnya)
      const questionsResult = await ctx.db.find({
        collection: "questions",
        where: { tryout: { equals: input.tryoutId } },
        limit: 200,
        sort: "createdAt",
        depth: 2, // Ambil detail tryoutQuestions dan tryoutAnswers
      });
      const subtests = questionsResult.docs;

      // Buat map soal dari database untuk akses cepat.
      // Support data lama yang mungkin tidak menyimpan q.id konsisten.
      const dbQuestionsMap = new Map<string, any>();
      const questionNumberToId = new Map<string, string>();
      for (const subtest of subtests as any[]) {
        const subtestId = String(subtest.id);
        const questions = Array.isArray(subtest.tryoutQuestions)
          ? subtest.tryoutQuestions
          : [];
        questions.forEach((q: any, idx: number) => {
          const qNum = idx + 1;
          const resolvedId = q?.id ? String(q.id) : `${subtestId}::${qNum}`;
          dbQuestionsMap.set(resolvedId, q);
          if (q?.id) {
            dbQuestionsMap.set(String(q.id), q);
          }
          questionNumberToId.set(`${subtestId}:${qNum}`, resolvedId);
        });
      }

      // 2. Ambil semua attempt yang sudah selesai untuk Tryout ini
      const attemptsResult = await ctx.db.find({
        collection: "tryout-attempts",
        where: {
          and: [
            { tryout: { equals: input.tryoutId } },
            { status: { equals: "completed" } },
          ],
        },
        limit: 5000,
        depth: 0,
        select: { questionResults: true },
      });
      const attempts = attemptsResult.docs;

      // 3. Agregasi data statistik per soal
      const questionStats: Record<string, { correct: number; total: number; subtestId: string; questionNumber: number }> = {};

      for (const attempt of attempts as any[]) {
        const results = attempt.questionResults || [];
        for (const res of results) {
          const rawQId = res?.questionId ? String(res.questionId) : "";
          const subtestId = res?.subtestId ? String(res.subtestId) : "";
          const qNumber =
            typeof res?.questionNumber === "number" && Number.isFinite(res.questionNumber)
              ? Math.max(1, Math.floor(res.questionNumber))
              : null;
          const fallbackId =
            subtestId && qNumber !== null
              ? questionNumberToId.get(`${subtestId}:${qNumber}`)
              : undefined;
          const qId = dbQuestionsMap.has(rawQId)
            ? rawQId
            : fallbackId ?? rawQId;
          if (!qId) continue;
          if (!questionStats[qId]) {
            questionStats[qId] = {
              correct: 0, 
              total: 0, 
              subtestId,
              questionNumber: qNumber ?? 0,
            };
          }
          questionStats[qId].total++;
          if (res.isCorrect) {
            questionStats[qId].correct++;
          }
        }
      }

      // 4. Kelompokkan berdasarkan Subtest dan hitung persentase
      const analysisBySubtest: Record<string, any[]> = {};
      const hardestPerSubtest: any[] = [];
      const easiestPerSubtest: any[] = [];

      let totalCorrectnessSum = 0;
      let totalQuestionsCount = 0;

      for (const subtest of subtests as any[]) {
        const subtestId = String(subtest.id);
        const subtestName = subtest.subtest || subtest.title || "Tanpa Nama";
        
        const questionEntries = (Array.isArray(subtest.tryoutQuestions) ? subtest.tryoutQuestions : [])
          .map((q: any, idx: number) => {
            const qNum = idx + 1;
            const resolvedId = q?.id ? String(q.id) : `${subtestId}::${qNum}`;
            return { q, qNum, resolvedId };
          });

        const stats = questionEntries.map(({ q, qNum, resolvedId }: any) => {
          const data = questionStats[resolvedId] || { correct: 0, total: 0, questionNumber: 0 };
          const dbQuestion = dbQuestionsMap.get(resolvedId) ?? q;
          
          const correctness = data.total > 0 ? (data.correct / data.total) * 100 : 0;
          totalCorrectnessSum += correctness;
          totalQuestionsCount++;

          return {
            questionId: resolvedId,
            questionNumber: data.questionNumber || qNum,
            correct: data.correct,
            wrong: data.total - data.correct,
            total: data.total,
            correctness: Math.round(correctness * 10) / 10,
            content: dbQuestion?.question ?? dbQuestion?.questionContent ?? null,
            image: dbQuestion?.questionImage ?? null,
            options: (dbQuestion?.tryoutAnswers || []).map((opt: any) => ({
              id: opt.id,
              content: opt.answer ?? opt.answerContent ?? null,
              isCorrect: opt.isCorrect
            }))
          };
        }).sort((a: any, b: any) => a.questionNumber - b.questionNumber);

        if (stats.length > 0) {
          analysisBySubtest[subtestName] = stats;
          
          // Cari soal paling sulit dan termudah di subtest ini
          const sorted = [...stats].sort((a, b) => a.correctness - b.correctness);
          hardestPerSubtest.push({
            subtest: subtestName,
            ...sorted[0]
          });
          easiestPerSubtest.push({
            subtest: subtestName,
            ...sorted[sorted.length - 1]
          });
        }
      }

      return {
        summary: {
          totalAttempts: attempts.length,
          overallAverageCorrectness: totalQuestionsCount > 0 
            ? Math.round((totalCorrectnessSum / totalQuestionsCount) * 10) / 10 
            : 0,
          hardestPerSubtest,
          easiestPerSubtest,
        },
        analysisBySubtest,
      };
    })
});
