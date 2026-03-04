import { Redis } from "@upstash/redis/node";

type RedisClient = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, options?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<number>;
};

let client: RedisClient | null | undefined;

const getClient = () => {
  if (client !== undefined) return client;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    client = null;
    return client;
  }
  client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  }) as unknown as RedisClient;
  return client;
};

export const redisGetJson = async <T,>(key: string): Promise<T | null> => {
  const redis = getClient();
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return (value ?? null) as T | null;
  } catch {
    return null;
  }
};

export const redisSetJson = async <T,>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> => {
  const redis = getClient();
  if (!redis) return;
  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    }
    await redis.set(key, value);
  } catch {
    return;
  }
};

export const redisDel = async (key: string): Promise<void> => {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    return;
  }
};
