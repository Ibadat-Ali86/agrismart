import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, paginate } from "../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";

const r = Router();
r.use(requireAuth, requireAdmin);

// List all market prices
r.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const { search, city, crop } = req.query;

    let where = [];
    let params = [];

    if (city) {
      where.push(`city_key = $${params.length + 1}`);
      params.push(city);
    }

    if (crop) {
      where.push(`crop_key = $${params.length + 1}`);
      params.push(crop);
    }

    if (search) {
      where.push(`(crop_name ILIKE $${params.length + 1} OR city ILIKE $${params.length + 1} OR market ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countRes = await query(
      `SELECT COUNT(*) as total FROM market_prices ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const { rows } = await query(
      `SELECT *
       FROM market_prices
       ${whereClause}
       ORDER BY price_date DESC, created_at DESC
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

// Delete market price record
r.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM market_prices WHERE id = $1 RETURNING id", [req.params.id]);
    if (rowCount === 0) throw new ApiError(404, "Market price record not found");

    await query("INSERT INTO audit_logs (admin_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)", [req.user.id, "delete", "market_price", req.params.id]);
    res.json({ ok: true, message: "Market price record deleted" });
  })
);

export default r;
