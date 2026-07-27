import { z } from "zod";
import { paginate } from "../middleware/asyncHandler.js";
import { normalizeKey } from "../models/MarketPrice.js";
import * as repository from "../repositories/marketPriceRepository.js";
import { cacheGet, cacheKeys, cacheSet } from "../services/marketPriceCache.js";
import { syncMarketPrices } from "../jobs/marketPriceJob.js";

export const ListQuerySchema = z.object({
  city: z.string().trim().max(120).optional(), crop: z.string().trim().max(160).optional(),
  market: z.string().trim().max(160).optional(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).optional(),
});
export const TrendQuerySchema = z.object({
  city: z.string().trim().min(1).max(120), crop: z.string().trim().min(1).max(160),
  days: z.coerce.number().int().min(2).max(365).default(30),
});
export const LogQuerySchema = z.object({ page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).optional() });

const normalized = (q) => ({ ...q, city: q.city ? normalizeKey(q.city) : undefined, crop: q.crop ? normalizeKey(q.crop) : undefined, market: q.market ? normalizeKey(q.market) : undefined });
const envelope = (data, cache, extra = {}) => ({ ok: true, ...data, meta: { source: "AMIS", cache, stale: false, ...extra } });

async function cached(key, loader) {
  const hit = await cacheGet(key);
  if (hit) return { value: hit, cache: "hit" };
  const value = await loader();
  await cacheSet(key, value);
  return { value, cache: "miss" };
}

export async function list(req, res) {
  const paging = paginate(req.query);
  const filters = normalized({ ...req.query, ...paging });
  const result = await cached(cacheKeys.list(filters), () => repository.list(filters));
  res.json(envelope(result.value, result.cache));
}

export async function cities(_req, res) {
  const result = await cached(cacheKeys.cities, () => repository.distinct("city"));
  res.json(envelope({ data: result.value }, result.cache));
}

export async function crops(_req, res) {
  const result = await cached(cacheKeys.crops, () => repository.distinct("crop"));
  res.json(envelope({ data: result.value }, result.cache));
}

export async function latest(req, res) {
  const filters = normalized(req.query);
  const result = await cached(cacheKeys.latest(filters), () => repository.latest(filters));
  res.json(envelope({ data: result.value }, result.cache, { latestDate: result.value[0]?.date || null }));
}

export async function trends(req, res) {
  const filters = normalized(req.query);
  const result = await cached(cacheKeys.trends(filters), () => repository.trends(filters));
  res.json(envelope({ data: result.value }, result.cache));
}

export async function dashboard(_req, res) {
  const result = await cached(cacheKeys.dashboard, repository.dashboard);
  res.json(envelope({ data: result.value }, result.cache, { latestDate: result.value.latestDate }));
}

export async function manualSync(_req, res) {
  const result = await syncMarketPrices("manual");
  res.status(result.status === "skipped" ? 409 : 200).json({ ok: result.status !== "skipped", data: result });
}

export async function logs(req, res) {
  res.json({ ok: true, ...(await repository.syncLogs(paginate(req.query))) });
}