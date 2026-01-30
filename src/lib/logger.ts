import pino from "pino";
import fs from "fs";
import path from "path";
import { createStream } from "rotating-file-stream";
import pretty from "pino-pretty";

const isDevelopment = process.env.NODE_ENV !== "production";

// Ensure logs directory exists in production
if (!isDevelopment && typeof window === "undefined") {
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Create log streams (synchronous, no worker threads)
const createLogStreams = () => {
  if (isDevelopment || typeof window !== "undefined") {
    // Development: Use pino-pretty as a synchronous stream (no worker threads)
    return pretty({
      colorize: true,
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
      sync: true, // Use synchronous mode to avoid worker threads
    });
  }

  // Production: Write to rotating log files using multistream
  const streams = [
    {
      level: "info" as const,
      stream: createStream("app.log", {
        path: path.join(process.cwd(), "logs"),
        size: "10M", // Rotate when file reaches 10MB
        interval: "1d", // Rotate daily
        compress: "gzip", // Compress rotated files
      }),
    },
    {
      level: "error" as const,
      stream: createStream("error.log", {
        path: path.join(process.cwd(), "logs"),
        size: "10M",
        interval: "1d",
        compress: "gzip",
      }),
    },
  ];

  return pino.multistream(streams);
};

// Configure logger
const logger = pino(
  {
    level: isDevelopment ? "debug" : "info",
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      env: process.env.NODE_ENV || "development",
    },
  },
  createLogStreams()
);

// Helper functions for common logging patterns
export const logApiRequest = (
  method: string,
  path: string,
  additionalInfo?: Record<string, unknown>
) => {
  logger.info({ method, path, ...additionalInfo }, "API Request");
};

export const logApiResponse = (
  method: string,
  path: string,
  statusCode: number,
  duration?: number,
  additionalInfo?: Record<string, unknown>
) => {
  logger.info(
    { method, path, statusCode, duration, ...additionalInfo },
    "API Response"
  );
};

export const logError = (
  error: Error | unknown,
  context?: Record<string, unknown>
) => {
  if (error instanceof Error) {
    logger.error(
      {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...context,
      },
      "Error occurred"
    );
  } else {
    logger.error({ error, ...context }, "Unknown error occurred");
  }
};

export const logDatabaseOperation = (
  operation: string,
  collection: string,
  duration?: number,
  additionalInfo?: Record<string, unknown>
) => {
  logger.debug(
    { operation, collection, duration, ...additionalInfo },
    "Database operation"
  );
};

export default logger;
