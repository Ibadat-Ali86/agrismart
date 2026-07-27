import { query } from "../config/db.js";

export async function list(req, res) {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [req.user.id]
  );
  res.json({ ok: true, data: rows });
}

export async function unreadCount(req, res) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS c FROM notifications WHERE user_id=$1 AND read_at IS NULL`,
    [req.user.id]
  );
  res.json({ ok: true, count: rows[0].c });
}

export async function markRead(req, res) {
  await query(
    `UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
}

export async function markAllRead(req, res) {
  await query(
    `UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL`,
    [req.user.id]
  );
  res.json({ ok: true });
}
