import z from "zod";
import { protectedProcedure } from "@/trpc/init";
import { Question } from "@/payload-types";
import { getCacheValue, setCacheValue } from "@/modules/tryouts/server/services/tryout-cache.service";
import { stripAnswerKeyFromSubtest } from "@/modules/tryouts/server/utils/procedure.utils";

export const getOne = protectedProcedure
  .input(
    z.object({
      tryoutId: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const cacheKey = `tryout:full:${input.tryoutId}`;
    const cached = await getCacheValue<{ tests: Question[]; [key: string]: unknown }>(cacheKey);
    if (cached) return cached;

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

    const result = {
      ...tryout,
      tests: runtimeTests,
    };
    await setCacheValue(cacheKey, result, 30 * 60 * 1000);
    return result;
  });

export const getMetadata = protectedProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    const cacheKey = `tryout:meta:${input.tryoutId}`;
    const cachedMeta = await getCacheValue<{ tests: Question[]; [key: string]: unknown }>(cacheKey);
    if (cachedMeta) return cachedMeta;

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
          tryoutQuestions: true,
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
          tryoutQuestions: true,
        },
      });
      finalTests = fallbackDocs.docs as Question[];
    }
    finalTests = finalTests.map((t) => ({
      ...t,
      duration: t.duration || 0,
      tryoutQuestions: t.tryoutQuestions || [],
    }));

    const metaResult = {
      ...tryout,
      tests: finalTests,
    };
    await setCacheValue(cacheKey, metaResult, 15 * 60 * 1000);
    return metaResult;
  });

export const getSubtest = protectedProcedure
  .input(z.object({ subtestId: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!input.subtestId || input.subtestId.trim().length === 0) {
      return null;
    }
    const cachedSubtest = await getCacheValue<Question>(
      `subtest:${input.subtestId}`
    );
    if (cachedSubtest) return cachedSubtest;
    const subtest = await ctx.db.findByID({
      collection: "questions",
      id: input.subtestId,
      depth: 2,
    });

    const payload = stripAnswerKeyFromSubtest(subtest as Question);
    await setCacheValue(`subtest:${input.subtestId}`, payload, 60 * 60 * 1000);
    return payload;
  });

export const getMany = protectedProcedure
  .input(
    z.object({
      year: z.string().nullable().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const cacheKey = `tryouts:list:${input.year ?? "all"}`;
    const cached = await getCacheValue<{
      docs: unknown[];
      totalDocs: number;
      [key: string]: unknown;
    }>(cacheKey);
    if (cached) {
      return cached;
    }
    const data = await ctx.db.find({
      collection: "tryouts",
      depth: 1,
      pagination: false,
      limit: 100,
    });
    const payload = {
      ...data,
      totalDocs: data.totalDocs,
    };
    await setCacheValue(cacheKey, payload, 10 * 60 * 1000);
    return payload;
  });
