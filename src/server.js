import "express-async-errors";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { connectRedis } from "./config/redis.js";
import { prisma } from "./config/database.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("PostgreSQL disconnected.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejections / exceptions
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
  gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught Exception");
  process.exit(1);
});

const start = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info("✅ PostgreSQL connected via Prisma");

    // Redis
    await connectRedis();
    logger.info("✅ Redis connected");

    server.listen(PORT, () => {
      logger.info(`🚀 FlexAcademy API running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📖 API Docs: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    logger.fatal({ error }, "Failed to start server");
    process.exit(1);
  }
};

start();
