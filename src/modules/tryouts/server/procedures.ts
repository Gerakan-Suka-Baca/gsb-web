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
