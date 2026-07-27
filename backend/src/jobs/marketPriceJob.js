import cron from "node-cron";
import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { fetchAllMarketPrices } from "../services/amisScraperService.js";
import { invalidateMarketCache } from "../services/marketPriceCache.js";
import * as repository from "../repositories/marketPriceRepository.js";

const LOCK_ID = 246813579;
let task;
let running = false;

export async function syncMarketPrices(triggerType = "scheduled") {
  if (running) return { status: "skipped", reason: "A market sync is already running" };
  const lockClient = await pool.connect();
  let locked = false;
  let logId;
  try {
    const lock = await lockClient.query("SELECT pg_try_advisory_lock($1) locked", [LOCK_ID]);
    locked = lock.rows[0].locked;
    if (!locked) return { status: "skipped", reason: "A market sync is running on another instance" };
    running = true;
    logId = await repository.startSyncLog(triggerType);
    const prices = await fetchAllMarketPrices();
    const result = await repository.upsertMany(prices);
    await invalidateMarketCache();
    await repository.finishSyncLog(logId, { status: "success", fetched: prices.length, ...result });
    logger.info(`AMIS market sync completed: ${prices.length} fetched, ${result.inserted} inserted, ${result.updated} updated`);
    return { id: logId, status: "success", fetched: prices.length, ...result };
  } catch (error) {
    if (logId) await repository.finishSyncLog(logId, { status: "failed", error: error.message });
    logger.error("AMIS market sync failed; retaining last database snapshot:", error.message);
    throw error;
  } finally {
    running = false;
    if (locked) await lockClient.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => undefined);
    lockClient.release();
  }
}

export function startMarketPriceJob() {
  if (process.env.MARKET_SYNC_ENABLED === "false" || task) return task;
  task = cron.schedule("0 6 * * *", () => syncMarketPrices("scheduled").catch(() => undefined), { timezone: "Asia/Karachi" });
  logger.info("Market-price sync scheduled daily at 06:00 Asia/Karachi");
  return task;
}

export function stopMarketPriceJob() {
  task?.stop();
  task = undefined;
}

export function marketJobStatus() { return { enabled: process.env.MARKET_SYNC_ENABLED !== "false", running, schedule: "0 6 * * *", timezone: "Asia/Karachi" }; }