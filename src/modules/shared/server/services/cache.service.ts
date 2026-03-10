/**
 * Generic cache service with Redis + in-memory fallback.
 * Usable by any module that needs caching with TTL.
 *
 * Moved from tryouts/server/services/tryout-cache.service.ts
 * (tryout-specific clearTryoutCache stays in tryouts module)
 */

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

/**
 * Invalidate all in-memory cache entries matching a prefix.
 * Redis entries are not deleted here — use redisDel/redisScanDel for that.
 */
export const clearCacheByPrefix = (prefix: string) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
};
