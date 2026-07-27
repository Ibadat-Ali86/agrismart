
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { Search, Phone, ChevronRight, ShieldCheck, Sprout, CloudSun, ShoppingBag, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  { icon: ShieldCheck, label: "Getting Started", sub: "Learn the basics" },
  { icon: Sprout, label: "Farms & Crops", sub: "Manage your farms" },
  { icon: CloudSun, label: "Weather", sub: "Weather & alerts" },
  { icon: ShoppingBag, label: "Marketplace", sub: "Buying & selling" },
  { icon: CreditCard, label: "Payments", sub: "Orders & payments" },
  { icon: User, label: "Account", sub: "Profile & settings" },
];

const articles = [
  "How to add a new farm?",
  "How does disease scanning work?",
  "How to place an order in marketplace?",
  "How to update profile information?",
];

function HelpPage() {
  return (
    <div>
      <AppHeaderBack title="Help Center" />
      <div className="space-y-5 p-4">
        <div className="rounded-2xl bg-primary-dark p-5 text-primary-foreground">
          <p className="font-display text-xl font-bold">How can we help you?</p>
          <p className="mt-1 text-sm text-white/80">Find answers or reach out to support</p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search for help..." className="h-11 w-full rounded-xl bg-background pl-9 pr-4 text-sm text-foreground outline-none" />
          </div>
        </div>

        <div>
          <p className="mb-2 font-display text-base font-bold">Top Categories</p>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((c) => (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-3 text-center shadow-card">
                <div className="mx-auto grid size-10 place-items-center rounded-xl bg-soft-green">
                  <c.icon className="size-5 text-primary" />
                </div>
                <p className="mt-2 text-xs font-semibold leading-tight">{c.label}</p>
                <p className="text-[10px] text-muted-foreground">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-display text-base font-bold">Popular Articles</p>
          <div className="rounded-2xl border border-border bg-card shadow-card">
            {articles.map((a, i) => (
              <div key={a} className={`flex items-center gap-2 p-4 ${i !== articles.length - 1 ? "border-b border-border" : ""}`}>
                <p className="flex-1 text-sm">{a}</p>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
          <p className="font-display font-bold">Still need help?</p>
          <p className="mt-1 text-xs text-muted-foreground">Our team is ready to assist • Mon-Sat 9AM-6PM</p>
          <Button className="mt-3 w-full bg-primary hover:bg-primary-dark"><Phone className="mr-1 size-4" /> Call Support</Button>
        </div>
      </div>
    </div>
  );
}


export default HelpPage;
