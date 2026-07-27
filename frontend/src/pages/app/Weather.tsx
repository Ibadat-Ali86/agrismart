import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { useQuery } from "@tanstack/react-query";
import { api, iconUrl, type WeatherResponse } from "@/lib/api";
import { MapPin, AlertTriangle, Loader2, Wind, Droplets, Gauge, Sunrise, Sunset, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Coords { lat: number; lng: number }

function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLoading(false); },
      (e) => { setError(e.message); setLoading(false); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  }, []);
  return { coords, error, loading };
}

function WeatherPage() {
  const { coords, error: geoError, loading: geoLoading } = useGeolocation();
  const { user } = useAuth();
  const [city, setCity] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");

  const fallbackCity = !geoLoading && !coords && geoError ? (user?.district || "Lahore") : "";
  const effectiveCity = city || fallbackCity;

  const query = useQuery<WeatherResponse>({
    queryKey: ["weather", effectiveCity, coords],
    enabled: Boolean(effectiveCity || (!geoLoading && coords)),
    queryFn: () => (effectiveCity ? api.weather.byCity(effectiveCity) : api.weather.byCoords(coords!.lat, coords!.lng)),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError, error, refetch, isFetching } = query;
  const fmtTime = (epoch?: number) =>
    epoch ? new Date(epoch * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  const dayName = (iso: string) =>
    new Date(iso).toLocaleDateString([], { weekday: "short" });

  return (
    <div>
      <AppHeaderBack title="Weather" />
      <div className="space-y-4 p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); if (searchInput.trim()) setCity(searchInput.trim()); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search city (e.g. Pune)"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="button" onClick={() => refetch()}
            className="grid size-11 place-items-center rounded-xl border border-border bg-card hover:border-primary/40"
            aria-label="Refresh"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin text-primary" : "text-muted-foreground"}`} />
          </button>
        </form>

        {!coords && !city && !geoError && !fallbackCity && (
          <p className="text-sm text-muted-foreground">Getting your location…</p>
        )}
        {geoError && !city && !fallbackCity && (
          <p className="text-sm text-warning">📍 Location blocked — search a city above.</p>
        )}
        {geoError && !city && fallbackCity && (
          <p className="text-sm text-primary">📍 Location blocked — showing weather for {fallbackCity}.</p>
        )}

        {isLoading && (
          <div className="grid h-40 place-items-center rounded-2xl border border-border bg-card">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {(error as Error)?.message || "Could not load weather"}
          </div>
        )}

        {data && (
          <>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" /> {data.location.name}{data.location.country ? `, ${data.location.country}` : ""}
            </p>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-4">
                {data.current.icon && (
                  <img src={iconUrl(data.current.icon, 4)} alt={data.current.condition} className="size-20" />
                )}
                <div>
                  <p className="font-display text-5xl font-extrabold">{data.current.tempC}°C</p>
                  <p className="text-sm capitalize text-muted-foreground">{data.current.description}</p>
                  <p className="text-xs text-muted-foreground">Feels like {data.current.feelsLikeC}°C</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric icon={Droplets} label="Humidity" value={`${data.current.humidity}%`} />
                <Metric icon={Wind} label="Wind" value={`${data.current.windKph} km/h`} />
                <Metric icon={Gauge} label="Pressure" value={`${data.current.pressure} hPa`} />
                <Metric icon={Sunrise} label="Sunrise" value={fmtTime(data.current.sunrise)} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">Next hours</p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs sm:grid-cols-8">
                {data.hourly.map((h) => (
                  <div key={h.time}>
                    <p className="text-muted-foreground">{h.time.slice(11, 16)}</p>
                    {h.icon && <img src={iconUrl(h.icon)} alt={h.condition} className="mx-auto size-10" />}
                    <p className="font-bold">{h.tempC}°</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">5-day forecast</p>
              <div className="mt-2 divide-y divide-border">
                {data.daily.map((d) => (
                  <div key={d.date} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="w-16 font-medium">{dayName(d.date)}</span>
                    {d.icon && <img src={iconUrl(d.icon)} alt={d.condition} className="size-10" />}
                    <span className="flex-1 px-2 capitalize text-muted-foreground">{d.description}</span>
                    <span className="text-right">
                      <span className="font-bold">{d.maxC}°</span>{" "}
                      <span className="text-muted-foreground">{d.minC}°</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Sunset className="size-3.5 text-primary" /> Sunset {fmtTime(data.current.sunset)}</span>
              <span>Powered by OpenWeather</span>
            </div>

            {data.daily.some((d) => d.rainMm > 0) && (
              <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
                <AlertTriangle className="size-5 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-semibold">Rain expected this week</p>
                  <p className="text-xs text-muted-foreground">
                    Plan irrigation and protect harvested produce accordingly.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </div>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

export default WeatherPage;
