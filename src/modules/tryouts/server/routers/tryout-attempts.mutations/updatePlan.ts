import z from "zod";

import { protectedProcedure } from "@/trpc/init";
import { validateTryoutAttempt } from "@/modules/tryouts/utils/tryout-utils";

import type { TryoutAttempt } from "@/modules/tryouts/types";

export const updatePlan = protectedProcedure
  .input(
    z.object({
      attemptId: z.string(),
      plan: z.enum(["free", "paid"]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db: payload, session } = ctx;

    const attemptRaw = (await payload.findByID({
      collection: "tryout-attempts",
      id: input.attemptId,
    })) as unknown as TryoutAttempt;

    validateTryoutAttempt(attemptRaw, session.user.id, {
      allowCompleted: true,
    });

    await payload.update({
      collection: "tryout-attempts",
      id: input.attemptId,
      data: {
        resultPlan: input.plan,
      },
    });

    return { success: true };
  });
