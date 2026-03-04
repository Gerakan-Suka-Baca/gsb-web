import { redisDel, redisGetJson, redisSetJson } from "@/lib/redis";

export type RedisAttemptState = {
  updatedAt: number;
  lastPersistedAt?: number;
  answers?: Record<string, Record<string, string>>;
  flags?: Record<string, Record<string, boolean>>;
  processedBatchIds?: string[];
  eventRevisions?: Record<string, number>;
  subtestStates?: Record<string, string>;
  subtestSnapshots?: unknown[];
  subtestDurations?: Record<string, number>;
  currentSubtest?: number;
  currentQuestionIndex?: number;
  examState?: "running" | "bridging";
  bridgingExpiry?: string;
  subtestStartedAt?: string;
  subtestDeadlineAt?: string;
  secondsRemaining?: number;
  heartbeatAt?: string;
};

export const PROGRESS_TTL_SECONDS = 6 * 60 * 60;
export const PERSIST_INTERVAL_MS = 5 * 60 * 1000;
export const redisEnabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const getAttemptCacheKey = (attemptId: string, retakeActive: boolean) =>
  `gsb:tryout:progress:${attemptId}:${retakeActive ? "retake" : "primary"}`;

export const loadAttemptProgress = async (attemptId: string, retakeActive: boolean) =>
  redisGetJson<RedisAttemptState>(getAttemptCacheKey(attemptId, retakeActive));

export const saveAttemptProgress = async (
  attemptId: string,
  retakeActive: boolean,
  state: RedisAttemptState
) => redisSetJson(getAttemptCacheKey(attemptId, retakeActive), state, PROGRESS_TTL_SECONDS);

export const clearAttemptProgress = async (attemptId: string) =>
  Promise.all([
    redisDel(getAttemptCacheKey(attemptId, false)),
    redisDel(getAttemptCacheKey(attemptId, true)),
  ]);
