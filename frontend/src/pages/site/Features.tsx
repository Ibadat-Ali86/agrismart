import { Link } from "react-router-dom";
import { ArrowRight, Leaf, CloudSun, TrendingUp, Sparkles, Tractor, ShoppingBag, Microscope, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import ctaImage from "@/assets/cta-farmer.jpg";

const items = [
  { title: "AI Crop Health", desc: "Spot diseases early and get treatment plans in your language.", Icon: Leaf },
  { title: "Live Weather", desc: "Hyperlocal forecasts powered by OpenWeather, with rain alerts.", Icon: CloudSun },
  { title: "Market Prices", desc: "Track mandi rates and sell at peak prices, not on guesswork.", Icon: TrendingUp },
  { title: "Marketplace", desc: "Sell crops directly to buyers — no middlemen, no losses.", Icon: ShoppingBag },
  { title: "Smart Insights", desc: "Yield predictions and rotation tips tailored to your soil.", Icon: Sparkles },
  { title: "Farm Management", desc: "Track farms, crops, expenses and workers in one place.", Icon: Tractor },
  { title: "Disease Scanner", desc: "Snap a leaf photo, get an instant diagnosis & remedy.", Icon: Microscope },
  { title: "Expert Support", desc: "Talk to agronomists in your language, whenever you need.", Icon: Headphones },
];

function FeaturesPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">Built for farmers</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Everything you need to grow better</h1>
        <p className="mt-3 text-muted-foreground">Smart, simple tools — no jargon, works offline, ready in minutes.</p>
      </header>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ title, desc, Icon }) => (
          <div key={title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10 transition group-hover:scale-105">
              <Icon className="size-7 text-primary" />
            </div>
            <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            <Link to="/signup" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Try it free <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="relative mt-16 overflow-hidden rounded-3xl border border-primary/20 bg-secondary/40 p-8 md:p-10">
        <div className="absolute inset-0 -z-10 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${ctaImage})` }} />
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">All-in-one platform for modern farmers.</h2>
            <p className="mt-2 text-muted-foreground">Join thousands who already grow smarter with AgriSmart — free to start.</p>
          </div>
          <Link to="/signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary-dark">Get started free</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;
