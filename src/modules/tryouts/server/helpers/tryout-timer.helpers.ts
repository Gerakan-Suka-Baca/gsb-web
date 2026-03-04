import { getAttemptSubtestIndex, getRetakeSubtestIndex, isFiniteNumber } from "./tryout-attempt-index.helpers";
import { parseDateMs, SUBTEST_QUERY_LIMIT } from "./tryout-window.helpers";

import type { TryoutAttempt } from "../../types";
import type { PayloadLike } from "./tryout-window.helpers";

export type ServerTimerWindow = {
  subtestStartedAt: string;
  subtestDeadlineAt: string;
  secondsRemaining: number;
};

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
    durationSeconds = await getSubtestDurationSeconds(payload, tryoutId, normalizedSubtest);
  }

  const subtestStartedAt = now.toISOString();
  const subtestDeadlineAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();

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
    durationSeconds = await getSubtestDurationSeconds(payload, tryoutId, normalizedSubtest);
  }

  const subtestStartedAt = now.toISOString();
  const subtestDeadlineAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();

  return {
    subtestStartedAt,
    subtestDeadlineAt,
    secondsRemaining: durationSeconds,
  };
};
