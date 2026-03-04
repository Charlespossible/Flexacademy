import "express-async-errors";
import "dotenv/config";

import http from "http";
import app from "./app";
import { logger } from "./utils/logger";
import { connectRedis } from "./config/redis";
import { prisma } from "./config/database";

const PORT = process.env.PORT ?? 5000;

const server = http.createServer(app);

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("PostgreSQL disconnected.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ reason }, "Unhandled Rejection");
  void gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ error }, "Uncaught Exception");
  process.exit(1);
});

const start = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info("✅ PostgreSQL connected via Prisma");

    await connectRedis();
    logger.info("✅ Redis connected");

    server.listen(PORT, () => {
      logger.info(
        `🚀 FlexAcademy API running on port ${PORT} [${process.env.NODE_ENV ?? "development"}]`
      );
      logger.info(`📖 Swagger Docs: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    logger.fatal({ error }, "Failed to start server");
    process.exit(1);
  }
};

void start();
