import { Router } from "express";
import { query } from "../config/db.js";
import { asyncHandler, paginate } from "../middleware/asyncHandler.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const r = Router();
r.use(requireAuth, requireAdmin);

r.get("/", asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const countRes = await query(`SELECT COUNT(*) as total FROM orders`);
    const total = parseInt(countRes.rows[0].total, 10);
    const { rows } = await query(
      `SELECT * FROM orders LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ ok: true, data: rows, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}));

export default r;
