import { useState } from "react";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2, TrendingUp, CloudSun, Leaf, Search } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, Cell, PieChart, Pie } from "recharts";

export default function Analytics() {
  const { user } = useAuth();
  const { formatTemp, currency } = useSettings();

  const [city, setCity] = useState(user?.district || "Lahore");
  const [crop, setCrop] = useState("Maize");

  // Farm & Crop data
  const cropsQuery = useQuery({
    queryKey: ["crops"],
    queryFn: () => api.crops.list().then((r) => r.data),
  });

  // Weather data
  const weatherQuery = useQuery({
    queryKey: ["weather", city],
    queryFn: () => api.weather.byCity(city),
    enabled: !!city,
  });

  // Market Trends data
  const trendsQuery = useQuery({
    queryKey: ["market-trends", city, crop],
    queryFn: () => api.marketPrices.trends({ city, crop, days: 30 }).then(r => r.data),
    enabled: !!city && !!crop,
  });

  // Transform Data
  const weatherChartData = weatherQuery.data?.daily.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { weekday: 'short' }),
    max: d.maxC,
    min: d.minC,
  })) || [];

  const marketChartData = trendsQuery.data?.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
    price: d.avgPrice,
  })).reverse() || [];

  const allCrops = cropsQuery.data || [];
  const healthData = [
    { name: "Good", value: allCrops.filter(c => c.health_status === "good").length || 1, color: "#22c55e" },
    { name: "Moderate", value: allCrops.filter(c => c.health_status === "moderate").length || 0, color: "#f59e0b" },
    { name: "Poor", value: allCrops.filter(c => c.health_status === "poor").length || 0, color: "#ef4444" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-md">
          <p className="mb-1 text-sm font-bold text-foreground">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      <AppHeaderBack title="Analytics & Trends" />

      <div className="px-4 space-y-6">

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City (e.g. Lahore)"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={crop}
              onChange={e => setCrop(e.target.value)}
              placeholder="Crop (e.g. Maize)"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Market Trends Chart */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <h3 className="font-display font-bold text-foreground">Market Price Trend ({crop})</h3>
          </div>

          {trendsQuery.isLoading ? (
            <div className="grid h-64 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : marketChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fill: "hsl(var(--muted-foreground))"}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: "hsl(var(--muted-foreground))"}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="price" name="Price" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="grid h-64 place-items-center text-sm text-muted-foreground">No trend data available for {crop} in {city}</div>
          )}
        </div>

        {/* Weather Forecast Chart */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CloudSun className="size-5 text-info" />
            <h3 className="font-display font-bold text-foreground">5-Day Weather Temp Forecast</h3>
          </div>

          {weatherQuery.isLoading ? (
            <div className="grid h-64 place-items-center"><Loader2 className="size-6 animate-spin text-info" /></div>
          ) : weatherChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weatherChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fill: "hsl(var(--muted-foreground))"}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: "hsl(var(--muted-foreground))"}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="max" name="High °C" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="min" name="Low °C" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">No weather data available</div>
          )}
        </div>

        {/* Farm Health Chart */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Leaf className="size-5 text-primary" />
            <h3 className="font-display font-bold text-foreground">Crop Health Distribution</h3>
          </div>

          {cropsQuery.isLoading ? (
            <div className="grid h-64 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
