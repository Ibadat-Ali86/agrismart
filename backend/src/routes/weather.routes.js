import { Router } from "express";
import { z } from "zod";
import { logger } from "../utils/logger.js";

const router = Router();
const OW_BASE = "https://api.openweathermap.org";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  q: z.string().min(2).max(80).optional(),
  units: z.enum(["metric", "imperial"]).default("metric"),
});

async function fetchJSON(url) {
  const r = await fetch(url);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(body?.message || `OpenWeather ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return body;
}

// GET /api/v1/weather?lat=&lng=  OR  ?q=Pune
router.get("/", async (req, res, next) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: "OPENWEATHER_API_KEY not configured" });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    const { units } = parsed.data;
    let { lat, lng, q } = parsed.data;

    // Geocode if only city name was provided
    if ((lat == null || lng == null) && q) {
      const geo = await fetchJSON(
        `${OW_BASE}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${apiKey}`
      );
      if (!geo.length) return res.status(404).json({ ok: false, error: "Location not found" });
      lat = geo[0].lat; lng = geo[0].lon;
    }
    if (lat == null || lng == null) {
      return res.status(400).json({ ok: false, error: "Provide lat & lng OR q (city name)" });
    }

    const [current, forecast] = await Promise.all([
      fetchJSON(`${OW_BASE}/data/2.5/weather?lat=${lat}&lon=${lng}&units=${units}&appid=${apiKey}`),
      fetchJSON(`${OW_BASE}/data/2.5/forecast?lat=${lat}&lon=${lng}&units=${units}&appid=${apiKey}`),
    ]);

    // Pick midday forecasts for the next 5 days
    const byDay = new Map();
    for (const it of forecast.list || []) {
      const day = it.dt_txt?.slice(0, 10);
      if (!day) continue;
      const hour = Number(it.dt_txt.slice(11, 13));
      const prev = byDay.get(day);
      // prefer the slot closest to 12:00
      if (!prev || Math.abs(hour - 12) < Math.abs(prev._hour - 12)) {
        byDay.set(day, { ...it, _hour: hour });
      }
    }
    const daily = [...byDay.values()].slice(0, 5).map((d) => ({
      date: d.dt_txt.slice(0, 10),
      tempC: Math.round(d.main.temp),
      minC: Math.round(d.main.temp_min),
      maxC: Math.round(d.main.temp_max),
      humidity: d.main.humidity,
      condition: d.weather?.[0]?.main || "—",
      description: d.weather?.[0]?.description || "",
      icon: d.weather?.[0]?.icon,
      windKph: Math.round((d.wind?.speed || 0) * 3.6),
      rainMm: d.rain?.["3h"] || 0,
    }));

    res.json({
      ok: true,
      location: {
        name: current.name,
        country: current.sys?.country,
        lat: current.coord?.lat,
        lng: current.coord?.lon,
      },
      current: {
        tempC: Math.round(current.main.temp),
        feelsLikeC: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        pressure: current.main.pressure,
        condition: current.weather?.[0]?.main,
        description: current.weather?.[0]?.description,
        icon: current.weather?.[0]?.icon,
        windKph: Math.round((current.wind?.speed || 0) * 3.6),
        cloudsPct: current.clouds?.all,
        sunrise: current.sys?.sunrise,
        sunset: current.sys?.sunset,
      },
      hourly: (forecast.list || []).slice(0, 8).map((h) => ({
        time: h.dt_txt,
        tempC: Math.round(h.main.temp),
        icon: h.weather?.[0]?.icon,
        condition: h.weather?.[0]?.main,
        rainMm: h.rain?.["3h"] || 0,
      })),
      daily,
    });
  } catch (e) {
    logger.error("Weather error:", e.message);
    next(e);
  }
});

export default router;
