import z from "zod";

import { optionalUserProcedure } from "@/trpc/init";
import { isRetakeActive } from "@/modules/tryouts/server/helpers/tryout-attempt-index.helpers";
import { loadAttemptProgress } from "@/modules/tryouts/server/services/tryout-attempts-progress.service";

import type { TryoutAttempt } from "@/modules/tryouts/types";

export const getAttempt = optionalUserProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!ctx.session) return null;
    const { db: payload } = ctx;
    const session = ctx.session!;
    const attempts = await payload.find({
      collection: "tryout-attempts",
      where: {
        and: [
          { user: { equals: session.user.id } },
          { tryout: { equals: input.tryoutId } },
        ],
      },
      limit: 1,
      sort: "-createdAt",
      depth: 0,
    });
    if (attempts.docs.length === 0) return null;
    const attempt = attempts.docs[0] as unknown as TryoutAttempt;
    const retakeActive = isRetakeActive(attempt);
    const cached = await loadAttemptProgress(attempt.id, retakeActive);
    if (!cached) return attempt;

    const attemptUpdatedAt = Date.parse(attempt.updatedAt ?? "");
    const shouldApply =
      Number.isNaN(attemptUpdatedAt) || cached.updatedAt > attemptUpdatedAt;
    if (!shouldApply) return attempt;

    return {
      ...attempt,
      ...(retakeActive
        ? {
            retakeAnswers: cached.answers ?? attempt.retakeAnswers,
            retakeFlags: cached.flags ?? attempt.retakeFlags,
            retakeProcessedBatchIds:
              cached.processedBatchIds ?? attempt.retakeProcessedBatchIds,
            retakeEventRevisions: cached.eventRevisions ?? attempt.retakeEventRevisions,
            retakeSubtestStates: cached.subtestStates ?? attempt.retakeSubtestStates,
            retakeSubtestSnapshots:
              cached.subtestSnapshots ?? attempt.retakeSubtestSnapshots,
            retakeSubtestDurations:
              cached.subtestDurations ?? attempt.retakeSubtestDurations,
            retakeCurrentSubtest: cached.currentSubtest ?? attempt.retakeCurrentSubtest,
            retakeCurrentQuestionIndex:
              cached.currentQuestionIndex ?? attempt.retakeCurrentQuestionIndex,
            retakeSubtestStartedAt:
              cached.subtestStartedAt ?? attempt.retakeSubtestStartedAt,
            retakeSubtestDeadlineAt:
              cached.subtestDeadlineAt ?? attempt.retakeSubtestDeadlineAt,
            retakeSecondsRemaining:
              cached.secondsRemaining ?? attempt.retakeSecondsRemaining,
          }
        : {
            answers: cached.answers ?? attempt.answers,
            flags: cached.flags ?? attempt.flags,
            processedBatchIds: cached.processedBatchIds ?? attempt.processedBatchIds,
            eventRevisions: cached.eventRevisions ?? attempt.eventRevisions,
            subtestStates: cached.subtestStates ?? attempt.subtestStates,
            subtestSnapshots: cached.subtestSnapshots ?? attempt.subtestSnapshots,
            subtestDurations: cached.subtestDurations ?? attempt.subtestDurations,
            currentSubtest: cached.currentSubtest ?? attempt.currentSubtest,
            currentQuestionIndex:
              cached.currentQuestionIndex ?? attempt.currentQuestionIndex,
            subtestStartedAt: cached.subtestStartedAt ?? attempt.subtestStartedAt,
            subtestDeadlineAt: cached.subtestDeadlineAt ?? attempt.subtestDeadlineAt,
            secondsRemaining: cached.secondsRemaining ?? attempt.secondsRemaining,
          }),
      ...(cached.examState ? { examState: cached.examState } : {}),
      ...(cached.bridgingExpiry ? { bridgingExpiry: cached.bridgingExpiry } : {}),
      ...(cached.heartbeatAt ? { heartbeatAt: cached.heartbeatAt } : {}),
    } as TryoutAttempt;
  });

export const getMyAttempts = optionalUserProcedure.query(async ({ ctx }) => {
  if (!ctx.session) return [];
  const { db: payload } = ctx;
  const session = ctx.session!;
  const attempts = await payload.find({
    collection: "tryout-attempts",
    where: { user: { equals: session.user.id } },
    depth: 1,
    pagination: false,
    sort: "-createdAt",
  });
  return attempts.docs as unknown as TryoutAttempt[];
});
