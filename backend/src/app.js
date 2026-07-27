import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { env, isProd } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { requestId } from "./middleware/requestId.js";
import { readLimiter, writeLimiter, authLimiter, otpLimiter, aiLimiter } from "./middleware/rateLimits.js";
import routes from "./routes/index.js";
import { ping } from "./config/db.js";
import { getRedis } from "./config/redis.js";
import { marketJobStatus } from "./jobs/marketPriceJob.js";
import { openapi } from "./docs/openapi.js";

const app = express();

app.set("trust proxy", 1);
app.use(requestId);
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "https:"],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
            "connect-src": ["'self'", "https:"],
          },
        }
      : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: (env.CLIENT_URL || "*").split(",").map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan(isProd ? "combined" : "dev", {
    skip: (req) => req.path === "/healthz" || req.path === "/readyz",
  }),
);

// ─── Health & readiness ────────────────────────────────────────────────
// Liveness — does the process respond?
app.get("/healthz", (_req, res) => res.json({ ok: true, status: "alive", uptime: process.uptime() }));
// Legacy alias
app.get("/health", (_req, res) => res.json({ ok: true, status: "alive", uptime: process.uptime() }));

// Readiness — can we serve traffic? (DB + Redis check)
app.get("/readyz", async (_req, res) => {
  const checks = { database: false, redis: null };
  let httpStatus = 200;
  try {
    await ping();
    checks.database = true;
  } catch (e) {
    checks.database = false;
    httpStatus = 503;
  }
  if (env.REDIS_URL) {
    try {
      const r = await getRedis();
      checks.redis = Boolean(r?.isReady);
      if (!checks.redis) httpStatus = 503;
    } catch {
      checks.redis = false;
    }
  }
  res.status(httpStatus).json({
    ok: httpStatus === 200,
    checks,
    marketSync: marketJobStatus(),
    env: env.NODE_ENV,
  });
});

// API docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: "AgriSmart API Docs" }));
app.get("/openapi.json", (_req, res) => res.json(openapi));

// ─── Tiered rate limits ────────────────────────────────────────────────
// Auth surfaces
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/api/v1/auth/password", authLimiter);
app.use("/api/v1/auth/otp", otpLimiter);
app.use("/api/v1/admin/auth", authLimiter);
// AI surfaces
app.use("/api/v1/ai", aiLimiter);
// Per-method: writes are stricter than reads
app.use("/api/v1", (req, res, next) => {
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  return (isWrite ? writeLimiter : readLimiter)(req, res, next);
});

app.use("/api/v1", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
