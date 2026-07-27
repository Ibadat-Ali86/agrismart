import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export async function sendOtpEmail(to, code, purpose = "login") {
  const from = process.env.MAIL_FROM || "AgriSmart <no-reply@agrismart.app>";
  const subjectMap = {
    login: "Your AgriSmart login code",
    register: "Verify your AgriSmart account",
    reset: "Reset your AgriSmart password",
  };
  const heading = subjectMap[purpose] || "AgriSmart Verification";
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f7fdf7;border-radius:16px;border:1px solid #d1f0d1">
    <h2 style="color:#166534;margin:0 0 12px">${heading}</h2>
    <p style="color:#374151;margin:0 0 18px">Use the one-time code below. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#15803d;background:#fff;border:2px dashed #22c55e;border-radius:12px;padding:18px;text-align:center">${code}</div>
    <p style="color:#6b7280;font-size:12px;margin-top:18px">If you didn't request this, ignore this email.</p>
  </div>`;

  const writeToDevLog = (reason = "") => {
    try {
      const logPath = path.resolve(process.cwd(), "dev-otps.log");
      const timestamp = new Date().toISOString();
      const reasonStr = reason ? ` (${reason})` : "";
      fs.appendFileSync(logPath, `[${timestamp}] OTP for ${to} (${purpose}) = ${code}${reasonStr}\n`);
    } catch (e) {
      logger.error("Failed to write dev OTP to log file:", e.message);
    }
  };

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn(`[DEV] No SMTP configured. OTP for ${to} (${purpose}) = ${code}`);
    writeToDevLog("No SMTP configured");
    return { ok: true, dev: true };
  }
  try {
    const info = await getTransporter().sendMail({
      from, to, subject: `${heading}: ${code}`,
      text: `Your AgriSmart code is ${code}. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.`,
      html,
    });
    logger.info(`OTP email sent to ${to} (messageId=${info.messageId})`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    logger.error("Failed to send OTP email:", err.message);
    if (process.env.NODE_ENV !== "production") {
      logger.warn(`[DEV] OTP for ${to} = ${code}`);
      writeToDevLog(`SMTP error: ${err.message}`);
      return { ok: true, dev: true };
    }
    throw err;
  }
}
