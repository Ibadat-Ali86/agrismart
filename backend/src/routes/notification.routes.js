import { Router } from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/notifications.controller.js";
import { addClient } from "../sse/notifications.js";

const r = Router();

// SSE stream — auth via ?token=
r.get("/stream", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  let user;
  try { user = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).end(); }
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`: connected\n\n`);
  const ping = setInterval(() => res.write(`: ping\n\n`), 25_000);
  res.on("close", () => clearInterval(ping));
  addClient(user.id, res);
});

r.use(requireAuth);
r.get("/", asyncHandler(c.list));
r.get("/unread-count", asyncHandler(c.unreadCount));
r.post("/:id/read", asyncHandler(c.markRead));
r.post("/read-all", asyncHandler(c.markAllRead));
export default r;
