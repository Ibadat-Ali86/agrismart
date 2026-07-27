import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, paginate } from "../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";

const r = Router();
r.use(requireAuth, requireAdmin);

// List all users
r.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const { role, status, search } = req.query;

    let where = [];
    let params = [];

    if (role) {
      where.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    // Status is mocked via email_verified or we can add an actual status column later
    if (status === 'verified') {
      where.push(`email_verified = true`);
    } else if (status === 'unverified') {
      where.push(`email_verified = false`);
    }

    if (search) {
      where.push(`(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countRes = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const { rows } = await query(
      `SELECT id, name, email, phone, role, country, state, district, email_verified, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      ok: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  })
);

// Get single user
r.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await query("SELECT id, name, email, phone, role, country, state, district, email_verified, created_at FROM users WHERE id = $1", [req.params.id]);
    if (!rows[0]) throw new ApiError(404, "User not found");
    res.json({ ok: true, data: rows[0] });
  })
);

// Delete user
r.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.id]);
    if (rowCount === 0) throw new ApiError(404, "User not found");

    await query("INSERT INTO audit_logs (admin_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)", [req.user.id, "delete", "user", req.params.id]);
    res.json({ ok: true, message: "User deleted" });
  })
);

export default r;
