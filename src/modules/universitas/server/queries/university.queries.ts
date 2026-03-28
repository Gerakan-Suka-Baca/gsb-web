/**
 * Universitas queries — university program detail, recommendations, target analysis.
 * Moved from tryouts/server/queries/ since these are university-focused.
 */

import z from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "@/trpc/init";
import { getCacheValue, setCacheValue } from "@/modules/shared/server/services/cache.service";
import { extractId } from "@/modules/shared/utils/data.utils";
import { calculateChance, getMajorKeywords } from "@/modules/shared/utils/university.utils";
import type { ProgramMetric, TryoutScoreDoc, UniversityProgramDoc } from "@/modules/shared/types/university.types";

// ─── getProgramStudyDetail ─────────────────────────────────────────────────────

export const getProgramStudyDetail = protectedProcedure
  .input(z.object({ programId: z.string(), tryoutId: z.string().optional() }))
  .query(async ({ ctx, input }) => {
    const cachedProgram = await getCacheValue<Record<string, unknown>>(
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
    await setCacheValue(`program:${input.programId}:${input.tryoutId ?? ""}`, payload, 10 * 60 * 1000);
    return payload;
  });

// ─── getRecommendations ────────────────────────────────────────────────────────

export const getRecommendations = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) return null;
    const [user, scoreResult] = await Promise.all([
      ctx.db.findByID({
        collection: "users",
        id: userId,
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
    ]);

    if (!user) return null;

    const scoreDoc = (scoreResult.docs[0] ?? undefined) as TryoutScoreDoc | undefined;
    const finalScore = (scoreDoc?.finalScore as number) ?? 0;

    // Fetch App Settings
    const settingsResponse = await ctx.db.findGlobal({
      // @ts-expect-error: payload-types might not be synced yet
      slug: "app-settings",
      depth: 0,
    }).catch(() => null);
    const settings = (settingsResponse || {}) as Record<string, number>;

    const chanceConfig = {
      k: typeof settings.chanceAlgorithmK === 'number' ? settings.chanceAlgorithmK : 0.05,
      minPercent: typeof settings.chanceMinPercentage === 'number' ? settings.chanceMinPercentage : 5,
      maxPercent: typeof settings.chanceMaxPercentage === 'number' ? settings.chanceMaxPercentage : 95,
    };

    const maxResults = typeof settings.recommendationMaxResults === 'number' ? settings.recommendationMaxResults : 20;
    const minChance = typeof settings.recommendationMinChance === 'number' ? settings.recommendationMinChance : 70;
    const searchLimit = typeof settings.universitySearchLimit === 'number' ? settings.universitySearchLimit : 300;

    const userProfile = user as {
      targetMajor?: string;
      targetMajor2?: string;
    };
    const kw1 = getMajorKeywords(userProfile.targetMajor ?? "");
    const kw2 = getMajorKeywords(userProfile.targetMajor2 ?? "");
    const allKws = Array.from(new Set([...kw1, ...kw2])).filter(Boolean);
    const recsCacheKey = `recs:${userId}:${input.tryoutId}:score:${finalScore}:kws:${allKws.join(",")}`;
    const cachedRecs = await getCacheValue<{ finalScore: number; recommendations: unknown[] }>(
      recsCacheKey
    );
    if (cachedRecs) return cachedRecs;

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
      limit: searchLimit,
      depth: 0,
    });

    const allMatches = rawPrograms.docs as UniversityProgramDoc[];

    const recs = allMatches.map((prog) => {
      const latestMetric = (prog.metrics?.[0] ?? {}) as ProgramMetric;
      const passingGrade = parseFloat(latestMetric.admissionMetric || prog.admissionMetric || "0") || 0;
      
      // If no valid passing grade, we can't reliably recommend it.
      if (passingGrade <= 0) return null;

      const chance = calculateChance(finalScore, passingGrade, chanceConfig);

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
    }).filter((r): r is NonNullable<typeof r> => r !== null && r.chance >= minChance);

    recs.sort((a, b) => b.chance - a.chance);

    const payload = { finalScore, recommendations: recs.slice(0, maxResults) };
    await setCacheValue(recsCacheKey, payload, 5 * 60 * 1000);
    return payload;
  });

// ─── getTargetAnalysis ─────────────────────────────────────────────────────────

export const getTargetAnalysis = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) return null;
    const [user, scoreResult] = await Promise.all([
      ctx.db.findByID({
        collection: "users",
        id: userId,
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
    ]);

    if (!user) return null;

    const scoreDoc = (scoreResult.docs[0] ?? undefined) as TryoutScoreDoc | undefined;
    const finalScore = (scoreDoc?.finalScore as number) ?? 0;

    // Fetch App Settings
    const settingsResponse = await ctx.db.findGlobal({
      // @ts-expect-error: payload-types might not be synced yet
      slug: "app-settings",
      depth: 0,
    }).catch(() => null);
    const settings = (settingsResponse || {}) as Record<string, number>;

    const chanceConfig = {
      k: typeof settings.chanceAlgorithmK === 'number' ? settings.chanceAlgorithmK : 0.05,
      minPercent: typeof settings.chanceMinPercentage === 'number' ? settings.chanceMinPercentage : 5,
      maxPercent: typeof settings.chanceMaxPercentage === 'number' ? settings.chanceMaxPercentage : 95,
    };

    const thresholdSafe = typeof settings.targetAnalysisSafeThreshold === 'number' ? settings.targetAnalysisSafeThreshold : 70;
    const thresholdVerySafe = typeof settings.targetAnalysisVerySafeThreshold === 'number' ? settings.targetAnalysisVerySafeThreshold : 85;
    const thresholdCompetitive = typeof settings.targetAnalysisCompetitiveThreshold === 'number' ? settings.targetAnalysisCompetitiveThreshold : 50;
    const userData = user as {
      targetPTN?: string;
      targetMajor?: string;
      targetPTN2?: string;
      targetMajor2?: string;
      targetPTN3?: string;
      targetMajor3?: string;
    };
    const targetSignature = [
      userData.targetPTN ?? "",
      userData.targetMajor ?? "",
      userData.targetPTN2 ?? "",
      userData.targetMajor2 ?? "",
      userData.targetPTN3 ?? "",
      userData.targetMajor3 ?? "",
    ].join("|");
    const targetCacheKey = `target:${userId}:${input.tryoutId}:score:${finalScore}:targets:${targetSignature}`;
    const cachedTarget = await getCacheValue<{
      finalScore: number;
      choice1: unknown;
      choice2: unknown;
      choice3: unknown;
    }>(targetCacheKey);
    if (cachedTarget) return cachedTarget;

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

      const chance = calculateChance(finalScore, passingGrade, chanceConfig);

      let level = "Sangat Sulit";
      let color = "red";

      if (chance >= thresholdVerySafe) { level = "Sangat Aman"; color = "green"; }
      else if (chance >= thresholdSafe) { level = "Aman"; color = "green"; }
      else if (chance >= thresholdCompetitive) { level = "Kompetitif"; color = "yellow"; }
      else { level = "Risiko"; color = "red"; }

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

    const choice1 = await searchProgram(userData.targetPTN ?? "", userData.targetMajor ?? "");
    const choice2 = await searchProgram(userData.targetPTN2 ?? "", userData.targetMajor2 ?? "");
    const choice3 = await searchProgram(userData.targetPTN3 ?? "", userData.targetMajor3 ?? "");

    const payload = {
      finalScore,
      choice1: choice1 || { found: false, targetPTN: userData.targetPTN, targetMajor: userData.targetMajor },
      choice2: choice2 || { found: false, targetPTN: userData.targetPTN2, targetMajor: userData.targetMajor2 },
      choice3: choice3 || { found: false, targetPTN: userData.targetPTN3, targetMajor: userData.targetMajor3 },
    };
    await setCacheValue(targetCacheKey, payload, 3 * 60 * 1000);
    return payload;
  });
