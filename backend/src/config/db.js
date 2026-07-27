import pg from "pg";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

if (!connectionString) {
  logger.warn("DATABASE_URL not set — DB queries will fail");
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => logger.error("Postgres pool error:", err));

export const query = (text, params) => pool.query(text, params);

export async function ping() {
  const { rows } = await query("SELECT NOW() as now");
  return rows[0].now;
}
