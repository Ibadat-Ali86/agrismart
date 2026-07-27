import jwt from "jsonwebtoken";
import { ApiError } from "./error.js";

export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;
  if (!token) return next(new ApiError(401, "Authentication required"));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return next(new ApiError(403, "Forbidden"));
  next();
};

export const requireAdmin = requireRole(
  "admin",
  "super_admin",
  "moderator",
  "support",
  "analyst",
);
