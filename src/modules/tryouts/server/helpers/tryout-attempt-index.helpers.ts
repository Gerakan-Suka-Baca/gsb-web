import type { TryoutAttempt } from "../../types";

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
