import { z } from "zod";

export const MarketPriceSchema = z.object({
  cropName: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(120),
  market: z.string().trim().min(1).max(160),
  minPrice: z.number().nonnegative().nullable(),
  maxPrice: z.number().nonnegative().nullable(),
  avgPrice: z.number().nonnegative(),
  unit: z.string().trim().min(1).max(30),
  date: z.coerce.date(),
  source: z.string().trim().min(1).max(50),
  sourceRecordId: z.string().trim().min(1).max(240),
});

export const normalizeKey = (value) => value
  .normalize("NFKC")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\p{L}]+/gu, "-")
  .replace(/^-|-$/g, "");

export function createMarketPrice(input) {
  const price = MarketPriceSchema.parse(input);
  return {
    ...price,
    cropKey: normalizeKey(price.cropName),
    cityKey: normalizeKey(price.city),
    marketKey: normalizeKey(price.market),
    date: price.date.toISOString().slice(0, 10),
  };
}