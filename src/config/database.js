import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Log slow queries in dev
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    if (e.duration > 200) {
      logger.warn({ query: e.query, duration: `${e.duration}ms` }, "⚠️  Slow query detected");
    }
  });
}

prisma.$on("error", (e) => {
  logger.error({ message: e.message }, "Prisma error");
});
