import { TRPCError } from "@trpc/server";

import { protectedProcedure } from "@/trpc/init";
import {
  MAX_PROCESSED_BATCHES,
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

import { saveProgressBatchInputSchema } from "./progress.schemas";
import { normalizeExamState, normalizeNumberMap } from "./progress.utils";

import type { Question } from "@/payload-types";
import type { PayloadLike } from "@/modules/tryouts/server/helpers/tryout-window.helpers";
import type { TryoutAttempt } from "@/modules/tryouts/types";
import type { RedisAttemptState } from "@/modules/tryouts/server/services/tryout-attempts-progress.service";

export const saveProgressBatch = protectedProcedure
  .input(saveProgressBatchInputSchema)
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
    // Only enforce window check for attempts that haven't started yet.
    // Active attempts (status === "started") can always save progress
    // even after the tryout window has closed.
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
            retakeProcessedBatchIds: baseProcessed,
            retakeEventRevisions: baseEventRevisions,
            retakeSubtestStates: baseSubtestStates,
            retakeSubtestSnapshots: baseSubtestSnapshots,
            retakeSubtestDurations: baseSubtestDurations,
            retakeSubtestStartedAt: baseSubtestStartedAt,
            retakeSubtestDeadlineAt: baseSubtestDeadlineAt,
            retakeSecondsRemaining: baseSecondsRemaining,
          }
        : {
            currentSubtest: baseCurrentSubtest,
            currentQuestionIndex: baseCurrentQuestionIndex,
            answers: baseAnswers,
            flags: baseFlags,
            processedBatchIds: baseProcessed,
            eventRevisions: baseEventRevisions,
            subtestStates: baseSubtestStates,
            subtestSnapshots: baseSubtestSnapshots,
            subtestDurations: baseSubtestDurations,
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

    const processed = Array.isArray(baseProcessed) ? baseProcessed : [];
    if (processed.includes(input.batchId)) {
      return {
        idempotent: true,
        applied: 0,
        duplicates: input.events.length,
        serverNow: nowIso,
        subtestStartedAt: timerWindow.subtestStartedAt,
        subtestDeadlineAt: timerWindow.subtestDeadlineAt,
        secondsRemaining: timerWindow.secondsRemaining,
      };
    }

    const nextProcessed = [...processed, input.batchId].slice(-MAX_PROCESSED_BATCHES);
    const nextAnswers = { ...baseAnswers };
    const nextFlags = { ...baseFlags };
    const nextEventRevisions = { ...baseEventRevisions };
    let applied = 0;
    let duplicates = 0;

    const ordered = [...input.events].sort((a, b) => a.clientTs - b.clientTs);
    for (const event of ordered) {
      const revisionKey = `${event.subtestId}:${event.questionId}:${event.kind}`;
      const lastRevision = nextEventRevisions[revisionKey];
      if (typeof lastRevision === "number" && lastRevision >= event.revision) {
        duplicates += 1;
        continue;
      }

      if (event.kind === "answer" && event.answerId) {
        if (!nextAnswers[event.subtestId]) {
          nextAnswers[event.subtestId] = {};
        }
        nextAnswers[event.subtestId][event.questionId] = event.answerId;
        applied += 1;
        nextEventRevisions[revisionKey] = event.revision;
      }

      if (event.kind === "flag" && typeof event.flag === "boolean") {
        if (!nextFlags[event.subtestId]) {
          nextFlags[event.subtestId] = {};
        }
        nextFlags[event.subtestId][event.questionId] = event.flag;
        applied += 1;
        nextEventRevisions[revisionKey] = event.revision;
      }
    }

    const subtestStates = { ...baseSubtestStates };
    subtestStates[`subtest-${nextSubtest}`] = "in-progress";
    const subtestSnapshots = Array.isArray(baseSubtestSnapshots)
      ? [...baseSubtestSnapshots]
      : [];
    if (applied > 0) {
      subtestSnapshots.push({
        subtestId: `subtest-${nextSubtest}`,
        capturedAt: nowIso,
        answers: nextAnswers,
        flags: nextFlags,
        source: "batch",
      });
    }

    const subtestsResult = await payload.find({
      collection: "questions",
      where: { tryout: { equals: tryoutId } },
      limit: SUBTEST_QUERY_LIMIT,
      sort: "createdAt",
      depth: 2,
    });
    const subtests = (subtestsResult.docs as unknown as Question[]) || [];
    const results = calculateSubmissionResults(subtests, nextAnswers);

    const hasAnswers = Object.keys(nextAnswers).length > 0;
    const calculatedResultsCount = results.questionResults.length;
    const nextExamState: "running" | "bridging" | undefined =
      input.examState ?? baseExamState;
    const nextQuestionIndex = input.currentQuestionIndex ?? baseCurrentQuestionIndex;

    const updateData: Record<string, unknown> = retakeActive
      ? {
          retakeAnswers: nextAnswers,
          retakeFlags: nextFlags,
          retakeProcessedBatchIds: nextProcessed,
          retakeCurrentSubtest: nextSubtest,
          retakeSubtestStartedAt: timerWindow.subtestStartedAt,
          retakeSubtestDeadlineAt: timerWindow.subtestDeadlineAt,
          retakeSecondsRemaining: timerWindow.secondsRemaining,
          retakeStatus: "running",
          heartbeatAt: nowIso,
          retakeEventRevisions: nextEventRevisions,
          retakeSubtestStates: subtestStates,
          retakeSubtestSnapshots: subtestSnapshots,
          ...(nextQuestionIndex !== undefined && {
            retakeCurrentQuestionIndex: nextQuestionIndex,
          }),
        }
      : {
          answers: nextAnswers,
          flags: nextFlags,
          processedBatchIds: nextProcessed,
          currentSubtest: nextSubtest,
          ...(nextExamState !== undefined && { examState: nextExamState }),
          subtestStartedAt: timerWindow.subtestStartedAt,
          subtestDeadlineAt: timerWindow.subtestDeadlineAt,
          secondsRemaining: timerWindow.secondsRemaining,
          heartbeatAt: nowIso,
          eventRevisions: nextEventRevisions,
          subtestStates,
          subtestSnapshots,
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
      answers: nextAnswers,
      flags: nextFlags,
      processedBatchIds: nextProcessed,
      eventRevisions: nextEventRevisions,
      subtestStates,
      subtestSnapshots,
      subtestDurations: baseSubtestDurations,
      currentSubtest: nextSubtest,
      currentQuestionIndex: nextQuestionIndex,
      examState: nextExamState,
      bridgingExpiry: baseBridgingExpiry,
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
      idempotent: false,
      applied,
      duplicates,
      serverNow: nowIso,
      subtestStartedAt: timerWindow.subtestStartedAt,
      subtestDeadlineAt: timerWindow.subtestDeadlineAt,
      secondsRemaining: timerWindow.secondsRemaining,
    };
  });
