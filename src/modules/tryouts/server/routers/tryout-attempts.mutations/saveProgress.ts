import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/trpc/init";
import {
  calculateSubmissionResults,
  getTryoutId,
  validateTryoutAttempt,
} from "@/modules/tryouts/utils/tryout-utils";
import {
  assertTryoutWindowOpen,
  getTryoutWindow,
  SUBTEST_QUERY_LIMIT,
} from "@/modules/tryouts/server/helpers/tryout-window.helpers";
import {
  getAttemptSubtestIndex,
  getRetakeSubtestIndex,
  isRetakeActive,
} from "@/modules/tryouts/server/helpers/tryout-attempt-index.helpers";
import { canAdvanceSubtest } from "@/modules/tryouts/server/helpers/tryout-heartbeat.helpers";
import {
  buildRetakeTimerWindow,
  buildServerTimerWindow,
} from "@/modules/tryouts/server/helpers/tryout-timer.helpers";
import {
  PERSIST_INTERVAL_MS,
  redisEnabled,
  saveAttemptProgress,
  loadAttemptProgress,
} from "@/modules/tryouts/server/services/tryout-attempts-progress.service";

import { saveProgressInputSchema } from "./progress.schemas";
import {
  mergeNestedMap,
  normalizeExamState,
  normalizeNumberMap,
} from "./progress.utils";

import type { Question } from "@/payload-types";
import type { PayloadLike } from "@/modules/tryouts/server/helpers/tryout-window.helpers";
import type { TryoutAttempt } from "@/modules/tryouts/types";
import type { RedisAttemptState } from "@/modules/tryouts/server/services/tryout-attempts-progress.service";

export const saveProgress = protectedProcedure
  .input(saveProgressInputSchema)
  .mutation(async ({ ctx, input }) => {
    if (!redisEnabled) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Redis wajib aktif untuk menyimpan progres ujian.",
      });
    }
    const { db: payload, session } = ctx;
    const now = new Date();
    const nowIso = now.toISOString();
    const attemptRaw = (await payload.findByID({
      collection: "tryout-attempts",
      id: input.attemptId,
    })) as unknown as TryoutAttempt;

    const attempt = validateTryoutAttempt(attemptRaw, session.user.id);
    const tryoutId = getTryoutId(attempt.tryout);
    const tryoutWindow = await getTryoutWindow(payload as PayloadLike, tryoutId);
    // Active attempts can save progress even after window closes
    if (attempt.status !== "started") {
      assertTryoutWindowOpen(tryoutWindow, "menyimpan progres", now);
    }
    const retakeActive = isRetakeActive(attempt);
    const cached = await loadAttemptProgress(attempt.id, retakeActive);
    const baseAnswers =
      cached?.answers ?? (retakeActive ? attempt.retakeAnswers : attempt.answers) ?? {};
    const baseFlags =
      cached?.flags ?? (retakeActive ? attempt.retakeFlags : attempt.flags) ?? {};
    const baseProcessed =
      cached?.processedBatchIds ??
      (retakeActive ? attempt.retakeProcessedBatchIds : attempt.processedBatchIds) ??
      [];
    const baseEventRevisions = normalizeNumberMap(
      cached?.eventRevisions ??
        (retakeActive ? attempt.retakeEventRevisions : attempt.eventRevisions)
    );
    const baseSubtestStates =
      (cached?.subtestStates ??
        (retakeActive ? attempt.retakeSubtestStates : attempt.subtestStates) ??
        {}) as Record<string, string>;
    const baseSubtestSnapshots =
      (cached?.subtestSnapshots ??
        (retakeActive ? attempt.retakeSubtestSnapshots : attempt.subtestSnapshots) ??
        []) as unknown[];
    const baseSubtestDurations = normalizeNumberMap(
      cached?.subtestDurations ??
        (retakeActive ? attempt.retakeSubtestDurations : attempt.subtestDurations)
    );
    const baseCurrentSubtest =
      typeof cached?.currentSubtest === "number"
        ? cached.currentSubtest
        : retakeActive
          ? getRetakeSubtestIndex(attempt)
          : getAttemptSubtestIndex(attempt);
    const baseCurrentQuestionIndex =
      typeof cached?.currentQuestionIndex === "number"
        ? cached.currentQuestionIndex
        : retakeActive
          ? attempt.retakeCurrentQuestionIndex ?? 0
          : attempt.currentQuestionIndex ?? 0;
    const baseExamState = normalizeExamState(
      cached?.examState ?? attempt.examState
    ) as "running" | "bridging" | undefined;
    const baseBridgingExpiry = cached?.bridgingExpiry ?? attempt.bridgingExpiry;
    const baseSubtestStartedAt =
      cached?.subtestStartedAt ??
      (retakeActive ? attempt.retakeSubtestStartedAt : attempt.subtestStartedAt);
    const baseSubtestDeadlineAt =
      cached?.subtestDeadlineAt ??
      (retakeActive ? attempt.retakeSubtestDeadlineAt : attempt.subtestDeadlineAt);
    const baseSecondsRemaining =
      cached?.secondsRemaining ??
      (retakeActive ? attempt.retakeSecondsRemaining : attempt.secondsRemaining);
    const attemptWithCache: TryoutAttempt = {
      ...attempt,
      ...(retakeActive
        ? {
            retakeCurrentSubtest: baseCurrentSubtest,
            retakeCurrentQuestionIndex: baseCurrentQuestionIndex,
            retakeAnswers: baseAnswers,
            retakeFlags: baseFlags,
            retakeSubtestStartedAt: baseSubtestStartedAt,
            retakeSubtestDeadlineAt: baseSubtestDeadlineAt,
            retakeSecondsRemaining: baseSecondsRemaining,
          }
        : {
            currentSubtest: baseCurrentSubtest,
            currentQuestionIndex: baseCurrentQuestionIndex,
            answers: baseAnswers,
            flags: baseFlags,
            subtestStartedAt: baseSubtestStartedAt,
            subtestDeadlineAt: baseSubtestDeadlineAt,
            secondsRemaining: baseSecondsRemaining,
          }),
      ...(baseExamState ? { examState: baseExamState } : {}),
      ...(baseBridgingExpiry ? { bridgingExpiry: baseBridgingExpiry } : {}),
      ...(cached?.heartbeatAt ? { heartbeatAt: cached.heartbeatAt } : {}),
    };
    const attemptSubtest = retakeActive
      ? getRetakeSubtestIndex(attemptWithCache)
      : getAttemptSubtestIndex(attemptWithCache);
    const requestedSubtest =
      typeof input.currentSubtest === "number" && input.currentSubtest >= 0
        ? Math.floor(input.currentSubtest)
        : attemptSubtest;
    const canAdvanceState =
      input.examState === "bridging" || attemptWithCache.examState === "bridging";
    const canAdvance = canAdvanceSubtest(attemptWithCache, now);
    const nextSubtest =
      requestedSubtest > attemptSubtest && (!canAdvance || !canAdvanceState)
        ? attemptSubtest
        : requestedSubtest;
    const timerWindow = retakeActive
      ? await buildRetakeTimerWindow({
          payload: payload as PayloadLike,
          attempt: attemptWithCache,
          tryoutId,
          targetSubtest: nextSubtest,
          now,
          allowLegacySecondsFallback: true,
        })
      : await buildServerTimerWindow({
          payload: payload as PayloadLike,
          attempt: attemptWithCache,
          tryoutId,
          targetSubtest: nextSubtest,
          now,
          allowLegacySecondsFallback: true,
        });

    const subtestsResult = await payload.find({
      collection: "questions",
      where: { tryout: { equals: tryoutId } },
      limit: SUBTEST_QUERY_LIMIT,
      sort: "createdAt",
      depth: 2,
    });
    const subtests = (subtestsResult.docs as unknown as Question[]) || [];
    const mergedAnswers = mergeNestedMap(baseAnswers, input.answers);
    const mergedFlags = mergeNestedMap(baseFlags, input.flags);
    const results = calculateSubmissionResults(subtests, mergedAnswers);

    const hasAnswers = Object.keys(mergedAnswers).length > 0;
    const calculatedResultsCount = results.questionResults.length;
    const nextExamState: "running" | "bridging" | undefined =
      input.examState ?? baseExamState;
    const nextBridgingExpiry = input.bridgingExpiry ?? baseBridgingExpiry;
    const nextQuestionIndex = input.currentQuestionIndex ?? baseCurrentQuestionIndex;

    const updateData: Record<string, unknown> = retakeActive
      ? {
          retakeAnswers: mergedAnswers,
          retakeFlags: mergedFlags,
          retakeCurrentSubtest: nextSubtest,
          retakeSubtestStartedAt: timerWindow.subtestStartedAt,
          retakeSubtestDeadlineAt: timerWindow.subtestDeadlineAt,
          retakeSecondsRemaining: timerWindow.secondsRemaining,
          retakeStatus: "running",
          heartbeatAt: nowIso,
          ...(nextQuestionIndex !== undefined && {
            retakeCurrentQuestionIndex: nextQuestionIndex,
          }),
        }
      : {
          answers: mergedAnswers,
          flags: mergedFlags,
          currentSubtest: nextSubtest,
          ...(nextExamState !== undefined && { examState: nextExamState }),
          ...(nextBridgingExpiry !== undefined && {
            bridgingExpiry: nextBridgingExpiry,
          }),
          subtestStartedAt: timerWindow.subtestStartedAt,
          subtestDeadlineAt: timerWindow.subtestDeadlineAt,
          secondsRemaining: timerWindow.secondsRemaining,
          heartbeatAt: nowIso,
          ...(nextQuestionIndex !== undefined && {
            currentQuestionIndex: nextQuestionIndex,
          }),
        };

    if (!retakeActive && (calculatedResultsCount > 0 || !hasAnswers)) {
      updateData.questionResults = results.questionResults;
      updateData.score = results.score;
      updateData.correctAnswersCount = results.correctCount;
      updateData.totalQuestionsCount = results.totalQuestions;
    }

    const lastPersistedAt = cached?.lastPersistedAt ?? 0;
    const shouldPersist =
      !redisEnabled ||
      now.getTime() - lastPersistedAt >= PERSIST_INTERVAL_MS ||
      input.examState === "bridging";
    const nextPersistedAt = shouldPersist ? now.getTime() : lastPersistedAt;
    const nextState: RedisAttemptState = {
      updatedAt: now.getTime(),
      lastPersistedAt: nextPersistedAt,
      answers: mergedAnswers,
      flags: mergedFlags,
      processedBatchIds: baseProcessed,
      eventRevisions: baseEventRevisions,
      subtestStates: baseSubtestStates,
      subtestSnapshots: baseSubtestSnapshots,
      subtestDurations: baseSubtestDurations,
      currentSubtest: nextSubtest,
      currentQuestionIndex: nextQuestionIndex,
      examState: nextExamState,
      bridgingExpiry: nextBridgingExpiry,
      subtestStartedAt: timerWindow.subtestStartedAt,
      subtestDeadlineAt: timerWindow.subtestDeadlineAt,
      secondsRemaining: timerWindow.secondsRemaining,
      heartbeatAt: nowIso,
    };
    await saveAttemptProgress(attempt.id, retakeActive, nextState);

    if (shouldPersist) {
      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: updateData,
      });
    }

    return {
      serverNow: nowIso,
      subtestStartedAt: timerWindow.subtestStartedAt,
      subtestDeadlineAt: timerWindow.subtestDeadlineAt,
      secondsRemaining: timerWindow.secondsRemaining,
    };
  });
