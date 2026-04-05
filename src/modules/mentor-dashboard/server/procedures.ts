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

      // Cache university-programs to heavily reduce load time
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
         await setCacheValue("mentor_univ_programs", allPrograms, 60 * 60 * 24); // 24 hours
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
         }).sort((a,b) => b.chance - a.chance).slice(0, 5); // TOP 5 Alternatif
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
    })
});
