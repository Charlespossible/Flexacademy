import pino, { Logger } from "pino";
import { StreamEntry } from "pino";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: { colorize: true, ignore: "pid,hostname" },
        }
      : undefined,
});

export const morganStream: { write: (message: string) => void } = {
  write: (message: string) => logger.info(message.trim()),
};
