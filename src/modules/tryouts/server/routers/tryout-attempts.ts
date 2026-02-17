
import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import type { Question, Tryout } from "@/payload-types";
import { TryoutAttempt } from "../../types";
import {
  MAX_PROCESSED_BATCHES,
  getTryoutId,
  calculateSubmissionResults,
  validateTryoutAttempt,
} from "../../utils/tryout-utils";

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

const SUBTEST_QUERY_LIMIT = 200;

type TryoutWindowDoc = Pick<Tryout, "id" | "Date Open" | "Date Close">;

type ServerTimerWindow = {
  subtestStartedAt: string;
  subtestDeadlineAt: string;
  secondsRemaining: number;
};

const parseDateMs = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/** Payload-shaped type used by helpers (ctx.db asserted at call site). */
type PayloadLike = {
  findByID: (args: { collection: string; id: string; depth: number }) => Promise<unknown>;
  find: (args: {
    collection: string;
    where: unknown;
    limit: number;
    sort: string;
    depth: number;
    select?: unknown;
  }) => Promise<{ docs?: unknown[] }>;
};

const getTryoutWindow = async (
  payload: PayloadLike,
  tryoutId: string
): Promise<TryoutWindowDoc> => {
  return (await payload.findByID({
    collection: "tryouts",
    id: tryoutId,
    depth: 0,
  })) as unknown as TryoutWindowDoc;
};

const assertTryoutWindowOpen = (
  tryout: TryoutWindowDoc,
  action: string,
  now: Date
) => {
  const openMs = parseDateMs(tryout["Date Open"]);
  const closeMs = parseDateMs(tryout["Date Close"]);
  if (openMs === null || closeMs === null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Tryout schedule is invalid",
    });
  }

  const nowMs = now.getTime();
  if (nowMs < openMs) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Tryout belum dibuka. Tidak bisa ${action}.`,
    });
  }
  if (nowMs > closeMs) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Tryout sudah ditutup. Tidak bisa ${action}.`,
    });
  }
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getAttemptSubtestIndex = (attempt: TryoutAttempt): number => {
  if (!isFiniteNumber(attempt.currentSubtest) || attempt.currentSubtest < 0) {
    return 0;
  }
  return Math.floor(attempt.currentSubtest);
};

const getSubtestDurationSeconds = async (
  payload: PayloadLike,
  tryoutId: string,
  subtestIndex: number
): Promise<number> => {
  if (!Number.isFinite(subtestIndex) || subtestIndex < 0) return 0;
  const result = (await payload.find({
    collection: "questions",
    where: {
      tryout: { equals: tryoutId },
    },
    limit: SUBTEST_QUERY_LIMIT,
    sort: "createdAt",
    depth: 0,
    select: { duration: true },
  })) as { docs?: Array<{ duration?: number | null }> };

  const docs = Array.isArray(result.docs) ? result.docs : [];
  const target = docs[subtestIndex];
  const durationMinutes = typeof target?.duration === "number" ? target.duration : 0;
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return 0;
  return Math.max(0, Math.round(durationMinutes * 60));
};

const getSecondsRemainingFromDeadline = (deadlineAt: string, now: Date): number => {
  const deadlineMs = parseDateMs(deadlineAt);
  if (deadlineMs === null) return 0;
  return Math.max(0, Math.ceil((deadlineMs - now.getTime()) / 1000));
};

const buildServerTimerWindow = async ({
  payload,
  attempt,
  tryoutId,
  targetSubtest,
  now,
  allowLegacySecondsFallback,
  forceReset,
}: {
  payload: PayloadLike;
  attempt: TryoutAttempt;
  tryoutId: string;
  targetSubtest: number;
  now: Date;
  allowLegacySecondsFallback?: boolean;
  forceReset?: boolean;
}): Promise<ServerTimerWindow> => {
  const attemptSubtest = getAttemptSubtestIndex(attempt);
  const normalizedSubtest =
    Number.isFinite(targetSubtest) && targetSubtest >= 0
      ? Math.floor(targetSubtest)
      : 0;
  const sameSubtest = normalizedSubtest === attemptSubtest;

  const hasStartedAt =
    typeof attempt.subtestStartedAt === "string" &&
    parseDateMs(attempt.subtestStartedAt) !== null;
  const hasDeadlineAt =
    typeof attempt.subtestDeadlineAt === "string" &&
    parseDateMs(attempt.subtestDeadlineAt) !== null;

  if (!forceReset && sameSubtest && hasStartedAt && hasDeadlineAt) {
    return {
      subtestStartedAt: attempt.subtestStartedAt as string,
      subtestDeadlineAt: attempt.subtestDeadlineAt as string,
      secondsRemaining: getSecondsRemainingFromDeadline(
        attempt.subtestDeadlineAt as string,
        now
      ),
    };
  }

  let durationSeconds = 0;
  if (
    allowLegacySecondsFallback &&
    sameSubtest &&
    isFiniteNumber(attempt.secondsRemaining) &&
    attempt.secondsRemaining > 0
  ) {
    durationSeconds = Math.max(0, Math.floor(attempt.secondsRemaining));
  }

  if (durationSeconds === 0) {
    durationSeconds = await getSubtestDurationSeconds(
      payload,
      tryoutId,
      normalizedSubtest
    );
  }

  const subtestStartedAt = now.toISOString();
  const subtestDeadlineAt = new Date(
    now.getTime() + durationSeconds * 1000
  ).toISOString();

  return {
    subtestStartedAt,
    subtestDeadlineAt,
    secondsRemaining: durationSeconds,
  };
};

export const tryoutAttemptsRouter = createTRPCRouter({
  getAttempt: protectedProcedure
    .input(z.object({ tryoutId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db: payload, session } = ctx;
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
      return (attempts.docs.length === 0
        ? null
        : attempts.docs[0]) as unknown as TryoutAttempt | null;
    }),

  startAttempt: protectedProcedure
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
    }),

  saveProgress: protectedProcedure
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
      const attemptSubtest = getAttemptSubtestIndex(attempt);
      const nextSubtest =
        input.currentSubtest !== undefined &&
        Number.isFinite(input.currentSubtest) &&
        input.currentSubtest >= 0
          ? Math.floor(input.currentSubtest)
          : attemptSubtest;
      const timerWindow = await buildServerTimerWindow({
        payload: payload as PayloadLike,
        attempt,
        tryoutId,
        targetSubtest: nextSubtest,
        now,
        allowLegacySecondsFallback: true,
        forceReset:
          input.currentSubtest !== undefined && nextSubtest !== attemptSubtest,
      });

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
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
          ...(input.currentQuestionIndex !== undefined && {
            currentQuestionIndex: input.currentQuestionIndex,
          }),
        },
      });
      return {
        success: true,
        serverNow: nowIso,
        currentSubtest: nextSubtest,
        subtestStartedAt: timerWindow.subtestStartedAt,
        subtestDeadlineAt: timerWindow.subtestDeadlineAt,
        secondsRemaining: timerWindow.secondsRemaining,
      };
    }),

  saveProgressBatch: protectedProcedure
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
      const attemptSubtest = getAttemptSubtestIndex(attempt);
      const nextSubtest =
        input.currentSubtest !== undefined &&
        Number.isFinite(input.currentSubtest) &&
        input.currentSubtest >= 0
          ? Math.floor(input.currentSubtest)
          : attemptSubtest;
      const timerWindow = await buildServerTimerWindow({
        payload: payload as PayloadLike,
        attempt,
        tryoutId,
        targetSubtest: nextSubtest,
        now,
        allowLegacySecondsFallback: true,
        forceReset:
          input.currentSubtest !== undefined && nextSubtest !== attemptSubtest,
      });

      const processed = Array.isArray(attempt.processedBatchIds)
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

      const nextAnswers = { ...attempt.answers };
      const nextFlags = { ...attempt.flags };

      const ordered = [...input.events].sort(
        (a, b) => a.clientTs - b.clientTs || a.revision - b.revision
      );
      for (const event of ordered) {
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
      }

      const nextProcessed = [
        ...processed.filter((id) => id !== input.batchId),
        input.batchId,
      ].slice(-MAX_PROCESSED_BATCHES);

      await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          answers: nextAnswers,
          flags: nextFlags,
          processedBatchIds: nextProcessed,
          currentSubtest: nextSubtest,
          ...(input.examState !== undefined && { examState: input.examState }),
          subtestStartedAt: timerWindow.subtestStartedAt,
          subtestDeadlineAt: timerWindow.subtestDeadlineAt,
          secondsRemaining: timerWindow.secondsRemaining,
          ...(input.currentQuestionIndex !== undefined && {
            currentQuestionIndex: input.currentQuestionIndex,
          }),
        },
      });

      return {
        success: true,
        applied: ordered.length,
        serverNow: nowIso,
        currentSubtest: nextSubtest,
        subtestStartedAt: timerWindow.subtestStartedAt,
        subtestDeadlineAt: timerWindow.subtestDeadlineAt,
        secondsRemaining: timerWindow.secondsRemaining,
      };
    }),

  submitAttempt: protectedProcedure
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

      if (attempt.status === "completed") return attempt;

      const tryoutId = getTryoutId(attempt.tryout);
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

      const tryoutRecord = tryout as unknown as Record<string, unknown>;
      const subtests = Array.isArray(tryoutRecord.questions)
        ? (tryoutRecord.questions as Question[])
        : [];

      if (!Array.isArray(subtests)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Tryout data invalid: questions not populated",
        });
      }

      const results = calculateSubmissionResults(subtests, input.answers);

      const updated = await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: {
          status: "completed",
          completedAt: new Date().toISOString(),
          answers: input.answers,
          score: results.score,
          correctAnswersCount: results.correctCount,
          totalQuestionsCount: results.totalQuestions,
          questionResults: results.questionResults,
          secondsRemaining:
            typeof attempt.subtestDeadlineAt === "string"
              ? getSecondsRemainingFromDeadline(attempt.subtestDeadlineAt, now)
              : 0,
        },
      });

      return updated as unknown as TryoutAttempt;
    }),

  getMyAttempts: protectedProcedure.query(async ({ ctx }) => {
    const { db: payload, session } = ctx;
    const attempts = await payload.find({
      collection: "tryout-attempts",
      where: { user: { equals: session.user.id } },
      depth: 1,
      pagination: false,
      sort: "-createdAt",
    });
    return attempts.docs as unknown as TryoutAttempt[];
  }),

  updatePlan: protectedProcedure
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

      const updated = await payload.update({
        collection: "tryout-attempts",
        id: input.attemptId,
        data: { resultPlan: input.plan },
      });

      return updated as unknown as TryoutAttempt;
    }),
});
