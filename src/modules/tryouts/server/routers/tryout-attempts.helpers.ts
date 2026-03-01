import { TRPCError } from "@trpc/server";
import type { Tryout } from "@/payload-types";
import type { TryoutAttempt } from "../../types";

export const SUBTEST_QUERY_LIMIT = 1000;
export const HEARTBEAT_GRACE_MS = 5 * 60 * 1000;

export type TryoutWindowDoc = Pick<Tryout, "id" | "dateOpen" | "dateClose">;

export type ServerTimerWindow = {
  subtestStartedAt: string;
  subtestDeadlineAt: string;
  secondsRemaining: number;
};

export const parseDateMs = (value: unknown): number | null => {
  if (value instanceof Date) return value.getTime();
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export type PayloadLike = {
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

export const getTryoutWindow = async (
  payload: PayloadLike,
  tryoutId: string
): Promise<TryoutWindowDoc> => {
  return (await payload.findByID({
    collection: "tryouts",
    id: tryoutId,
    depth: 0,
  })) as unknown as TryoutWindowDoc;
};

export const assertTryoutWindowOpen = (
  tryout: TryoutWindowDoc,
  action: string,
  now: Date
) => {
  const openMs = parseDateMs(tryout.dateOpen);
  const closeMs = parseDateMs(tryout.dateClose);
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

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const getAttemptSubtestIndex = (attempt: TryoutAttempt): number => {
  if (!isFiniteNumber(attempt.currentSubtest) || attempt.currentSubtest < 0) {
    return 0;
  }
  return Math.floor(attempt.currentSubtest);
};

export const getRetakeSubtestIndex = (attempt: TryoutAttempt): number => {
  if (
    !isFiniteNumber(attempt.retakeCurrentSubtest) ||
    attempt.retakeCurrentSubtest < 0
  ) {
    return 0;
  }
  return Math.floor(attempt.retakeCurrentSubtest);
};

export const isRetakeActive = (attempt: TryoutAttempt): boolean =>
  Boolean(attempt.allowRetake) && attempt.retakeStatus === "running";

export const getSubtestDurationSeconds = async (
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
  const durationMinutes = typeof target?.duration === "number" ? target.duration : 20;
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return 20 * 60;
  return Math.max(0, Math.round(durationMinutes * 60));
};

export const getSecondsRemainingFromDeadline = (deadlineAt: string, now: Date): number => {
  const deadlineMs = parseDateMs(deadlineAt);
  if (deadlineMs === null) return 0;
  return Math.max(0, Math.ceil((deadlineMs - now.getTime()) / 1000));
};

export const getHeartbeatMs = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
};

export const canAdvanceSubtest = (attempt: TryoutAttempt, now: Date): boolean => {
  const heartbeatMs = getHeartbeatMs(attempt.heartbeatAt);
  if (heartbeatMs === null) return true;
  return now.getTime() - heartbeatMs <= HEARTBEAT_GRACE_MS;
};

export const buildServerTimerWindow = async ({
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

export const buildRetakeTimerWindow = async ({
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
  const attemptSubtest = getRetakeSubtestIndex(attempt);
  const normalizedSubtest =
    Number.isFinite(targetSubtest) && targetSubtest >= 0
      ? Math.floor(targetSubtest)
      : 0;
  const sameSubtest = normalizedSubtest === attemptSubtest;

  const hasStartedAt =
    typeof attempt.retakeSubtestStartedAt === "string" &&
    parseDateMs(attempt.retakeSubtestStartedAt) !== null;
  const hasDeadlineAt =
    typeof attempt.retakeSubtestDeadlineAt === "string" &&
    parseDateMs(attempt.retakeSubtestDeadlineAt) !== null;

  if (!forceReset && sameSubtest && hasStartedAt && hasDeadlineAt) {
    return {
      subtestStartedAt: attempt.retakeSubtestStartedAt as string,
      subtestDeadlineAt: attempt.retakeSubtestDeadlineAt as string,
      secondsRemaining: getSecondsRemainingFromDeadline(
        attempt.retakeSubtestDeadlineAt as string,
        now
      ),
    };
  }

  let durationSeconds = 0;
  if (
    allowLegacySecondsFallback &&
    sameSubtest &&
    isFiniteNumber(attempt.retakeSecondsRemaining) &&
    attempt.retakeSecondsRemaining > 0
  ) {
    durationSeconds = Math.max(0, Math.floor(attempt.retakeSecondsRemaining));
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
