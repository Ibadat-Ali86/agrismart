import { randomUUID } from "crypto";

const HEADER = "x-request-id";

export function requestId(req, res, next) {
  const incoming = req.headers[HEADER];
  const id = typeof incoming === "string" && incoming.length > 0 && incoming.length <= 64
    ? incoming
    : randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
}
