import { createClient } from "redis";
import { logger } from "../utils/logger.js";

let client;
let connecting;

export async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (client?.isReady) return client;
  if (connecting) return connecting;

  client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (error) => logger.warn("Redis unavailable; using database fallback:", error.message));
  connecting = client.connect().then(() => client).catch(() => null).finally(() => { connecting = undefined; });
  return connecting;
}

export async function closeRedis() {
  if (client?.isOpen) await client.quit().catch(() => undefined);
}