import { getRedis } from "../config/redis.js";

const TTL_SECONDS = Number(process.env.MARKET_CACHE_TTL_SECONDS || 3600);
const safeKey = (value = "all") => encodeURIComponent(String(value).trim().toLowerCase());

export const cacheKeys = {
  list: ({ city, crop, market, date, page, limit }) => `market:list:${safeKey(city)}:${safeKey(crop)}:${safeKey(market)}:${safeKey(date)}:${page}:${limit}`,
  city: (city) => `market:city:${safeKey(city)}`,
  crop: (crop) => `market:crop:${safeKey(crop)}`,
  latest: ({ city, crop }) => `market:latest:${safeKey(city)}:${safeKey(crop)}`,
  trends: ({ city, crop, days }) => `market:trends:${safeKey(city)}:${safeKey(crop)}:${days}`,
  dashboard: "market:dashboard",
  cities: "market:cities",
  crops: "market:crops",
};

export async function cacheGet(key) {
  try {
    const redis = await getRedis();
    const value = redis ? await redis.get(key) : null;
    return value ? JSON.parse(value) : null;
  } catch { return null; }
}

export async function cacheSet(key, value) {
  try {
    const redis = await getRedis();
    if (redis) await redis.set(key, JSON.stringify(value), { EX: TTL_SECONDS });
  } catch { /* cache must never fail a request */ }
}

export async function invalidateMarketCache() {
  try {
    const redis = await getRedis();
    if (!redis) return;
    for await (const key of redis.scanIterator({ MATCH: "market:*", COUNT: 100 })) {
      await redis.del(key);
    }
  } catch { /* database remains authoritative */ }
}