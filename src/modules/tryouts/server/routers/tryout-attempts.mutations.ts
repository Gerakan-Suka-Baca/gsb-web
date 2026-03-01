import z from "zod";
import { protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import type { Question } from "@/payload-types";
import type { TryoutAttempt } from "../../types";
import {
  MAX_PROCESSED_BATCHES,
  getTryoutId,
  calculateSubmissionResults,
  validateTryoutAttempt,
} from "../../utils/tryout-utils";
import {
  SUBTEST_QUERY_LIMIT,
  PayloadLike,
  TryoutWindowDoc,
  parseDateMs,
  getTryoutWindow,
  assertTryoutWindowOpen,
  getAttemptSubtestIndex,
  getRetakeSubtestIndex,
  isRetakeActive,
  getSubtestDurationSeconds,
  buildServerTimerWindow,
  buildRetakeTimerWindow,
  getSecondsRemainingFromDeadline,
  canAdvanceSubtest,
} from "./tryout-attempts.helpers";

const eventSchema = z.object({
  id: z.string(),
  kind: z.enum(["answer", "flag"]),
  subtestId: z.string(),
  questionId: z.string(),
  answerId: z.string().optional(),
  flag: z.boolean().optional(),
  revision: z.number(),
  clientTs: z.number(),
});

export const startAttempt = protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;
      const now = new Date();
      const nowIso = now.toISOString();
      const tryoutWindow = await getTryoutWindow(payload as PayloadLike, input.tryoutId);
      assertTryoutWindowOpen(tryoutWindow, "memulai tryout", now);

      const existing = await payload.find({
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

      if (existing.docs.length > 0) {
        const attempt = existing.docs[0] as unknown as TryoutAttempt;
        if (attempt.status !== "completed") {
          const resumedTimer = await buildServerTimerWindow({
            payload: payload as PayloadLike,
            attempt,
            tryoutId: getTryoutId(attempt.tryout),
            targetSubtest: getAttemptSubtestIndex(attempt),
            now,
            allowLegacySecondsFallback: true,
          });
          const shouldPersistTimer =
            attempt.subtestStartedAt !== resumedTimer.subtestStartedAt ||
            attempt.subtestDeadlineAt !== resumedTimer.subtestDeadlineAt;

          if (!shouldPersistTimer) {
            return {
              ...attempt,
              secondsRemaining: resumedTimer.secondsRemaining,
              serverNow: nowIso,
            } as TryoutAttempt;
          }

          const resumedAttempt = await payload.update({
            collection: "tryout-attempts",
            id: attempt.id,
            data: {
              subtestStartedAt: resumedTimer.subtestStartedAt,
              subtestDeadlineAt: resumedTimer.subtestDeadlineAt,
              secondsRemaining: resumedTimer.secondsRemaining,
            },
          });

          return {
            ...(resumedAttempt as unknown as TryoutAttempt),
            serverNow: nowIso,
          } as TryoutAttempt;
        }

        if (attempt.allowRetake) {
          const baseAnswers =
            attempt.retakeAnswers && Object.keys(attempt.retakeAnswers).length > 0
              ? attempt.retakeAnswers
              : attempt.answers || {};
          const baseFlags =
            attempt.retakeFlags && Object.keys(attempt.retakeFlags).length > 0
              ? attempt.retakeFlags
              : attempt.flags || {};
          const shouldInit = attempt.retakeStatus !== "running";
          const maxRetake = Number.isFinite(attempt.maxRetake)
            ? Math.max(0, Math.floor(attempt.maxRetake as number))
            : 1;
          const retakeCount = Number.isFinite(attempt.retakeCount)
            ? Math.max(0, Math.floor(attempt.retakeCount as number))
            : 0;
          if (shouldInit && maxRetake > 0 && retakeCount >= maxRetake) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Batas maksimal retake sudah tercapai.",
            });
          }
          const targetSubtest = shouldInit ? 0 : getRetakeSubtestIndex(attempt);
          const timerWindow = await buildRetakeTimerWindow({
            payload: payload as PayloadLike,
            attempt,
            tryoutId: getTryoutId(attempt.tryout),
            targetSubtest,
            now,
            allowLegacySecondsFallback: true,
            forceReset: shouldInit,
          });
          const updateData: Record<string, unknown> = {
            retakeStatus: "running",
            retakeSubtestStartedAt: timerWindow.subtestStartedAt,
            retakeSubtestDeadlineAt: timerWindow.subtestDeadlineAt,
            retakeSecondsRemaining: timerWindow.secondsRemaining,
            heartbeatAt: nowIso,
          };
          if (shouldInit) {
            updateData.retakeStartedAt = nowIso;
            updateData.retakeCurrentSubtest = 0;
            updateData.retakeCurrentQuestionIndex = 0;
            updateData.retakeAnswers = baseAnswers;
            updateData.retakeFlags = baseFlags;
            updateData.retakeProcessedBatchIds = [];
            updateData.retakeEventRevisions = {};
            updateData.retakeSubtestStates = {};
            updateData.retakeSubtestSnapshots = [];
            updateData.retakeSubtestDurations = {};
            updateData.retakeCount = retakeCount + 1;
          }
          const updatedAttempt = await payload.update({
            collection: "tryout-attempts",
            id: attempt.id,
            data: updateData,
          });
          return {
            ...(updatedAttempt as unknown as TryoutAttempt),
            serverNow: nowIso,
            subtestStartedAt: timerWindow.subtestStartedAt,
            subtestDeadlineAt: timerWindow.subtestDeadlineAt,
            secondsRemaining: timerWindow.secondsRemaining,
          } as TryoutAttempt;
        }

        const hasAnswers = attempt.answers && Object.keys(attempt.answers).length > 0;
        if (hasAnswers) return attempt;
      }
      const firstSubtestSeconds = await getSubtestDurationSeconds(
        payload as PayloadLike,
        input.tryoutId,
        0
      );
      const subtestStartedAt = nowIso;
      const subtestDeadlineAt = new Date(
        now.getTime() + firstSubtestSeconds * 1000
      ).toISOString();

      const newAttempt = await payload.create({
        collection: "tryout-attempts",
        data: {
          user: session.user.id,
          tryout: input.tryoutId,
          status: "started",
          answers: {},
          flags: {},
          startedAt: new Date().toISOString(),
          currentSubtest: 0,
          currentQuestionIndex: 0,
          examState: "running",
          subtestStartedAt,
          subtestDeadlineAt,
          secondsRemaining: firstSubtestSeconds,
        },
      });
      return {
        ...(newAttempt as unknown as TryoutAttempt),
        serverNow: nowIso,
      } as TryoutAttempt;
    });

export const saveProgress = protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        answers: z.record(z.string(), z.record(z.string(), z.string())),
        flags: z.record(z.string(), z.record(z.string(), z.boolean())),
        currentSubtest: z.number().optional(),
        examState: z.enum(["running", "bridging"]).optional(),
        bridgingExpiry: z.string().optional(),
        currentQuestionIndex: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
      assertTryoutWindowOpen(tryoutWindow, "menyimpan progres", now);
      const retakeActive = isRetakeActive(attempt);
      const attemptSubtest = retakeActive
        ? getRetakeSubtestIndex(attempt)
        : getAttemptSubtestIndex(attempt);
      const requestedSubtest =
        input.currentSubtest !== undefined &&
        Number.isFinite(input.currentSubtest) &&
        input.currentSubtest >= 0
          ? Math.floor(input.currentSubtest)
          : attemptSubtest;
      const canAdvanceState =
        input.examState === "bridging" || attempt.examState === "bridging";
      const safeRequestedSubtest =
        requestedSubtest > attemptSubtest && !canAdvanceState
          ? attemptSubtest
          : requestedSubtest;
      const canAdvance = canAdvanceSubtest(attempt, now);
      const maxAllowedSubtest = attemptSubtest + 1;
      const nextSubtest = Math.min(
        Math.max(safeRequestedSubtest, attemptSubtest),
        canAdvance ? maxAllowedSubtest : attemptSubtest
      );
      const timerWindow = retakeActive
        ? await buildRetakeTimerWindow({
            payload: payload as PayloadLike,
            attempt,
            tryoutId,
            targetSubtest: nextSubtest,
            now,
            allowLegacySecondsFallback: true,
            forceReset:
              input.currentSubtest !== undefined && nextSubtest !== attemptSubtest,
          })
        : await buildServerTimerWindow({
            payload: payload as PayloadLike,
            attempt,
            tryoutId,
            targetSubtest: nextSubtest,
            now,
            allowLegacySecondsFallback: true,
            forceReset:
              input.currentSubtest !== undefined && nextSubtest !== attemptSubtest,
          });

      const subtestsResult = await payload.find({
        collection: "questions",
        where: { tryout: { equals: tryoutId } },
        limit: SUBTEST_QUERY_LIMIT,
        sort: "createdAt",
        depth: 2,
      });
      const subtests = (subtestsResult.docs as unknown as Question[]) || [];
      const results = calculateSubmissionResults(subtests, input.answers);

      const hasAnswers = Object.keys(input.answers).length > 0;
      const calculatedResultsCount = results.questionResults.length;

      const updateData: Record<string, unknown> = retakeActive
        ? {
            retakeAnswers: input.answers,
            retakeFlags: input.flags,
            retakeCurrentSubtest: nextSubtest,
            retakeSubtestStartedAt: timerWindow.subtestStartedAt,
            retakeSubtestDeadlineAt: timerWindow.subtestDeadlineAt,
            retakeSecondsRemaining: timerWindow.secondsRemaining,
            retakeStatus: "running",
            heartbeatAt: nowIso,
            ...(input.currentQuestionIndex !== undefined && {
              retakeCurrentQuestionIndex: input.currentQuestionIndex,
            }),
          }
        : {
            answers: input.answers,
            flags: input.flags,
            currentSubtest: nextSubtest,
            ...(input.examState !== undefined && { examState: input.examState }),
            ...(input.bridgingExpiry !== undefined && {
              bridgingExpiry: input.bridgingExpiry,
            }),
            subtestStartedAt: timerWindow.subtestStartedAt,
            subtestDeadlineAt: timerWindow.subtestDeadlineAt,
            secondsRemaining: timerWindow.secondsRemaining,
            heartbeatAt: nowIso,
            ...(input.currentQuestionIndex !== undefined && {
              currentQuestionIndex: input.currentQuestionIndex,
            }),
          };

      if (!retakeActive && (calculatedResultsCount > 0 || !hasAnswers)) {
        updateData.questionResults = results.questionResults;
        updateData.score = results.score;
        updateData.correctAnswersCount = results.correctCount;
        updateData.totalQuestionsCount = results.totalQuestions;
      }

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: updateData,
      });
      return {
        success: true,
        serverNow: nowIso,
        currentSubtest: nextSubtest,
        subtestStartedAt: timerWindow.subtestStartedAt,
        subtestDeadlineAt: timerWindow.subtestDeadlineAt,
        secondsRemaining: timerWindow.secondsRemaining,
      };
    });

export const saveProgressBatch = protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        batchId: z.string(),
        clientTime: z.number(),
        events: z.array(eventSchema),
        currentSubtest: z.number().optional(),
        examState: z.enum(["running", "bridging"]).optional(),
        currentQuestionIndex: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
      assertTryoutWindowOpen(tryoutWindow, "menyimpan progres", now);
      const retakeActive = isRetakeActive(attempt);
      const attemptSubtest = retakeActive
        ? getRetakeSubtestIndex(attempt)
        : getAttemptSubtestIndex(attempt);
      const requestedSubtest =
        input.currentSubtest !== undefined &&
        Number.isFinite(input.currentSubtest) &&
        input.currentSubtest >= 0
          ? Math.floor(input.currentSubtest)
          : attemptSubtest;
      const canAdvanceState =
        input.examState === "bridging" || attempt.examState === "bridging";
      const safeRequestedSubtest =
        requestedSubtest > attemptSubtest && !canAdvanceState
          ? attemptSubtest
          : requestedSubtest;
      const canAdvance = canAdvanceSubtest(attempt, now);
      const maxAllowedSubtest = attemptSubtest + 1;
      const nextSubtest = Math.min(
        Math.max(safeRequestedSubtest, attemptSubtest),
        canAdvance ? maxAllowedSubtest : attemptSubtest
      );
      const timerWindow = retakeActive
        ? await buildRetakeTimerWindow({
            payload: payload as PayloadLike,
            attempt,
            tryoutId,
            targetSubtest: nextSubtest,
            now,
            allowLegacySecondsFallback: true,
            forceReset:
              input.currentSubtest !== undefined && nextSubtest !== attemptSubtest,
          })
        : await buildServerTimerWindow({
            payload: payload as PayloadLike,
            attempt,
            tryoutId,
            targetSubtest: nextSubtest,
            now,
            allowLegacySecondsFallback: true,
            forceReset:
              input.currentSubtest !== undefined && nextSubtest !== attemptSubtest,
          });

      const processed = retakeActive
        ? Array.isArray(attempt.retakeProcessedBatchIds)
          ? attempt.retakeProcessedBatchIds
          : []
        : Array.isArray(attempt.processedBatchIds)
          ? attempt.processedBatchIds
          : [];

      if (processed.includes(input.batchId)) {
        return {
          success: true,
          duplicate: true,
          serverNow: nowIso,
          currentSubtest: nextSubtest,
          subtestStartedAt: timerWindow.subtestStartedAt,
          subtestDeadlineAt: timerWindow.subtestDeadlineAt,
          secondsRemaining: timerWindow.secondsRemaining,
        };
      }

      const nextAnswers = {
        ...(retakeActive ? attempt.retakeAnswers : attempt.answers),
      };
      const nextFlags = {
        ...(retakeActive ? attempt.retakeFlags : attempt.flags),
      };
      const nextEventRevisions = {
        ...((retakeActive ? attempt.retakeEventRevisions : attempt.eventRevisions) as
          | Record<string, number>
          | undefined),
      };

      const ordered = [...input.events].sort(
        (a, b) => a.clientTs - b.clientTs || a.revision - b.revision
      );
      let applied = 0;
      for (const event of ordered) {
        const revKey = `${event.kind}:${event.subtestId}:${event.questionId}`;
        const lastRev = nextEventRevisions[revKey] ?? 0;
        if (event.revision <= lastRev) continue;
        if (event.kind === "answer") {
          const sub = nextAnswers[event.subtestId]
            ? { ...nextAnswers[event.subtestId] }
            : {};
          if (event.answerId !== undefined) {
            sub[event.questionId] = event.answerId;
          }
          nextAnswers[event.subtestId] = sub;
        } else {
          const sub = nextFlags[event.subtestId]
            ? { ...nextFlags[event.subtestId] }
            : {};
          sub[event.questionId] = Boolean(event.flag);
          nextFlags[event.subtestId] = sub;
        }
        nextEventRevisions[revKey] = event.revision;
        applied += 1;
      }

      const nextProcessed = [
        ...processed.filter((id) => id !== input.batchId),
        input.batchId,
      ].slice(-MAX_PROCESSED_BATCHES);

      const subtestsResult = await payload.find({
        collection: "questions",
        where: { tryout: { equals: tryoutId } },
        limit: SUBTEST_QUERY_LIMIT,
        sort: "createdAt",
        depth: 2,
      });
      const subtests = (subtestsResult.docs as unknown as Question[]) || [];
      const subtestStates = {
        ...((retakeActive ? attempt.retakeSubtestStates : attempt.subtestStates) as
          | Record<string, string>
          | undefined),
      };
      const subtestSnapshots = Array.isArray(
        retakeActive ? attempt.retakeSubtestSnapshots : attempt.subtestSnapshots
      )
        ? [
            ...((retakeActive
              ? attempt.retakeSubtestSnapshots
              : attempt.subtestSnapshots) as unknown[]),
          ]
        : [];
      const prevSubtestId = subtests[attemptSubtest]?.id;
      const nextSubtestId = subtests[nextSubtest]?.id;
      if (prevSubtestId && nextSubtest > attemptSubtest) {
        const prevAnswers = nextAnswers[prevSubtestId] || {};
        const prevFlags = nextFlags[prevSubtestId] || {};
        subtestStates[prevSubtestId] = "finished";
        subtestSnapshots.push({
          subtestId: prevSubtestId,
          capturedAt: nowIso,
          answers: prevAnswers,
          flags: prevFlags,
          source: "transition",
        });
      }
      if (nextSubtestId && subtestStates[nextSubtestId] !== "finished") {
        subtestStates[nextSubtestId] = "running";
      }
      const results = calculateSubmissionResults(subtests, nextAnswers);

      const hasAnswers = Object.keys(nextAnswers).length > 0;
      const calculatedResultsCount = results.questionResults.length;

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
            ...(input.currentQuestionIndex !== undefined && {
              retakeCurrentQuestionIndex: input.currentQuestionIndex,
            }),
          }
        : {
            answers: nextAnswers,
            flags: nextFlags,
            processedBatchIds: nextProcessed,
            currentSubtest: nextSubtest,
            ...(input.examState !== undefined && { examState: input.examState }),
            subtestStartedAt: timerWindow.subtestStartedAt,
            subtestDeadlineAt: timerWindow.subtestDeadlineAt,
            secondsRemaining: timerWindow.secondsRemaining,
            heartbeatAt: nowIso,
            eventRevisions: nextEventRevisions,
            subtestStates,
            subtestSnapshots,
            ...(input.currentQuestionIndex !== undefined && {
              currentQuestionIndex: input.currentQuestionIndex,
            }),
          };

      if (!retakeActive && (calculatedResultsCount > 0 || !hasAnswers)) {
        updateData.questionResults = results.questionResults;
        updateData.score = results.score;
        updateData.correctAnswersCount = results.correctCount;
        updateData.totalQuestionsCount = results.totalQuestions;
      }

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: updateData,
      });

      return {
        success: true,
        applied,
        serverNow: nowIso,
        currentSubtest: nextSubtest,
        subtestStartedAt: timerWindow.subtestStartedAt,
        subtestDeadlineAt: timerWindow.subtestDeadlineAt,
        secondsRemaining: timerWindow.secondsRemaining,
      };
    });

export const submitAttempt = protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        answers: z.record(z.string(), z.record(z.string(), z.string())),
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
      if (attempt.status === "completed" && !retakeActive) return attempt;

      const tryoutId = getTryoutId(attempt.tryout);
      const deadlineAt = retakeActive
        ? attempt.retakeSubtestDeadlineAt
        : attempt.subtestDeadlineAt;
      if (typeof deadlineAt !== "string" || parseDateMs(deadlineAt) === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Timer belum tervalidasi. Coba sinkronisasi ulang.",
        });
      }
      const remainingSeconds = getSecondsRemainingFromDeadline(
        deadlineAt,
        now
      );
      if (remainingSeconds > 0) {
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
      assertTryoutWindowOpen(
        tryout as unknown as TryoutWindowDoc,
        "submit tryout",
        now
      );

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

      const results = calculateSubmissionResults(subtests, input.answers);

      const updateData: Record<string, unknown> = retakeActive
        ? {
            retakeStatus: "completed",
            retakeCompletedAt: new Date().toISOString(),
            retakeAnswers: input.answers,
            retakeSecondsRemaining: remainingSeconds,
          }
        : {
            status: "completed",
            completedAt: new Date().toISOString(),
            answers: input.answers,
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

      return updated as unknown as TryoutAttempt;
    });

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
