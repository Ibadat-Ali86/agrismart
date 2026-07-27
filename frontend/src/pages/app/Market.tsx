import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { api, type Listing, type MarketPrice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Search, ShoppingCart, Loader2, Package, TrendingUp, Plus, X, MapPin,
  ArrowUpRight, ArrowDownRight, Filter, Tag, Wheat, Leaf, Beaker, Wrench, Star
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";

/* ────── helpers ────── */
const categories = [
  { key: "", label: "All", icon: Tag },
  { key: "crop", label: "Crops & Grains", icon: Wheat },
  { key: "seed", label: "Seeds", icon: Leaf },
  { key: "fertilizer", label: "Fertilizer", icon: Beaker },
  { key: "equipment", label: "Equipment", icon: Wrench },
  { key: "other", label: "Other", icon: Star },
];

function getCategoryEmoji(category: string, title: string): string {
  const t = title.toLowerCase();
  if (category === "seed") return "🌱";
  if (category === "fertilizer") return "🧪";
  if (category === "equipment") return "🚜";
  if (t.includes("wheat") || t.includes("kanak")) return "🌾";
  if (t.includes("rice") || t.includes("chawal")) return "🍚";
  if (t.includes("corn") || t.includes("maize") || t.includes("makki")) return "🌽";
  if (t.includes("sugarcane") || t.includes("ganna")) return "🎋";
  if (t.includes("tomato") || t.includes("tamatar")) return "🍅";
  if (t.includes("potato") || t.includes("aloo")) return "🥔";
  if (t.includes("onion") || t.includes("pyaz")) return "🧅";
  if (t.includes("mango") || t.includes("aam")) return "🥭";
  if (t.includes("apple") || t.includes("seb")) return "🍎";
  if (t.includes("cotton") || t.includes("kapas")) return "🧵";
  if (t.includes("soybean") || t.includes("soya")) return "🫘";
  return "🌾";
}

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
  return "🌱";
}

/* ────── main page ────── */
export default function MarketPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { currency } = useSettings();

  const { data, isLoading } = useQuery({
    queryKey: ["market", q, category],
    queryFn: () => api.market.list({ q, category }).then((r) => r.data),
  });

  const prices = useQuery({
    queryKey: ["market-prices", "latest"],
    queryFn: () => api.marketPrices.latest(),
    staleTime: 10 * 60_000,
  });

  const topPrices = prices.data?.data?.slice(0, 8) || [];

  return (
    <div className="pb-20">
      <AppHeaderBack title="Marketplace" />
      <div className="space-y-5 p-4">

        {/* ── AMIS Live Prices Ticker ── */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              <h2 className="font-display text-sm font-bold">Live AMIS Prices</h2>
            </div>
            {prices.data?.meta?.latestDate && (
              <span className="text-[10px] text-muted-foreground">
                Updated: {new Date(prices.data.meta.latestDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {prices.isLoading ? (
            <div className="grid h-20 place-items-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
          ) : (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {topPrices.map((p) => {
                const up = (p.changePercent ?? 0) >= 0;
                return (
                  <div key={p.id} className="min-w-[130px] shrink-0 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{getCropEmoji(p.cropName)}</span>
                      <p className="truncate text-xs font-bold">{p.cropName}</p>
                    </div>
                    <p className="mt-1 text-base font-extrabold text-primary">{currency(p.avgPrice)}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="truncate text-[9px] text-muted-foreground">{p.city} · /{p.unit}</span>
                      {p.changePercent != null && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${up ? "text-primary" : "text-destructive"}`}>
                          {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {Math.abs(p.changePercent).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Search + Create ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search crops, seeds, equipment…"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary transition"
            />
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-11 gap-1.5 bg-primary hover:bg-primary-dark shrink-0">
            <Plus className="size-4" /> Sell
          </Button>
        </div>

        {/* ── Category Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((c) => {
            const Icon = c.icon;
            const active = c.key === category;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" /> {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Listings Grid ── */}
        {isLoading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : !data?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center">
            <Package className="mx-auto size-12 text-muted-foreground/50" />
            <p className="mt-3 font-display font-bold text-foreground">No listings found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or category</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4 bg-primary hover:bg-primary-dark">
              <Plus className="mr-1 size-4" /> Create Listing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {data.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelected(l)}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="grid h-28 place-items-center bg-gradient-to-br from-primary/10 to-primary/5 text-4xl transition-transform group-hover:scale-105">
                  {getCategoryEmoji(l.category, l.title)}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-foreground">{l.title}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="truncate">{l.location || l.seller_name}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-extrabold text-primary">{currency(Number(l.price_per_unit))}<span className="text-[10px] font-medium text-muted-foreground">/{l.unit}</span></p>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary capitalize">{l.category}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{l.quantity_available} {l.unit} available</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Buy Dialog ── */}
      {selected && <BuyDialog listing={selected} onClose={() => setSelected(null)} />}

      {/* ── Create Listing Dialog ── */}
      {showCreate && <CreateListingDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

/* ────── Buy Dialog ────── */
function BuyDialog({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const qc = useQueryClient();
  const { currency } = useSettings();
  const [qty, setQty] = useState(1);
  const [addr, setAddr] = useState("");
  const mut = useMutation({
    mutationFn: () => api.orders.create({ listing_id: listing.id, quantity: qty, shipping_address: addr }),
    onSuccess: () => {
      toast.success("Order placed successfully! 🎉");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["market"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold text-foreground">{listing.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{listing.seller_name} · {currency(Number(listing.price_per_unit))}/{listing.unit}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="size-5" /></button>
        </div>
        {listing.description && <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-foreground">{listing.description}</p>}
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="size-3" /> {listing.quantity_available} {listing.unit} available
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground">Quantity ({listing.unit})</label>
            <input type="number" min={1} max={listing.quantity_available} value={qty} onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground">Shipping Address</label>
            <textarea value={addr} onChange={(e) => setAddr(e.target.value)} rows={2} placeholder="Enter your delivery address…"
              className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="text-xl font-extrabold text-primary">{currency(Number(listing.price_per_unit) * qty)}</span>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !addr.trim() || qty < 1} className="flex-1 h-11 bg-primary hover:bg-primary-dark">
            {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <><ShoppingCart className="mr-1 size-4" /> Place Order</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ────── Create Listing Dialog ────── */
function CreateListingDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "", category: "crop" as string, description: "",
    price_per_unit: "", unit: "kg", quantity_available: "", location: "",
  });
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const mut = useMutation({
    mutationFn: () => api.market.create({
      ...form,
      price_per_unit: Number(form.price_per_unit),
      quantity_available: Number(form.quantity_available),
      images: [],
    } as any),
    onSuccess: () => {
      toast.success("Listing created! 🚀");
      qc.invalidateQueries({ queryKey: ["market"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-foreground">Create Listing</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="size-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold">Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Fresh Wheat 2024"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="crop">Crops & Grains</option>
                <option value="seed">Seeds</option>
                <option value="fertilizer">Fertilizer</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold">Unit</label>
              <select value={form.unit} onChange={(e) => set("unit", e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="ton">ton</option>
                <option value="piece">piece</option>
                <option value="bag">bag</option>
                <option value="liter">liter</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold">Price per unit (₹)</label>
              <input type="number" value={form.price_per_unit} onChange={(e) => set("price_per_unit", e.target.value)} placeholder="1500"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold">Quantity</label>
              <input type="number" value={form.quantity_available} onChange={(e) => set("quantity_available", e.target.value)} placeholder="100"
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold">Location</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Lahore, Punjab"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-bold">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Describe your produce…"
              className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancel</Button>
          <Button onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.title || !form.price_per_unit || !form.quantity_available}
            className="flex-1 h-11 bg-primary hover:bg-primary-dark">
            {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="mr-1 size-4" /> Publish</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
