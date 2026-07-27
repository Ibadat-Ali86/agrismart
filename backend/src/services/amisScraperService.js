import axios from "axios";
import * as cheerio from "cheerio";
import { createMarketPrice, normalizeKey } from "../models/MarketPrice.js";

const BASE_URL = process.env.AMIS_BASE_URL || "http://www.amis.pk";
const FALLBACK_URL = process.env.AMIS_FALLBACK_URL || "http://202.142.172.154";
const TIMEOUT = Number(process.env.AMIS_TIMEOUT_MS || 20000);
const CONCURRENCY = Math.max(1, Number(process.env.AMIS_CONCURRENCY || 3));
const DELAY = Math.max(0, Number(process.env.AMIS_DELAY_MS || 500));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value) => value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const number = (value) => {
  const normalized = clean(value).replace(/,/g, "");
  if (!normalized || normalized === "-") return null;
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

async function get(path) {
  let lastError;
  for (const origin of [BASE_URL, FALLBACK_URL]) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await axios.get(`${origin}${path}`, {
          timeout: TIMEOUT,
          headers: { "User-Agent": "AgriSmartMarketBot/1.0 (+market-data; daily public AMIS snapshot)" },
          responseType: "text",
        });
      } catch (error) {
        lastError = error;
        await sleep(500 * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

export function parseCommodityPage(html, commodityId) {
  const $ = cheerio.load(html);
  const heading = clean($("#selectedcommodity, h2").first().text());
  const cropName = clean($("#lblMsg, #ctl00_cphPage_lblMsg").first().text()) || heading.replace(/^.*Commodity:\s*/i, "").replace(/\[.*$/s, "").trim();
  const unitText = clean($("#ctl00_cphPage_lblquintal").text() || heading);
  const unitMatch = unitText.match(/Rs\s*\/\s*([^\]\s]+)/i);
  const unit = unitMatch ? unitMatch[1].replace(/specified.*$/i, "") : "100kg";
  const table = $("table.cart").first();
  const header = clean(table.find("tr").first().text());
  const dateMatch = header.match(/PriceDate:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!cropName || !dateMatch || !table.length) return [];
  const date = new Date(Date.UTC(Number(dateMatch[3]), Number(dateMatch[1]) - 1, Number(dateMatch[2])));
  const records = [];

  table.find("tr").slice(1).each((_, row) => {
    const cells = $(row).find("th,td").map((__, cell) => clean($(cell).text())).get();
    if (cells.length < 5) return;
    const market = cells[0].replace(/^\d+\s*/, "");
    const offset = cells.length >= 6 ? 0 : -1;
    const minPrice = number(cells[2 + offset]);
    const maxPrice = number(cells[3 + offset]);
    const fqp = number(cells[4 + offset]);
    const avgPrice = fqp ?? (minPrice != null && maxPrice != null ? (minPrice + maxPrice) / 2 : null);
    if (!market || avgPrice == null) return;
    records.push(createMarketPrice({
      cropName, city: market, market, minPrice, maxPrice, avgPrice, unit,
      date, source: "AMIS", sourceRecordId: `${commodityId}:${normalizeKey(market)}:${unit}`,
    }));
  });
  return records;
}

export async function discoverCommodities() {
  const { data } = await get("/BrowsePrices.aspx?searchType=0");
  const $ = cheerio.load(data);
  const map = new Map();
  $("a[href*='commodityId=']").each((_, link) => {
    const href = $(link).attr("href") || "";
    const id = href.match(/commodityId=(\d+)/i)?.[1];
    if (id) map.set(id, clean($(link).text()));
  });
  if (!map.size) for (let id = 1; id <= 150; id += 1) map.set(String(id), "");
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

export async function fetchAllMarketPrices() {
  const commodities = await discoverCommodities();
  const records = [];
  let cursor = 0;
  async function worker() {
    while (cursor < commodities.length) {
      const commodity = commodities[cursor];
      cursor += 1;
      try {
        const { data } = await get(`/Printer.aspx?searchType=0&commodityId=${commodity.id}`);
        records.push(...parseCommodityPage(data, commodity.id));
      } catch { /* retain other commodities; minimum validation below protects snapshots */ }
      await sleep(DELAY);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const minimum = Number(process.env.AMIS_MIN_RECORDS || 10);
  if (records.length < minimum) throw new Error(`AMIS returned only ${records.length} valid price records`);
  return records;
}

export async function fetchPricesByCity(city) {
  const key = normalizeKey(city);
  return (await fetchAllMarketPrices()).filter((price) => price.cityKey === key);
}

export async function fetchPricesByCrop(cropName) {
  const key = normalizeKey(cropName);
  return (await fetchAllMarketPrices()).filter((price) => price.cropKey === key);
}