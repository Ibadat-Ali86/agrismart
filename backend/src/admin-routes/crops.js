import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, paginate } from "../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";

const r = Router();
r.use(requireAuth, requireAdmin);

// List all crops
r.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const { search } = req.query;

    let where = [];
    let params = [];

    if (search) {
      where.push(`(c.name ILIKE $${params.length + 1} OR c.variety ILIKE $${params.length + 1} OR f.name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countRes = await query(
      `SELECT COUNT(*) as total FROM crops c LEFT JOIN farms f ON c.farm_id = f.id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const { rows } = await query(
      `SELECT c.*, f.name as farm_name, u.name as owner_name
       FROM crops c
       LEFT JOIN farms f ON c.farm_id = f.id
       LEFT JOIN users u ON f.owner_id = u.id
       ${whereClause}
       ORDER BY c.created_at DESC
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

// Delete crop
r.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM crops WHERE id = $1 RETURNING id", [req.params.id]);
    if (rowCount === 0) throw new ApiError(404, "Crop not found");

    await query("INSERT INTO audit_logs (admin_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)", [req.user.id, "delete", "crop", req.params.id]);
    res.json({ ok: true, message: "Crop deleted" });
  })
);

export default r;
