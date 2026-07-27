import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const schemas = ["schema.sql", "admin-schema.sql"];
  logger.info("Applying application and admin schemas to Neon Postgres...");
  for (const schema of schemas) {
    const sql = fs.readFileSync(path.join(__dirname, schema), "utf8");
    await pool.query(sql);
  }
  logger.info("✅ Migration complete");
  await pool.end();
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
