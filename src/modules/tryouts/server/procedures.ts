import z from "zod";

import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Question } from "@/payload-types";

export const tryoutsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        tryoutId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tryout = await ctx.db.findByID({
        collection: "tryouts",
        id: input.tryoutId,
        depth: 0,
      });

      const questions = await ctx.db.find({
        collection: "questions",
        where: {
          tryout: {
            equals: input.tryoutId,
          },
        },
        limit: 200, 
        sort: "createdAt",
        depth: 1, 
      });

      return {
        ...tryout,
        tests: questions.docs as Question[] | [],
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

      // 1. Get manually ordered IDs (normalize to string)
      const rawTryout = tryout as { questions?: Array<string | { id?: string }> };
      const orderedIds: string[] = (Array.isArray(rawTryout.questions) ? rawTryout.questions : [])
        .map((q) => (typeof q === "string" ? q : q?.id ? String(q.id) : null))
        .filter((id): id is string => id !== null);

      let finalTests: Question[] = [];

      if (orderedIds.length > 0) {
        // 2. Fetch metadata for these specific IDs
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

        // 3. Sort to match manual order
        const docsMap = new Map(manualDocs.docs.map((d) => [String(d.id), d]));
        finalTests = orderedIds
          .map((id) => docsMap.get(id))
          .filter((doc): doc is Question => !!doc);
      }

      // 4. Fallback: If manual list yielded 0 results 
      if (finalTests.length === 0) {
        const fallbackDocs = await ctx.db.find({
          collection: "questions",
          where: { tryout: { equals: input.tryoutId } },
          limit: 200,
          sort: "createdAt",
          depth: 0, // Metadata only
          select: {
            id: true,
            title: true,
            duration: true,
            subtest: true,
          },
        });
        finalTests = fallbackDocs.docs as Question[];
      }

      // Ensure fields are present
      finalTests = finalTests.map(t => ({
        ...t,
        duration: t.duration || 0,
        tryoutQuestions: t.tryoutQuestions || [], // Ensure array exists
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
      return subtest as Question;
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
});
