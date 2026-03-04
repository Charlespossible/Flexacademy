import Redis from "ioredis";
import { logger } from "../utils/logger.js";

let redisClient = null;

export const connectRedis = async () => {
  redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      if (times > 5) return null; // Stop retrying
      return Math.min(times * 100, 3000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
  });

  redisClient.on("connect", () => logger.info("Redis connecting..."));
  redisClient.on("ready", () => logger.info("✅ Redis ready"));
  redisClient.on("error", (err) => logger.error({ err }, "Redis error"));
  redisClient.on("close", () => logger.warn("Redis connection closed"));

  return redisClient;
};

export const getRedis = () => {
  if (!redisClient) throw new Error("Redis not initialized. Call connectRedis() first.");
  return redisClient;
};

// Cache helpers
export const cache = {
  async get(key) {
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttlSeconds = 300) {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key) {
    await getRedis().del(key);
  },

  async invalidatePattern(pattern) {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) await getRedis().del(...keys);
  },
};
