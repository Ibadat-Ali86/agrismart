import { z } from "zod";
import { query } from "../config/db.js";
import { ApiError } from "../middleware/error.js";
import { paginate } from "../middleware/asyncHandler.js";

export const ListingSchema = z.object({
  title: z.string().min(2).max(160),
  category: z.enum(["crop", "seed", "fertilizer", "equipment", "other"]).default("crop"),
  description: z.string().max(2000).optional().nullable(),
  price_per_unit: z.coerce.number().min(0),
  unit: z.string().min(1).max(20).default("kg"),
  quantity_available: z.coerce.number().min(0),
  images: z.array(z.string().url()).max(8).optional().default([]),
  location: z.string().max(200).optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const { q, category, minPrice, maxPrice } = req.query;
  const where = ["l.is_active=true"];
  const params = [];
  if (q) { params.push(`%${q}%`); where.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`); }
  if (category) { params.push(category); where.push(`l.category=$${params.length}`); }
  if (minPrice) { params.push(Number(minPrice)); where.push(`l.price_per_unit>=$${params.length}`); }
  if (maxPrice) { params.push(Number(maxPrice)); where.push(`l.price_per_unit<=$${params.length}`); }
  const sql = `SELECT l.*, u.name AS seller_name FROM listings l JOIN users u ON l.seller_id=u.id
               WHERE ${where.join(" AND ")} ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const { rows } = await query(sql, [...params, limit, offset]);
  res.json({ ok: true, data: rows, page, limit });
}

export async function get(req, res) {
  const { rows } = await query(
    `SELECT l.*, u.name AS seller_name, u.email AS seller_email
     FROM listings l JOIN users u ON l.seller_id=u.id WHERE l.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, "Listing not found");
  res.json({ ok: true, data: rows[0] });
}

export async function mine(req, res) {
  const { rows } = await query(
    `SELECT * FROM listings WHERE seller_id=$1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ ok: true, data: rows });
}

export async function create(req, res) {
  const d = req.body;
  const { rows } = await query(
    `INSERT INTO listings (seller_id,title,category,description,price_per_unit,unit,quantity_available,images,location)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.id, d.title, d.category, d.description, d.price_per_unit, d.unit, d.quantity_available, d.images, d.location]
  );
  res.status(201).json({ ok: true, data: rows[0] });
}

export async function update(req, res) {
  const cur = await query(`SELECT seller_id FROM listings WHERE id=$1`, [req.params.id]);
  if (!cur.rowCount) throw new ApiError(404, "Listing not found");
  if (cur.rows[0].seller_id !== req.user.id) throw new ApiError(403, "Forbidden");
  const d = req.body;
  const { rows } = await query(
    `UPDATE listings SET title=$1,category=$2,description=$3,price_per_unit=$4,unit=$5,
     quantity_available=$6,images=$7,location=$8,is_active=COALESCE($9,is_active)
     WHERE id=$10 RETURNING *`,
    [d.title, d.category, d.description, d.price_per_unit, d.unit, d.quantity_available, d.images, d.location, d.is_active, req.params.id]
  );
  res.json({ ok: true, data: rows[0] });
}

export async function remove(req, res) {
  const cur = await query(`SELECT seller_id FROM listings WHERE id=$1`, [req.params.id]);
  if (!cur.rowCount) throw new ApiError(404, "Listing not found");
  if (cur.rows[0].seller_id !== req.user.id) throw new ApiError(403, "Forbidden");
  await query(`DELETE FROM listings WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
}
