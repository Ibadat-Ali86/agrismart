import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, paginate } from "../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";

const r = Router();
r.use(requireAuth, requireAdmin);

// List all orders
r.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const { search, status } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push(`o.status = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      where.push(`(l.title ILIKE $${params.length + 1} OR b.name ILIKE $${params.length + 1} OR s.name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countRes = await query(
      `SELECT COUNT(*) as total FROM orders o
       LEFT JOIN listings l ON o.listing_id = l.id
       LEFT JOIN users b ON o.buyer_id = b.id
       LEFT JOIN users s ON o.seller_id = s.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const { rows } = await query(
      `SELECT o.*, l.title as listing_title, b.name as buyer_name, s.name as seller_name
       FROM orders o
       LEFT JOIN listings l ON o.listing_id = l.id
       LEFT JOIN users b ON o.buyer_id = b.id
       LEFT JOIN users s ON o.seller_id = s.id
       ${whereClause}
       ORDER BY o.created_at DESC
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

// Update order status
r.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw new ApiError(400, "Status is required");

    const { rows } = await query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING status", [status, req.params.id]);
    if (!rows[0]) throw new ApiError(404, "Order not found");

    await query("INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)", [req.user.id, "update_order_status", "order", req.params.id, { status }]);
    res.json({ ok: true, status: rows[0].status });
  })
);

export default r;
