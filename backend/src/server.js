import "dotenv/config";
import http from "http";
// Force nodemon reload to read updated .env configurations
import { env } from "./config/env.js";
import app from "./app.js";
import { ping, pool } from "./config/db.js";
import { closeRedis } from "./config/redis.js";
import { logger } from "./utils/logger.js";
import { startMarketPriceJob, stopMarketPriceJob } from "./jobs/marketPriceJob.js";

const PORT = env.PORT;
const SHUTDOWN_TIMEOUT_MS = 15_000;

async function bootstrap() {
  try {
    const now = await ping();
    logger.info(`✅ Connected to Postgres (server time: ${now})`);
  } catch (e) {
    logger.error("❌ Postgres connection failed:", e.message);
  }

  const server = http.createServer(app);

  // tighten server timeouts for production
  server.headersTimeout = 65_000;
  server.requestTimeout = 60_000;
  server.keepAliveTimeout = 60_000;

  server.listen(PORT, () => {
    logger.info(`🚀 AgriSmart API running on http://localhost:${PORT} (env=${env.NODE_ENV})`);
  });

  startMarketPriceJob();

  let shuttingDown = false;
  const shutdown = (sig) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${sig} received — graceful shutdown starting...`);

    // force-exit guard if cleanup hangs
    const force = setTimeout(() => {
      logger.error("Forced shutdown after timeout.");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    force.unref();

    stopMarketPriceJob();
    server.close(async () => {
      try {
        await Promise.allSettled([closeRedis(), pool.end()]);
        logger.info("Cleanup complete. Bye.");
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (err) => logger.error("unhandledRejection:", err));
  process.on("uncaughtException", (err) => {
    logger.error("uncaughtException:", err);
    shutdown("uncaughtException");
  });
}

bootstrap();
