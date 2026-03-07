import z from "zod";
import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/trpc/init";
import {
  calculateSubmissionResults,
  getTryoutId,
  validateTryoutAttempt,
} from "@/modules/tryouts/utils/tryout-utils";
import {
  assertTryoutWindowOpen,
  parseDateMs,
  SUBTEST_QUERY_LIMIT,
  type TryoutWindowDoc,
} from "@/modules/tryouts/server/helpers/tryout-window.helpers";
import { isRetakeActive } from "@/modules/tryouts/server/helpers/tryout-attempt-index.helpers";
import { getSecondsRemainingFromDeadline } from "@/modules/tryouts/server/helpers/tryout-timer.helpers";
import {
  clearAttemptProgress,
  loadAttemptProgress,
} from "@/modules/tryouts/server/services/tryout-attempts-progress.service";

import { mergeNestedMap } from "./progress.utils";

import type { Question } from "@/payload-types";
import type { TryoutAttempt } from "@/modules/tryouts/types";

export const submitAttempt = protectedProcedure
  .input(
    z.object({
      attemptId: z.string(),
      answers: z.record(z.string(), z.record(z.string(), z.string())),
      submitMode: z.enum(["manual", "timeout"]).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db: payload, session } = ctx;
    const now = new Date();
    const attemptRaw = (await payload.findByID({
      collection: "tryout-attempts",
      id: input.attemptId,
    })) as unknown as TryoutAttempt;

    const attempt = validateTryoutAttempt(attemptRaw, session.user.id, {
      allowCompleted: true,
    });

    const retakeActive = isRetakeActive(attempt);
    const cached = await loadAttemptProgress(attempt.id, retakeActive);
    if (attempt.status === "completed" && !retakeActive) return attempt;

    const tryoutId = getTryoutId(attempt.tryout);
    const deadlineAt =
      cached?.subtestDeadlineAt ??
      (retakeActive ? attempt.retakeSubtestDeadlineAt : attempt.subtestDeadlineAt);
    if (typeof deadlineAt !== "string" || parseDateMs(deadlineAt) === null) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Timer belum tervalidasi. Coba sinkronisasi ulang.",
      });
    }
    const remainingSeconds = getSecondsRemainingFromDeadline(deadlineAt, now);
    if (remainingSeconds > 0 && input.submitMode !== "manual") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Waktu subtes belum habis. Submit ditolak.",
      });
    }
    const tryout = await payload.findByID({
      collection: "tryouts",
      id: tryoutId,
      depth: 2,
    });
    // Active attempts (status === "started") can submit even after window closes
    if (attempt.status !== "started") {
      assertTryoutWindowOpen(tryout as unknown as TryoutWindowDoc, "submit tryout", now);
    }

    const subtestsResult = await payload.find({
      collection: "questions",
      where: { tryout: { equals: tryoutId } },
      limit: SUBTEST_QUERY_LIMIT,
      sort: "createdAt",
      depth: 2,
    });
    const subtests = (subtestsResult.docs as unknown as Question[]) || [];

    if (subtests.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Tryout data invalid: questions not found",
      });
    }

    if (input.submitMode === "manual") {
      const activeSubtestIndex = retakeActive
        ? typeof attempt.retakeCurrentSubtest === "number"
          ? attempt.retakeCurrentSubtest
          : 0
        : typeof attempt.currentSubtest === "number"
          ? attempt.currentSubtest
          : 0;
      if (activeSubtestIndex < subtests.length - 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Masih ada subtes berikutnya. Selesaikan semua subtes dulu.",
        });
      }
    }

    const cachedAnswers =
      cached?.answers ?? (retakeActive ? attempt.retakeAnswers : attempt.answers) ?? {};
    const finalAnswers = mergeNestedMap(cachedAnswers, input.answers);
    const results = calculateSubmissionResults(subtests, finalAnswers);

    const updateData: Record<string, unknown> = retakeActive
      ? {
          retakeStatus: "completed",
          retakeCompletedAt: new Date().toISOString(),
          retakeAnswers: finalAnswers,
          retakeSecondsRemaining: remainingSeconds,
        }
      : {
          status: "completed",
          completedAt: new Date().toISOString(),
          answers: finalAnswers,
          score: results.score,
          correctAnswersCount: results.correctCount,
          totalQuestionsCount: results.totalQuestions,
          questionResults: results.questionResults,
          secondsRemaining: remainingSeconds,
        };

    const updated = await payload.update({
      collection: "tryout-attempts",
      id: input.attemptId,
      data: updateData,
    });
    await clearAttemptProgress(attempt.id);

    return updated as unknown as TryoutAttempt;
  });
