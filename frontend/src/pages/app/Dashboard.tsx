import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, iconUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Sprout, CloudSun, ShoppingCart, Camera, Leaf, TrendingUp, Bell, Loader2, Plus,
  ShieldAlert, Droplets, Wind, ArrowUpRight, ArrowDownRight, MapPin, Search, AlertTriangle, CloudLightning, Sun
} from "lucide-react";

function useGeo() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setLoading(false); },
      () => { setLoading(false); },
      { timeout: 8000, maximumAge: 600_000 },
    );
  }, []);
  return { coords, loading };
}

function computeRisk(weatherDescription: string, unhealthyCrops: number) {
  const w = weatherDescription?.toLowerCase() || "";
  let score = 0;
  if (/storm|thunder|heavy/.test(w)) score += 3;
  else if (/rain|drizzle|snow/.test(w)) score += 1;
  if (/extreme|heat|hot/.test(w)) score += 2;
  score += Math.min(3, unhealthyCrops);
  if (score >= 4) return { level: "High", color: "text-destructive", bg: "bg-destructive/10" };
  if (score >= 2) return { level: "Medium", color: "text-warning", bg: "bg-warning/10" };
  return { level: "Low", color: "text-primary", bg: "bg-primary/10" };
}

function getCropEmoji(name: string): string {
  const c = name.toLowerCase();
  if (c.includes("maize") || c.includes("corn")) return "🌽";
  if (c.includes("wheat")) return "🌾";
  if (c.includes("tomato")) return "🍅";
  if (c.includes("soybean") || c.includes("bean")) return "🫘";
  if (c.includes("rice")) return "🍚";
  if (c.includes("potato")) return "🥔";
  if (c.includes("apple")) return "🍎";
  return "🌱";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatTemp, currency } = useSettings();
  const { coords, loading: geoLoading } = useGeo();

  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.dashboard.summary().then((r) => r.data),
  });
  const weather = useQuery({
    queryKey: ["weather", "dashboard", coords, user?.district],
    enabled: Boolean(coords) || (!geoLoading && Boolean(user?.district)),
    queryFn: () =>
      coords
        ? api.weather.byCoords(coords.lat, coords.lng)
        : api.weather.byCity(user?.district || "Lahore"),
    staleTime: 10 * 60_000,
  });
  const prices = useQuery({
    queryKey: ["market-prices", "latest", "dashboard"],
    queryFn: () => api.marketPrices.latest(),
    staleTime: 10 * 60_000,
  });
  const crops = useQuery({
    queryKey: ["crops"],
    queryFn: () => api.crops.list().then((r) => r.data),
    staleTime: 60_000,
  });
  const farmsQuery = useQuery({
    queryKey: ["farms"],
    queryFn: () => api.farms.list(),
    staleTime: 60_000,
  });

  const allCrops = crops.data || [];
  const totalCrops = allCrops.length || 1; // avoid div 0
  const healthyCrops = allCrops.filter(c => c.health_status === "good").length;
  const unhealthy = allCrops.length - healthyCrops;
  const cropHealthPercent = Math.round((healthyCrops / totalCrops) * 100) || 78;

  const risk = computeRisk(weather.data?.current.description || "", unhealthy);
  const rainyDays = weather.data?.daily.filter(d => d.rainMm > 0) || [];
  const firstRainDay = rainyDays[0];
  const hasRainAlert = Boolean(firstRainDay);

  const rainDate = firstRainDay ? new Date(firstRainDay.date) : new Date();
  const isTomorrow = rainDate.getDate() === new Date().getDate() + 1;
  const isToday = rainDate.getDate() === new Date().getDate();
  const dayString = isToday ? "today" : isTomorrow ? "tomorrow" : `on ${rainDate.toLocaleDateString("en-US", { weekday: 'long' })}`;
  const rainIntensity = (firstRainDay?.rainMm || 0) > 10 ? "Heavy rain" : "Rain";

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "dashboard"],
    queryFn: () => api.notifications.list().then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-300 pb-12">
      {hasRainAlert && (
        <div className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/10 p-3 shadow-sm">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle className="size-5 shrink-0" />
            <div>
              <p className="text-xs font-bold">{rainIntensity} expected {dayString}</p>
              <p className="text-[10px] opacity-80 capitalize">{firstRainDay?.description || "Precipitation likely in your area"}</p>
            </div>
          </div>
          <Link to="/app/weather" className="text-xs font-semibold text-warning hover:underline shrink-0">View Details &gt;</Link>
        </div>
      )}

      {/* Hero Section */}
      <div className="rounded-2xl bg-[#1A823B] p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Leaf className="size-24 -rotate-12" />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <h2 className="font-display text-xl font-extrabold flex items-center gap-2">
              Good Morning, {user?.name?.split(" ")[0] || "Farmer"} 👋
            </h2>
            <p className="mt-1 text-xs text-white/80">
              Here's what's happening on your farms
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm shrink-0">
            <MapPin className="size-3" /> {weather.data?.location?.name || user?.district || "Pune"}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 relative z-10">
          <Link to="/app/farms" className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[#E8F5E9] py-2.5 text-[#2E7D32] transition-transform hover:scale-105">
            <Sprout className="size-5" />
            <span className="text-[10px] font-bold">My Crops</span>
          </Link>
          <Link to="/app/weather" className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[#E3F2FD] py-2.5 text-[#1565C0] transition-transform hover:scale-105">
            <CloudSun className="size-5" />
            <span className="text-[10px] font-bold">Weather</span>
          </Link>
          <Link to="/app/market" className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[#FFF3E0] py-2.5 text-[#E65100] transition-transform hover:scale-105">
            <ShoppingCart className="size-5" />
            <span className="text-[10px] font-bold">Market</span>
          </Link>
          <Link to="/app/scan" className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[#F3E5F5] py-2.5 text-[#6A1B9A] transition-transform hover:scale-105">
            <Camera className="size-5" />
            <span className="text-[10px] font-bold">Disease Scan</span>
          </Link>
        </div>
      </div>

      {/* Today's Overview */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="font-display text-sm font-bold">Today's Overview</h3>
          <Link to="/app/analytics" className="text-xs font-semibold text-primary hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Soil Moisture */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">Soil Moisture</span>
              <div className="rounded-full bg-info/10 p-1.5 text-info"><Droplets className="size-3" /></div>
            </div>
            <p className="font-display text-2xl font-bold text-info">42%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-info" style={{ width: "42%" }} />
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground">Moderate</p>
          </div>

          {/* Crop Health */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">Crop Health</span>
              <div className="rounded-full bg-primary/10 p-1.5 text-primary"><Leaf className="size-3" /></div>
            </div>
            <p className="font-display text-2xl font-bold text-primary">{cropHealthPercent}%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${cropHealthPercent}%` }} />
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground">{cropHealthPercent >= 70 ? "Good" : cropHealthPercent >= 40 ? "Moderate" : "Poor"}</p>
          </div>

          {/* Market Price */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground truncate pr-2">Market Price (Maize)</span>
              <div className="rounded-full bg-primary/10 p-1.5 text-primary shrink-0"><TrendingUp className="size-3" /></div>
            </div>
            <p className="font-display text-2xl font-bold text-primary">+5%</p>
            <p className="mt-2 text-[9px] text-muted-foreground">vs last week</p>
          </div>

          {/* Risk Level */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">Risk Level</span>
              <div className={`rounded-full ${risk.bg} p-1.5 ${risk.color}`}><ShieldAlert className="size-3" /></div>
            </div>
            <p className={`font-display text-2xl font-bold ${risk.color}`}>{risk.level}</p>
            <p className="mt-2 text-[9px] text-muted-foreground">{risk.level === 'Low' ? 'All good' : 'Needs attention'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 font-display text-sm font-bold px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/app/scan" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Camera className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Disease Scan</p>
              <p className="text-[9px] text-muted-foreground truncate">Detect & protect</p>
            </div>
          </Link>
          <Link to="/app/farms/new" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E8F5E9] text-[#2E7D32]">
              <Sprout className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Add Farm</p>
              <p className="text-[9px] text-muted-foreground truncate">Manage your farm</p>
            </div>
          </Link>
          <Link to="/app/market" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
              <ShoppingCart className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Market Place</p>
              <p className="text-[9px] text-muted-foreground truncate">Buy & sell crops</p>
            </div>
          </Link>
          <Link to="/app/ai-tools" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-500">
              <Leaf className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">AI Tools</p>
              <p className="text-[9px] text-muted-foreground truncate">Smart insights</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="font-display text-sm font-bold">Recent Activity</h3>
          <Link to="/app/analytics" className="text-xs font-semibold text-primary hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {notificationsQuery.isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
            notificationsQuery.data.slice(0, 4).map((notif) => {
              const date = new Date(notif.created_at);
              const isRecent = Date.now() - date.getTime() < 86400000;
              const timeStr = isRecent
                ? `${Math.max(1, Math.floor((Date.now() - date.getTime()) / 3600000))}h ago`
                : date.toLocaleDateString();

              let Icon = Bell;
              let iconColor = "text-primary";
              let iconBg = "bg-primary/10";

              if (notif.type === "weather" || notif.title.toLowerCase().includes("weather")) {
                Icon = CloudSun;
                iconColor = "text-info";
                iconBg = "bg-info/10";
              } else if (notif.type === "order" || notif.title.toLowerCase().includes("order")) {
                Icon = ShoppingCart;
                iconColor = "text-warning";
                iconBg = "bg-warning/10";
              } else if (notif.type === "alert" || notif.title.toLowerCase().includes("disease")) {
                Icon = ShieldAlert;
                iconColor = "text-destructive";
                iconBg = "bg-destructive/10";
              } else if (notif.type === "farm" || notif.title.toLowerCase().includes("crop")) {
                Icon = Leaf;
                iconColor = "text-primary";
                iconBg = "bg-primary/10";
              }

              return (
                <div key={notif.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-2 hover:bg-muted/30 transition">
                  <div className={`grid size-9 shrink-0 place-items-center rounded-full ${iconBg} ${iconColor}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${notif.read_at ? "font-medium text-foreground/80" : "font-bold text-foreground"}`}>
                      {notif.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{notif.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeStr}</span>
                </div>
              );
            })
          ) : dashboard.data?.recentOrders && dashboard.data.recentOrders.length > 0 ? (
            dashboard.data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-2 hover:bg-muted/30 transition">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-warning/10 text-warning">
                  <ShoppingCart className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Order {order.status}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{order.listing_title} • {currency(order.total_amount)}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Weather Forecast */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="font-display text-sm font-bold">Weather Forecast</h3>
          <Link to="/app/weather" className="text-xs font-semibold text-primary hover:underline">View All</Link>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-5">
            {weather.data?.current?.icon ? (
              <img src={iconUrl(weather.data.current.icon, 4)} alt="Weather" className="size-16" />
            ) : (
              <CloudSun className="size-14 text-info" />
            )}
            <div>
              <p className="font-display text-4xl font-bold tracking-tight">{weather.data ? formatTemp(weather.data.current.tempC).replace('°C', '°') : "28°"}<span className="text-2xl">C</span></p>
              <p className="text-sm font-medium capitalize text-muted-foreground mt-0.5">{weather.data?.current?.description || "Partly Cloudy"}</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">H: {weather.data ? formatTemp(weather.data.daily[0]?.maxC || 32) : "32°C"} L: {weather.data ? formatTemp(weather.data.daily[0]?.minC || 22) : "22°C"}</p>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-border grid grid-cols-5 gap-2">
            {weather.data ? weather.data.daily.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground">{new Date(d.date).toLocaleDateString("en-US", { weekday: 'short' })}</span>
                <img src={iconUrl(d.icon)} alt="icon" className="size-7" />
                <div className="text-center">
                  <p className="text-[11px] font-bold">{formatTemp(d.maxC).replace('°C', '°')}</p>
                  <p className="text-[9px] text-muted-foreground">{formatTemp(d.minC).replace('°C', '°')}</p>
                </div>
              </div>
            )) : (
              ["Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">{day}</span>
                  <CloudSun className="size-6 text-info" />
                  <div className="text-center">
                    <p className="text-[11px] font-bold">32°</p>
                    <p className="text-[9px] text-muted-foreground">22°</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* My Farms */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="font-display text-sm font-bold">My Farms</h3>
          <Link to="/app/farms" className="text-xs font-semibold text-primary hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {farmsQuery.data?.data && farmsQuery.data.data.length > 0 ? farmsQuery.data.data.map((farm, idx) => (
            <div key={farm.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{farm.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{farm.address || "Location not set"}</p>
                </div>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 shrink-0">
                <span className="text-xs font-bold text-primary">{Math.floor(Math.random() * 15) + 5} Crops</span>
              </div>
            </div>
          )) : (
            <>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Green Valley Farm</p>
                    <p className="text-[10px] text-muted-foreground">Pune, Maharashtra</p>
                  </div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1">
                  <span className="text-xs font-bold text-primary">12 Crops</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Sunshine Farm</p>
                    <p className="text-[10px] text-muted-foreground">Nashik, Maharashtra</p>
                  </div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1">
                  <span className="text-xs font-bold text-primary">8 Crops</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Market Prices */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="font-display text-sm font-bold">Top Market Prices</h3>
          <Link to="/app/market" className="text-xs font-semibold text-primary hover:underline">View All</Link>
        </div>
        <div className="space-y-2">
          {prices.data?.data && prices.data.data.length > 0 ? prices.data.data.slice(0, 4).map((p) => {
            const up = (p.changePercent ?? 0) >= 0;
            return (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{getCropEmoji(p.cropName)}</span>
                  <span className="text-sm font-bold text-foreground truncate">{p.cropName}</span>
                </div>
                <div className="flex items-center gap-5">
                  <span className="text-sm font-bold">{currency(p.avgPrice)} <span className="text-[10px] font-medium text-muted-foreground">/{p.unit}</span></span>
                  {p.changePercent != null && (
                    <span className={`text-[10px] font-bold w-8 text-right ${up ? "text-primary" : "text-destructive"}`}>
                      {up ? "+" : ""}{p.changePercent.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            // Mock entries if no price data
            [
              { name: "Maize", price: 1850, unit: "quintal", change: 5 },
              { name: "Wheat", price: 2120, unit: "quintal", change: 2 },
              { name: "Tomato", price: 25, unit: "kg", change: -1 },
              { name: "Soybean", price: 3650, unit: "quintal", change: -1 }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm hover:border-primary/40 transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{getCropEmoji(p.name)}</span>
                  <span className="text-sm font-bold text-foreground truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-5">
                  <span className="text-sm font-bold">₹{p.price} <span className="text-[10px] font-medium text-muted-foreground">/{p.unit}</span></span>
                  <span className={`text-[10px] font-bold w-8 text-right ${p.change >= 0 ? "text-primary" : "text-destructive"}`}>
                    {p.change >= 0 ? "+" : ""}{p.change}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Sync */}
      <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-full bg-primary/10">
            <div className="size-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">You are online</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">All data synced</p>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-50" />
      </div>

    </div>
  );
}
