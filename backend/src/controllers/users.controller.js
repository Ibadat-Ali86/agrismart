import { z } from "zod";
import { query } from "../config/db.js";

export const ProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(30).optional().nullable(),
  language: z.string().max(10).optional(),
  state: z.string().max(80).optional().nullable(),
  district: z.string().max(80).optional().nullable(),
  village: z.string().max(80).optional().nullable(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

export async function updateMe(req, res) {
  const d = req.body;
  const { rows } = await query(
    `UPDATE users SET
       name=COALESCE($1,name),
       phone=COALESCE($2,phone),
       language=COALESCE($3,language),
       state=COALESCE($4,state),
       district=COALESCE($5,district),
       village=COALESCE($6,village),
       avatar_url=COALESCE($7,avatar_url)
     WHERE id=$8
     RETURNING id,name,email,phone,role,language,avatar_url,state,district,village,email_verified`,
    [d.name, d.phone, d.language, d.state, d.district, d.village, d.avatar_url, req.user.id]
  );
  res.json({ ok: true, user: rows[0] });
}
