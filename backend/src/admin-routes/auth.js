import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../middleware/error.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const r = Router();

r.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, "Email and password required");

    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user || !user.password_hash) throw new ApiError(401, "Invalid credentials");

    // Only allow admin roles
    const adminRoles = ['admin', 'super_admin', 'moderator', 'support', 'analyst'];
    if (!adminRoles.includes(user.role)) {
      throw new ApiError(403, "Access denied: Admin privileges required");
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new ApiError(401, "Invalid credentials");

    // Log the login
    await query(
      "INSERT INTO audit_logs (admin_id, action, entity_type, ip_address) VALUES ($1, $2, $3, $4)",
      [user.id, "login", "auth", req.ip]
    );

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  })
);

r.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query("SELECT id, name, email, role, avatar_url FROM users WHERE id = $1", [req.user.id]);
    if (!rows[0]) throw new ApiError(404, "User not found");
    res.json({ ok: true, user: rows[0] });
  })
);

export default r;
