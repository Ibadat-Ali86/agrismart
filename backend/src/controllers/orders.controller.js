import { z } from "zod";
import { pool, query } from "../config/db.js";
import { ApiError } from "../middleware/error.js";
import { pushNotification } from "../sse/notifications.js";

export const OrderCreateSchema = z.object({
  listing_id: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  shipping_address: z.string().min(5).max(500),
});

export const OrderStatusSchema = z.object({
  status: z.enum(["confirmed", "shipped", "delivered", "cancelled"]),
});

export async function listMine(req, res) {
  const role = req.query.role === "seller" ? "seller_id" : "buyer_id";
  const { rows } = await query(
    `SELECT o.*, l.title AS listing_title, l.unit
       FROM orders o JOIN listings l ON o.listing_id=l.id
      WHERE o.${role}=$1 ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ ok: true, data: rows });
}

export async function create(req, res) {
  const { listing_id, quantity, shipping_address } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: ls } = await client.query(
      `SELECT * FROM listings WHERE id=$1 AND is_active=true FOR UPDATE`,
      [listing_id]
    );
    const listing = ls[0];
    if (!listing) throw new ApiError(404, "Listing not available");
    if (listing.seller_id === req.user.id) throw new ApiError(400, "Cannot buy your own listing");
    if (Number(listing.quantity_available) < quantity) throw new ApiError(400, "Insufficient stock");
    const total = Number(listing.price_per_unit) * quantity;

    const { rows: ords } = await client.query(
      `INSERT INTO orders (buyer_id,seller_id,listing_id,quantity,total_amount,shipping_address)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, listing.seller_id, listing.id, quantity, total, shipping_address]
    );
    await client.query(
      `UPDATE listings SET quantity_available=quantity_available-$1 WHERE id=$2`,
      [quantity, listing.id]
    );
    await client.query(
      `INSERT INTO notifications (user_id,type,title,body) VALUES ($1,'order','New order received',$2)`,
      [listing.seller_id, `${quantity} ${listing.unit} of ${listing.title}`]
    );
    await client.query("COMMIT");
    pushNotification(listing.seller_id, { type: "order", title: "New order received" });
    res.status(201).json({ ok: true, data: ords[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateStatus(req, res) {
  const { rows } = await query(`SELECT * FROM orders WHERE id=$1`, [req.params.id]);
  const order = rows[0];
  if (!order) throw new ApiError(404, "Order not found");
  const { status } = req.body;
  const isSeller = order.seller_id === req.user.id;
  const isBuyer = order.buyer_id === req.user.id;
  if (status === "cancelled" && !(isBuyer || isSeller)) throw new ApiError(403, "Forbidden");
  if (status !== "cancelled" && !isSeller) throw new ApiError(403, "Only seller can update status");
  if (status === "cancelled" && order.status !== "pending") throw new ApiError(400, "Only pending orders can be cancelled");

  const { rows: upd } = await query(`UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`, [status, req.params.id]);
  await query(
    `INSERT INTO notifications (user_id,type,title,body) VALUES ($1,'order','Order ${status}',$2)`,
    [order.buyer_id, `Your order is now ${status}`]
  );
  pushNotification(order.buyer_id, { type: "order", title: `Order ${status}` });
  res.json({ ok: true, data: upd[0] });
}
