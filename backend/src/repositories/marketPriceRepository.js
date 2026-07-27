import { pool, query } from "../config/db.js";

const toDto = (row) => ({
  id: row.id,
  cropName: row.crop_name,
  city: row.city,
  market: row.market,
  minPrice: row.min_price == null ? null : Number(row.min_price),
  maxPrice: row.max_price == null ? null : Number(row.max_price),
  avgPrice: Number(row.avg_price),
  previousAvgPrice: row.previous_avg_price == null ? null : Number(row.previous_avg_price),
  changePercent: row.change_percent == null ? null : Number(row.change_percent),
  unit: row.unit,
  date: String(row.price_date).slice(0, 10),
  source: row.source,
  lastUpdated: row.last_updated,
});

function whereFor({ city, crop, market, date }, start = 1) {
  const clauses = [];
  const values = [];
  const add = (sql, value) => { values.push(value); clauses.push(sql.replace("?", `$${start + values.length - 1}`)); };
  if (city) add("city_key=?", city);
  if (crop) add("crop_key=?", crop);
  if (market) add("market_key=?", market);
  if (date) add("price_date=?", date);
  return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values };
}

export async function list(filters) {
  const { page, limit, offset } = filters;
  const where = whereFor(filters);
  const [records, count] = await Promise.all([
    query(`SELECT * FROM market_prices ${where.sql} ORDER BY price_date DESC, crop_name, city LIMIT $${where.values.length + 1} OFFSET $${where.values.length + 2}`, [...where.values, limit, offset]),
    query(`SELECT COUNT(*)::int total FROM market_prices ${where.sql}`, where.values),
  ]);
  return { data: records.rows.map(toDto), total: count.rows[0].total, page, limit };
}

export async function distinct(column) {
  const allowed = column === "city" ? "city" : "crop_name";
  const { rows } = await query(`SELECT DISTINCT ${allowed} value FROM market_prices ORDER BY value`);
  return rows.map((row) => row.value);
}

export async function latest(filters = {}) {
  const where = whereFor(filters, 1);
  const extra = where.sql ? `${where.sql} AND` : "WHERE";
  const { rows } = await query(
    `WITH dates AS (SELECT DISTINCT price_date FROM market_prices ORDER BY price_date DESC LIMIT 2),
     ranked AS (
       SELECT mp.*, LAG(avg_price) OVER (PARTITION BY crop_key, city_key, market_key, unit ORDER BY price_date) previous_avg_price
       FROM market_prices mp WHERE price_date IN (SELECT price_date FROM dates)
     )
     SELECT *, CASE WHEN previous_avg_price > 0 THEN ROUND(((avg_price-previous_avg_price)/previous_avg_price*100)::numeric,2) END change_percent
     FROM ranked ${extra} price_date=(SELECT MAX(price_date) FROM dates)
     ORDER BY city, crop_name`,
    where.values,
  );
  return rows.map(toDto);
}

export async function trends({ city, crop, days }) {
  const { rows } = await query(
    `SELECT price_date, ROUND(AVG(avg_price),2) avg_price, MIN(min_price) min_price, MAX(max_price) max_price
       FROM market_prices
      WHERE city_key=$1 AND crop_key=$2 AND price_date >= CURRENT_DATE-$3::int
      GROUP BY price_date ORDER BY price_date`,
    [city, crop, days],
  );
  return rows.map((row) => ({ date: String(row.price_date).slice(0, 10), avgPrice: Number(row.avg_price), minPrice: row.min_price == null ? null : Number(row.min_price), maxPrice: row.max_price == null ? null : Number(row.max_price) }));
}

export async function dashboard() {
  const [counts, latestRows] = await Promise.all([
    query(`SELECT COUNT(DISTINCT city_key)::int total_cities, COUNT(DISTINCT crop_key)::int total_crops,
      COUNT(*) FILTER (WHERE price_date=(SELECT MAX(price_date) FROM market_prices))::int today_records,
      MAX(price_date) latest_date FROM market_prices`),
    latest(),
  ]);
  const sorted = latestRows.filter((row) => row.changePercent != null);
  const topGainers = [...sorted].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...sorted].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const highestPriceCrop = [...latestRows].sort((a, b) => b.avgPrice - a.avgPrice)[0] || null;
  const topCrops = [...latestRows].sort((a, b) => b.avgPrice - a.avgPrice).slice(0, 8);
  const cityMap = new Map();
  for (const row of latestRows) {
    const current = cityMap.get(row.city) || { city: row.city, averagePrice: 0, recordCount: 0 };
    current.averagePrice += row.avgPrice;
    current.recordCount += 1;
    cityMap.set(row.city, current);
  }
  const cityWisePrices = [...cityMap.values()].map((item) => ({ ...item, averagePrice: Number((item.averagePrice / item.recordCount).toFixed(2)) })).sort((a, b) => b.recordCount - a.recordCount).slice(0, 12);
  const c = counts.rows[0];
  return { totalCities: c.total_cities, totalCrops: c.total_crops, todayRecords: c.today_records, latestDate: c.latest_date ? String(c.latest_date).slice(0, 10) : null, topGainers, topLosers, highestPriceCrop, topCrops, topMarkets: cityWisePrices, cityWisePrices };
}

export async function upsertMany(prices) {
  if (!prices.length) return { inserted: 0, updated: 0, skipped: 0 };
  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;
  try {
    await client.query("BEGIN");
    for (const price of prices) {
      const result = await client.query(
        `INSERT INTO market_prices (crop_name,crop_key,city,city_key,market,market_key,min_price,max_price,avg_price,unit,price_date,source,source_record_id,last_updated)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
         ON CONFLICT (source,source_record_id,price_date) DO UPDATE SET
           crop_name=EXCLUDED.crop_name,city=EXCLUDED.city,market=EXCLUDED.market,min_price=EXCLUDED.min_price,
           max_price=EXCLUDED.max_price,avg_price=EXCLUDED.avg_price,unit=EXCLUDED.unit,last_updated=NOW()
         RETURNING (xmax=0) inserted`,
        [price.cropName, price.cropKey, price.city, price.cityKey, price.market, price.marketKey, price.minPrice, price.maxPrice, price.avgPrice, price.unit, price.date, price.source, price.sourceRecordId],
      );
      if (result.rows[0].inserted) inserted += 1; else updated += 1;
    }
    await client.query("COMMIT");
    return { inserted, updated, skipped: 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function startSyncLog(triggerType) {
  const { rows } = await query(`INSERT INTO market_price_sync_logs (trigger_type) VALUES ($1) RETURNING id`, [triggerType]);
  return rows[0].id;
}

export async function finishSyncLog(id, values) {
  await query(`UPDATE market_price_sync_logs SET status=$2,fetched_count=$3,inserted_count=$4,updated_count=$5,skipped_count=$6,error_summary=$7,finished_at=NOW() WHERE id=$1`,
    [id, values.status, values.fetched || 0, values.inserted || 0, values.updated || 0, values.skipped || 0, values.error ? String(values.error).slice(0, 1000) : null]);
}

export async function syncLogs({ page, limit, offset }) {
  const { rows } = await query(`SELECT * FROM market_price_sync_logs ORDER BY started_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return { data: rows, page, limit };
}