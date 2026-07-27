import { z } from "zod";
import { query } from "../config/db.js";
import { ApiError } from "../middleware/error.js";
import { paginate } from "../middleware/asyncHandler.js";

export const FarmSchema = z.object({
  name: z.string().min(2).max(120),
  area_acres: z.coerce.number().min(0).max(1_000_000),
  soil_type: z.string().max(80).optional().nullable(),
  irrigation_type: z.string().max(80).optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

export async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const { rows } = await query(
    `SELECT * FROM farms WHERE owner_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );
  const total = await query(`SELECT COUNT(*)::int AS c FROM farms WHERE owner_id=$1`, [req.user.id]);
  res.json({ ok: true, data: rows, page, limit, total: total.rows[0].c });
}

export async function get(req, res) {
  const { rows } = await query(`SELECT * FROM farms WHERE id=$1`, [req.params.id]);
  if (!rows[0]) throw new ApiError(404, "Farm not found");
  if (rows[0].owner_id !== req.user.id) throw new ApiError(403, "Forbidden");
  res.json({ ok: true, data: rows[0] });
}

export async function create(req, res) {
  const d = req.body;
  const { rows } = await query(
    `INSERT INTO farms (owner_id,name,area_acres,soil_type,irrigation_type,lat,lng,address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, d.name, d.area_acres, d.soil_type, d.irrigation_type, d.lat, d.lng, d.address]
  );
  res.status(201).json({ ok: true, data: rows[0] });
}

export async function update(req, res) {
  const own = await query(`SELECT owner_id FROM farms WHERE id=$1`, [req.params.id]);
  if (!own.rowCount) throw new ApiError(404, "Farm not found");
  if (own.rows[0].owner_id !== req.user.id) throw new ApiError(403, "Forbidden");
  const d = req.body;
  const { rows } = await query(
    `UPDATE farms SET name=$1,area_acres=$2,soil_type=$3,irrigation_type=$4,lat=$5,lng=$6,address=$7
     WHERE id=$8 RETURNING *`,
    [d.name, d.area_acres, d.soil_type, d.irrigation_type, d.lat, d.lng, d.address, req.params.id]
  );
  res.json({ ok: true, data: rows[0] });
}

export async function remove(req, res) {
  const own = await query(`SELECT owner_id FROM farms WHERE id=$1`, [req.params.id]);
  if (!own.rowCount) throw new ApiError(404, "Farm not found");
  if (own.rows[0].owner_id !== req.user.id) throw new ApiError(403, "Forbidden");
  await query(`DELETE FROM farms WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}
