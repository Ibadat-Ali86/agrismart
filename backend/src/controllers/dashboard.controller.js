import { query } from "../config/db.js";

export async function summary(req, res) {
  const uid = req.user.id;
  const [farms, crops, listings, orders, notifs] = await Promise.all([
    query(`SELECT COUNT(*)::int c FROM farms WHERE owner_id=$1`, [uid]),
    query(`SELECT COUNT(*)::int c FROM crops c JOIN farms f ON c.farm_id=f.id WHERE f.owner_id=$1`, [uid]),
    query(`SELECT COUNT(*)::int c FROM listings WHERE seller_id=$1 AND is_active=true`, [uid]),
    query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, l.title AS listing_title
         FROM orders o JOIN listings l ON o.listing_id=l.id
        WHERE o.buyer_id=$1 OR o.seller_id=$1
        ORDER BY o.created_at DESC LIMIT 5`,
      [uid]
    ),
    query(
      `SELECT COUNT(*)::int c FROM notifications WHERE user_id=$1 AND read_at IS NULL`,
      [uid]
    ),
  ]);
  res.json({
    ok: true,
    data: {
      farms: farms.rows[0].c,
      crops: crops.rows[0].c,
      activeListings: listings.rows[0].c,
      recentOrders: orders.rows,
      unreadNotifications: notifs.rows[0].c,
    },
  });
}
