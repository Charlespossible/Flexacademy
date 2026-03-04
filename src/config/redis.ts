import Redis from "ioredis";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  redisClient = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => {
      if (times > 5) return null;
      return Math.min(times * 100, 3000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
  });

  redisClient.on("connect", () => logger.info("Redis connecting..."));
  redisClient.on("ready", () => logger.info("✅ Redis ready"));
  redisClient.on("error", (err: Error) => logger.error({ err }, "Redis error"));
  redisClient.on("close", () => logger.warn("Redis connection closed"));

  return redisClient;
};

export const getRedis = (): Redis => {
  if (!redisClient) {
    throw new Error("Redis not initialized. Call connectRedis() first.");
  }
  return redisClient;
};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await getRedis().get(key);
    return data ? (JSON.parse(data) as T) : null;
  },

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await getRedis().del(key);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) await getRedis().del(...keys);
  },
};
