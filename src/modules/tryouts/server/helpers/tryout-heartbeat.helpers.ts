import { HEARTBEAT_GRACE_MS } from "./tryout-window.helpers";

import type { TryoutAttempt } from "../../types";

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
