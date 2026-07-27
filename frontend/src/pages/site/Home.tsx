import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Sparkles, Wifi, Leaf, CloudSun, TrendingUp, ShoppingBag, Lightbulb, Smartphone, Sprout, Cpu, IndianRupee } from "lucide-react";
import heroImage from "@/assets/hero-farm.jpg";
import heroMockup from "@/assets/hero-mockup.png";
import ctaImage from "@/assets/cta-farmer.jpg";

const features = [
  { title: "AI Crop Health", desc: "Detect diseases and get treatment advice using AI" },
  { title: "Weather Updates", desc: "Real-time weather and alerts for your farm" },
  { title: "Market Prices", desc: "Live market prices to help you sell at the right time" },
  { title: "Marketplace", desc: "Buy and sell crops, seeds, and farming supplies" },
  { title: "Smart Insights", desc: "Yield, crop rotation, and farming recommendations" },
];

const stats = [
  { label: "Farmers Empowered", value: "25K+", icon: "👥" },
  { label: "Acres Monitored", value: "1.2M+", icon: "🌾" },
  { label: "Increase in Yield", value: "30%+", icon: "📈" },
  { label: "Farmer Earnings Increased", value: "₹50Cr+", icon: "₹" },
];

const howItWorks = [
  { step: 1, title: "Sign Up", desc: "Create your account using email and OTP in seconds" },
  { step: 2, title: "Add Your Farm", desc: "Add your farm details and the crops you're growing" },
  { step: 3, title: "Get Smart Insights", desc: "Receive AI-powered crop, weather, and market guidance" },
  { step: 4, title: "Grow & Earn More", desc: "Make informed decisions and improve your profits" },
];

const featureIcons = [Leaf, CloudSun, TrendingUp, ShoppingBag, Lightbulb];
const howIcons = [Smartphone, Sprout, Cpu, IndianRupee];

function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/60 to-background dark:from-background/80 dark:via-background/75" />
        {/* Animated blobs */}
        <div className="pointer-events-none absolute -top-24 -left-20 -z-10 size-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute top-40 right-0 -z-10 size-80 rounded-full bg-primary/15 blur-3xl animate-blob delay-300" />

        <div className="container mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in-up">
              <Sprout className="size-4" /> Smart Farming for a Better Tomorrow
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-in-up delay-100">
              Empowering Farmers <br />
              with <span className="text-gradient-primary">Smart Solutions</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-in-up delay-200">
              AgriSmart is your all-in-one platform for crop health, weather updates, market prices, and AI-powered insights. Grow better, sell smarter, and earn more.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 animate-fade-in-up delay-300">
              <Link to="/login">
                <Button size="lg" className="h-12 bg-primary px-7 text-base font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary-dark hover:scale-105 hover:shadow-glow">
                  Get Started Free <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="h-12 gap-2 border-border bg-background/80 backdrop-blur px-6 text-base font-semibold transition-all hover:scale-105 hover:bg-accent">
                  Explore Features <Play className="size-4 rounded-full bg-primary/10 p-0.5 text-primary" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground animate-fade-in-up delay-400">
              <span className="flex items-center gap-2"><Wifi className="size-4 text-primary" /> Offline First</span>
              <span className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI Powered</span>
              <span className="flex items-center gap-2"><Shield className="size-4 text-primary" /> Secure & Reliable</span>
            </div>
          </div>

          {/* Phone mockup screenshot — framed with border */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-md animate-fade-in-up delay-200">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-primary/40 via-primary/10 to-primary/30 blur-3xl animate-blob" />
            <div className="relative rounded-[2.5rem] border-2 border-primary/30 bg-gradient-to-br from-background/80 to-primary/5 p-3 shadow-glow backdrop-blur-sm ring-1 ring-white/40 dark:ring-white/10 animate-float">
              <img
                src={heroMockup}
                alt="AgriSmart mobile app preview showing dashboard with crop health, weather and market data"
                width={420}
                height={840}
                className="mx-auto w-full max-w-[380px] rounded-[2rem]"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Features grid */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.slice(0, 5).map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 text-center shadow-card transition hover:-translate-y-1 hover:shadow-soft">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10">
                  <Icon className="size-7 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats banner */}
      <section className="container mx-auto max-w-7xl px-4 pb-16">
        <div className="grid grid-cols-2 gap-4 rounded-3xl bg-primary-dark p-8 text-primary-foreground md:grid-cols-4 md:p-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full border-2 border-white/30 text-2xl">
                {s.icon}
              </div>
              <div className="font-display text-3xl font-extrabold sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs text-white/75 sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-secondary/40 to-background py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">
            How AgriSmart Works
          </h2>
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-primary" />
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((h, i) => {
              const Icon = howIcons[i];
              return (
                <div key={h.step} className="relative text-center">
                  <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                    <Icon className="size-9 text-primary" />
                  </div>
                  <div className="absolute left-1/2 top-0 -ml-3 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {h.step}
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold">{h.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{h.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary-dark p-8 text-white md:p-12">
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${ctaImage})` }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-dark via-primary-dark/90 to-primary-dark/40" />
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Start your smart farming journey today!</h2>
              <p className="mt-2 max-w-xl text-white/80">Join thousands of farmers who are growing better with AgriSmart.</p>
            </div>
            <Link to="/login">
              <Button size="lg" className="h-12 bg-white px-6 text-base font-semibold text-primary-dark hover:bg-white/90">
                Get Started Free <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}





export default HomePage;
