import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, paginate } from "../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";

const r = Router();
r.use(requireAuth, requireAdmin);

// List all listings
r.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const { search, category, status } = req.query;

    let where = [];
    let params = [];

    if (category) {
      where.push(`l.category = $${params.length + 1}`);
      params.push(category);
    }

    if (status === 'active') {
      where.push(`l.is_active = true`);
    } else if (status === 'inactive') {
      where.push(`l.is_active = false`);
    }

    if (search) {
      where.push(`(l.title ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countRes = await query(
      `SELECT COUNT(*) as total FROM listings l LEFT JOIN users u ON l.seller_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const { rows } = await query(
      `SELECT l.*, u.name as seller_name, u.email as seller_email
       FROM listings l
       LEFT JOIN users u ON l.seller_id = u.id
       ${whereClause}
       ORDER BY l.created_at DESC
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

// Toggle listing status
r.patch(
  "/:id/toggle",
  asyncHandler(async (req, res) => {
    const { rows } = await query("UPDATE listings SET is_active = NOT is_active WHERE id = $1 RETURNING is_active", [req.params.id]);
    if (!rows[0]) throw new ApiError(404, "Listing not found");

    await query("INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)", [req.user.id, "toggle_status", "listing", req.params.id, { is_active: rows[0].is_active }]);
    res.json({ ok: true, is_active: rows[0].is_active });
  })
);

// Delete listing
r.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM listings WHERE id = $1 RETURNING id", [req.params.id]);
    if (rowCount === 0) throw new ApiError(404, "Listing not found");

    await query("INSERT INTO audit_logs (admin_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)", [req.user.id, "delete", "listing", req.params.id]);
    res.json({ ok: true, message: "Listing deleted" });
  })
);

export default r;
