import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PLANS = [
  { name: "Free", price: "₹0", features: ["3 farms", "Weather forecasts", "Marketplace browse", "Community support"] },
  { name: "Pro", price: "₹199", popular: true, features: ["Unlimited farms", "AI disease scan", "Price insights", "Priority email support"] },
  { name: "Business", price: "₹999", features: ["Everything in Pro", "Bulk listings", "Analytics dashboard", "Dedicated manager"] },
];

export default function Subscription() {
  return (
    <div>
      <AppHeaderBack title="Subscription" />
      <div className="space-y-4 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground">
          <Sparkles className="size-6" />
          <h2 className="mt-2 font-display text-xl font-extrabold">Upgrade to AgriSmart Pro</h2>
          <p className="mt-1 text-sm text-white/85">Unlock AI tools, unlimited farms, and priority support.</p>
        </div>
        {PLANS.map((p) => (
          <div key={p.name} className={`rounded-2xl border bg-card p-5 ${p.popular ? "border-primary shadow-md" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold">{p.name}</p>
                <p className="text-2xl font-extrabold text-primary">{p.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              </div>
              {p.popular && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">POPULAR</span>}
            </div>
            <ul className="mt-3 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><Check className="size-4 text-primary" /> {f}</li>
              ))}
            </ul>
            <Button onClick={() => toast.info("Billing coming soon!")} className="mt-4 w-full bg-primary hover:bg-primary-dark">
              {p.name === "Free" ? "Current plan" : "Upgrade"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
