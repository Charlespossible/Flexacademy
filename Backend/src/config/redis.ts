import Redis from "ioredis";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;
let redisAvailable = false;

// ─── In-memory fallback ──────────────────────────────────────────────────────
// Used transparently when Redis is not reachable (local dev without Redis).
// TTL is honoured; keys expire lazily on next read.

interface MemEntry { val: string; exp: number }
const _mem = new Map<string, MemEntry>();

function memGet(key: string): string | null {
  const e = _mem.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { _mem.delete(key); return null; }
  return e.val;
}
function memSet(key: string, ttl: number, val: string) {
  _mem.set(key, { val, exp: Date.now() + ttl * 1_000 });
}
function memDel(key: string) { _mem.delete(key); }
function memKeys(pattern: string): string[] {
  // Convert Redis glob (only * wildcard used here) to a RegExp
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  const re = new RegExp(`^${escaped}$`);
  return [..._mem.keys()].filter((k) => re.test(k));
}

// ─── Connect ─────────────────────────────────────────────────────────────────

export const connectRedis = async (): Promise<void> => {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };

    const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      password: process.env.REDIS_PASSWORD || undefined,
      // Give up after 3 connection attempts so startup isn't blocked long
      retryStrategy: (times) => (times > 2 ? null : times * 200),
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });

    client.on("ready", () => {
      redisClient = client;
      redisAvailable = true;
      logger.info("✅ Redis ready");
      done();
    });

    // Suppress noisy ECONNREFUSED stack traces while Redis is unavailable.
    // If Redis goes down after being available, log the error.
    client.on("error", (err: Error) => {
      if (redisAvailable) {
        logger.error({ err }, "Redis error");
        redisAvailable = false;
      }
    });

    client.on("close", () => { redisAvailable = false; });

    // "end" fires when ioredis gives up retrying (retryStrategy returned null)
    client.on("end", () => {
      if (!redisAvailable) {
        logger.warn(
          "⚠️  Redis unavailable — in-memory cache active. " +
          "Email/password-reset tokens persist only for this process lifetime. " +
          "Start Redis or set REDIS_URL for production."
        );
        client.disconnect();
      }
      done();
    });
  });
};

export const getRedis = (): Redis => {
  if (!redisClient) throw new Error("Redis not initialized. Call connectRedis() first.");
  return redisClient;
};

// ─── Cache API ───────────────────────────────────────────────────────────────
// All methods fall back to the in-memory store when Redis is not available.

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = redisAvailable && redisClient
      ? await redisClient.get(key)
      : memGet(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const s = JSON.stringify(value);
    if (redisAvailable && redisClient) {
      await redisClient.setex(key, ttlSeconds, s);
    } else {
      memSet(key, ttlSeconds, s);
    }
  },

  async del(key: string): Promise<void> {
    if (redisAvailable && redisClient) {
      await redisClient.del(key);
    } else {
      memDel(key);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    if (redisAvailable && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) await redisClient.del(...keys);
    } else {
      memKeys(pattern).forEach(memDel);
    }
  },
};
