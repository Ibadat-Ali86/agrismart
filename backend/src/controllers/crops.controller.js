import { z } from "zod";
import { query } from "../config/db.js";
import { ApiError } from "../middleware/error.js";

export const CropSchema = z.object({
  farm_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  variety: z.string().max(120).optional().nullable(),
  sown_at: z.coerce.date().optional().nullable(),
  expected_harvest_at: z.coerce.date().optional().nullable(),
  health_status: z.enum(["good", "moderate", "poor"]).default("good"),
  notes: z.string().max(1000).optional().nullable(),
});

async function assertFarmOwned(farmId, userId) {
  const { rows } = await query(`SELECT owner_id FROM farms WHERE id=$1`, [farmId]);
  if (!rows[0]) throw new ApiError(404, "Farm not found");
  if (rows[0].owner_id !== userId) throw new ApiError(403, "Forbidden");
}

export async function list(req, res) {
  const { rows } = await query(
    `SELECT c.* FROM crops c JOIN farms f ON c.farm_id=f.id
     WHERE f.owner_id=$1 ${req.query.farmId ? "AND c.farm_id=$2" : ""}
     ORDER BY c.created_at DESC`,
    req.query.farmId ? [req.user.id, req.query.farmId] : [req.user.id]
  );
  res.json({ ok: true, data: rows });
}

export async function create(req, res) {
  const d = req.body;
  await assertFarmOwned(d.farm_id, req.user.id);
  const { rows } = await query(
    `INSERT INTO crops (farm_id,name,variety,sown_at,expected_harvest_at,health_status,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [d.farm_id, d.name, d.variety, d.sown_at, d.expected_harvest_at, d.health_status, d.notes]
  );
  res.status(201).json({ ok: true, data: rows[0] });
}

export async function update(req, res) {
  const cur = await query(
    `SELECT c.*, f.owner_id FROM crops c JOIN farms f ON c.farm_id=f.id WHERE c.id=$1`,
    [req.params.id]
  );
  if (!cur.rowCount) throw new ApiError(404, "Crop not found");
  if (cur.rows[0].owner_id !== req.user.id) throw new ApiError(403, "Forbidden");
  const d = { ...cur.rows[0], ...req.body };
  const { rows } = await query(
    `UPDATE crops SET name=$1,variety=$2,sown_at=$3,expected_harvest_at=$4,health_status=$5,notes=$6
     WHERE id=$7 RETURNING *`,
    [d.name, d.variety, d.sown_at, d.expected_harvest_at, d.health_status, d.notes, req.params.id]
  );
  res.json({ ok: true, data: rows[0] });
}

export async function remove(req, res) {
  const cur = await query(
    `SELECT f.owner_id FROM crops c JOIN farms f ON c.farm_id=f.id WHERE c.id=$1`,
    [req.params.id]
  );
  if (!cur.rowCount) throw new ApiError(404, "Crop not found");
  if (cur.rows[0].owner_id !== req.user.id) throw new ApiError(403, "Forbidden");
  await query(`DELETE FROM crops WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}
