import { redisGetJson, redisSetJson } from "@/lib/redis";

type CacheEntry<T> = {
  expires: number;
  value: T;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const CACHE_PREFIX = "gsb:cache:";

export const getCacheValue = async <T,>(key: string): Promise<T | null> => {
  const redisValue = await redisGetJson<T>(`${CACHE_PREFIX}${key}`);
  if (redisValue !== null) return redisValue;
  const hit = cacheStore.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  return hit.value as T;
};

export const setCacheValue = async <T,>(key: string, value: T, ttlMs: number) => {
  cacheStore.set(key, { value, expires: Date.now() + ttlMs });
  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
  await redisSetJson(`${CACHE_PREFIX}${key}`, value, ttlSeconds);
};

export const clearTryoutCache = (tryoutId?: string) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith("tryouts:list:")) {
      cacheStore.delete(key);
      continue;
    }
    if (
      tryoutId &&
      (key === `tryout:full:${tryoutId}` || key === `tryout:meta:${tryoutId}`)
    ) {
      cacheStore.delete(key);
    }
  }
};
