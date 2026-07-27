import rateLimit from "express-rate-limit";

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  // include request id for traceability
  keyGenerator: (req) => `${req.ip}:${req.user?.id || "anon"}`,
};

export const readLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 120,
  message: { ok: false, error: "Too many requests, slow down." },
});

export const writeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 30,
  message: { ok: false, error: "Too many write requests, slow down." },
});

export const authLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 10,
  message: { ok: false, error: "Too many auth attempts, try again later." },
});

export const otpLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 5,
  message: { ok: false, error: "Too many OTP requests, slow down." },
});

export const aiLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  max: 20,
  message: { ok: false, error: "AI rate limit reached. Please wait a minute." },
});
