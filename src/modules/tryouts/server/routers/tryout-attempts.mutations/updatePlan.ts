import z from "zod";

import { protectedProcedure } from "@/trpc/init";
import { getTryoutId, validateTryoutAttempt } from "@/modules/tryouts/utils/tryout-utils";

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

    const tryoutId = getTryoutId(attemptRaw.tryout);

    await payload.update({
      collection: "tryout-attempts",
      id: input.attemptId,
      data: {
        resultPlan: input.plan,
      },
    });

    let paymentStatus: "none" | "pending" | "verified" | "rejected" = "none";

    if (input.plan === "paid") {
      const existingPayments = await payload.find({
        collection: "tryout-payments",
        where: {
          and: [
            { user: { equals: session.user.id } },
            { tryout: { equals: tryoutId } },
            { attempt: { equals: input.attemptId } },
          ],
        },
        limit: 1,
        sort: "-createdAt",
        depth: 0,
      });

      const existingPayment = existingPayments.docs[0] as { id?: string; status?: "pending" | "verified" | "rejected" } | undefined;

      if (existingPayment?.id) {
        const updated = await payload.update({
          collection: "tryout-payments",
          id: existingPayment.id,
          data: {
            status: existingPayment.status === "verified" ? "verified" : "pending",
            paymentDate: new Date().toISOString(),
          },
        });
        paymentStatus = (updated as { status?: "pending" | "verified" | "rejected" }).status ?? "pending";
      } else {
        const created = await payload.create({
          collection: "tryout-payments",
          data: {
            user: session.user.id,
            tryout: tryoutId,
            attempt: input.attemptId,
            status: "pending",
            paymentDate: new Date().toISOString(),
          },
        });
        paymentStatus = (created as { status?: "pending" | "verified" | "rejected" }).status ?? "pending";
      }
    }

    return { success: true, paymentStatus };
  });
