import z from "zod";

import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { Test } from "@/payload-types";

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
        depth: 4,
      });

      return {
        ...tryout,
        tests: tryout.tests as Test[] | [],
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
        depth: 2,
        pagination: false,
        limit: 100,
      });

      return {
        ...data,
        totalDocs: data.totalDocs,
      };
    }),
});
