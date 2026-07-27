import bcrypt from "bcryptjs";
import crypto from "crypto";
import { query } from "../config/db.js";
import { ApiError } from "../middleware/error.js";
import { signToken } from "../middleware/auth.js";
import { sendOtpEmail } from "../utils/mailer.js";

const TTL_MIN = Number(process.env.OTP_TTL_MINUTES || 10);
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");
const genCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

async function issueOtp(email, purpose = "login") {
  const code = genCode();
  const code_hash = hashCode(code);
  const expires_at = new Date(Date.now() + TTL_MIN * 60 * 1000);
  await query(`UPDATE otp_codes SET consumed_at=NOW() WHERE email=$1 AND purpose=$2 AND consumed_at IS NULL`, [email, purpose]);
  await query(
    `INSERT INTO otp_codes (email,code_hash,purpose,expires_at) VALUES ($1,$2,$3,$4)`,
    [email, code_hash, purpose, expires_at]
  );
  await sendOtpEmail(email, code, purpose);
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const e = email.toLowerCase();
    const exists = await query("SELECT id FROM users WHERE email=$1", [e]);
    if (exists.rowCount) throw new ApiError(409, "Email already registered");
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name,email,password_hash,role)
       VALUES ($1,$2,$3,COALESCE($4,'farmer'))
       RETURNING id,name,email,role,created_at`,
      [name, e, password_hash, role]
    );
    await issueOtp(e, "register");
    res.status(201).json({ ok: true, user: rows[0], otpSent: true, ttlMinutes: TTL_MIN });
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      "SELECT id,name,email,role,password_hash,email_verified FROM users WHERE email=$1",
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user || !user.password_hash) throw new ApiError(401, "Invalid credentials");
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new ApiError(401, "Invalid credentials");
    const token = signToken({ id: user.id, role: user.role });
    delete user.password_hash;
    res.cookie("token", token, {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true, token, user });
  } catch (e) { next(e); }
}

export async function requestOtp(req, res, next) {
  try { await issueOtp(req.body.email.toLowerCase(), "login");
    res.json({ ok: true, message: "OTP sent", ttlMinutes: TTL_MIN });
  } catch (e) { next(e); }
}

export async function verifyOtp(req, res, next) {
  try {
    const { email, code } = req.body;
    const e = email.toLowerCase();
    const code_hash = hashCode(code);
    const { rows } = await query(
      `SELECT id,attempts,expires_at,consumed_at,code_hash,purpose
         FROM otp_codes WHERE email=$1 AND consumed_at IS NULL
        ORDER BY created_at DESC LIMIT 1`,
      [e]
    );
    const otp = rows[0];
    if (!otp) throw new ApiError(400, "No active OTP — request a new one");
    if (new Date(otp.expires_at) < new Date()) throw new ApiError(400, "OTP expired");
    if (otp.attempts >= MAX_ATTEMPTS) throw new ApiError(429, "Too many attempts");
    if (otp.code_hash !== code_hash) {
      await query("UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1", [otp.id]);
      throw new ApiError(400, "Invalid code");
    }
    await query("UPDATE otp_codes SET consumed_at=NOW() WHERE id=$1", [otp.id]);

    let user;
    const existing = await query("SELECT id,name,email,role FROM users WHERE email=$1", [e]);
    if (existing.rowCount) {
      user = existing.rows[0];
      await query("UPDATE users SET email_verified=true WHERE id=$1", [user.id]);
    } else {
      const ins = await query(
        `INSERT INTO users (name,email,password_hash,role,email_verified)
         VALUES ($1,$2,$3,'farmer',true) RETURNING id,name,email,role`,
        [e.split("@")[0], e, await bcrypt.hash(crypto.randomUUID(), 10)]
      );
      user = ins.rows[0];
    }
    const token = signToken({ id: user.id, role: user.role });
    res.cookie("token", token, {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true, token, user });
  } catch (e) { next(e); }
}

export async function forgotPassword(req, res, next) {
  try {
    const e = req.body.email.toLowerCase();
    const u = await query("SELECT id FROM users WHERE email=$1", [e]);
    // Always 200 to avoid email enumeration
    if (u.rowCount) await issueOtp(e, "reset");
    res.json({ ok: true, message: "If the email exists, a reset code was sent" });
  } catch (e) { next(e); }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, code, password } = req.body;
    const e = email.toLowerCase();
    const code_hash = hashCode(code);
    const { rows } = await query(
      `SELECT id,attempts,expires_at,code_hash FROM otp_codes
        WHERE email=$1 AND purpose='reset' AND consumed_at IS NULL
        ORDER BY created_at DESC LIMIT 1`, [e]);
    const otp = rows[0];
    if (!otp) throw new ApiError(400, "No active reset code");
    if (new Date(otp.expires_at) < new Date()) throw new ApiError(400, "Code expired");
    if (otp.attempts >= MAX_ATTEMPTS) throw new ApiError(429, "Too many attempts");
    if (otp.code_hash !== code_hash) {
      await query("UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1", [otp.id]);
      throw new ApiError(400, "Invalid code");
    }
    const password_hash = await bcrypt.hash(password, 10);
    await query("UPDATE users SET password_hash=$1 WHERE email=$2", [password_hash, e]);
    await query("UPDATE otp_codes SET consumed_at=NOW() WHERE id=$1", [otp.id]);
    res.json({ ok: true, message: "Password updated" });
  } catch (e) { next(e); }
}

export function logout(_req, res) { res.clearCookie("token"); res.json({ ok: true }); }

export async function me(req, res, next) {
  try {
    const { rows } = await query(
      "SELECT id,name,email,phone,role,language,avatar_url,state,district,village,email_verified,created_at FROM users WHERE id=$1",
      [req.user.id]
    );
    if (!rows[0]) throw new ApiError(404, "User not found");
    res.json({ ok: true, user: rows[0] });
  } catch (e) { next(e); }
}
