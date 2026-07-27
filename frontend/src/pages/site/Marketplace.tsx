import { Search, MapPin, Sprout, ShoppingBag, ArrowRight, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type MarketPrice } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const tabs = ["All", "Grains", "Vegetables", "Fruits", "Seeds", "Fertilizer", "Equipment"];

function getCropEmoji(name: string): string {
  const c = name.toLowerCase();
  if (c.includes("maize") || c.includes("corn")) return "🌽";
  if (c.includes("wheat")) return "🌾";
  if (c.includes("tomato")) return "🍅";
  if (c.includes("onion")) return "🧅";
  if (c.includes("rice") || c.includes("basmati")) return "🍚";
  if (c.includes("potato")) return "🥔";
  if (c.includes("cotton")) return "🧵";
  if (c.includes("sugar")) return "🎋";
  if (c.includes("mango")) return "🥭";
  if (c.includes("chilli") || c.includes("pepper")) return "🌶️";
  if (c.includes("garlic")) return "🧄";
  if (c.includes("banana")) return "🍌";
  if (c.includes("apple")) return "🍎";
  if (c.includes("soybean") || c.includes("soya")) return "🫘";
  return "🌱";
}

function MarketplacePage() {
  const [tab, setTab] = useState("All");
  const { isAuthenticated } = useAuth();

  const prices = useQuery({
    queryKey: ["market-prices", "latest-public"],
    queryFn: () => api.marketPrices.latest(),
    staleTime: 10 * 60_000,
  });

  const topPrices = prices.data?.data?.slice(0, 12) || [];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/40 p-8 sm:p-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 text-primary" /> Live across Pakistan & India
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
          A fair marketplace <span className="text-gradient-primary">built for farmers</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sell crops directly to verified buyers. Browse live AMIS prices, list produce in minutes — no middlemen, no hidden cuts.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link to="/app/market"><Button size="lg" className="bg-primary hover:bg-primary-dark">Go to Marketplace <ArrowRight className="ml-1 size-4" /></Button></Link>
          ) : (
            <>
              <Link to="/signup"><Button size="lg" className="bg-primary hover:bg-primary-dark">List your produce <ArrowRight className="ml-1 size-4" /></Button></Link>
              <Link to="/how-it-works"><Button size="lg" variant="outline">How it works</Button></Link>
            </>
          )}
        </div>
      </header>

      {/* Live AMIS Prices */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="size-5 text-primary" />
          <h2 className="font-display text-xl font-extrabold">Live Market Prices</h2>
          {prices.data?.meta?.latestDate && (
            <span className="text-xs text-muted-foreground ml-auto">
              Source: AMIS · {new Date(prices.data.meta.latestDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {prices.isLoading ? (
          <div className="grid place-items-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : topPrices.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
            {topPrices.map((p) => {
              const up = (p.changePercent ?? 0) >= 0;
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCropEmoji(p.cropName)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{p.cropName}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{p.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xl font-extrabold text-primary">₹{p.avgPrice.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">per {p.unit}</p>
                    </div>
                    {p.changePercent != null && (
                      <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        {Math.abs(p.changePercent).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No price data available yet</p>
        )}
      </div>

      {/* Search + Tabs */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search crops, seeds, equipment…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm outline-none transition focus:border-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto sm:flex-wrap">
          {tabs.map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${t === tab ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <Highlight Icon={ShoppingBag} title="Live listings" desc="See real prices from farmers and buyers near you." />
        <Highlight Icon={Sprout} title="Zero middlemen" desc="Direct payments to farmers — keep what you earn." />
        <Highlight Icon={MapPin} title="Verified buyers" desc="ID-verified buyers and ratings keep deals safe." />
      </div>

      {/* CTA */}
      <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-border bg-card p-12 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10">
          <ShoppingBag className="size-8 text-primary" />
        </div>
        <h3 className="mt-4 font-display text-xl font-bold">Live listings open inside the app</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Sign in to browse real-time listings from farmers and buyers, place orders, and track deliveries.
        </p>
        <div className="mt-5 flex gap-3">
          {isAuthenticated ? (
            <Link to="/app/market"><Button className="bg-primary hover:bg-primary-dark">Open Marketplace</Button></Link>
          ) : (
            <>
              <Link to="/login"><Button>Sign in to browse</Button></Link>
              <Link to="/signup"><Button variant="outline">Create free account</Button></Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Highlight({ Icon, title, desc }: { Icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
      <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
        <Icon className="size-6 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default MarketplacePage;
