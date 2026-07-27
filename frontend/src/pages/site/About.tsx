import { Sprout, Heart, Globe2, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const values = [
  { icon: Sprout, title: "Farmer first", desc: "Every feature co-designed with the farmers who use it daily." },
  { icon: Heart, title: "Social impact", desc: "We measure success by lives improved, not just downloads." },
  { icon: Globe2, title: "Offline by design", desc: "Built for low-connectivity villages with on-device AI." },
  { icon: Award, title: "Trusted & secure", desc: "JWT auth, encrypted data, zero shady ads — ever." },
];

const stats = [
  { value: "25K+", label: "Farmers empowered" },
  { value: "1.2M+", label: "Acres monitored" },
  { value: "30%+", label: "Average yield gain" },
  { value: "₹50Cr+", label: "Extra farmer earnings" },
];

function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <header className="text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">Our story</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
          Smart farming for a <span className="text-gradient-primary">better tomorrow</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          AgriSmart was born to bridge the digital divide for India's 100M smallholder farmers.
          We combine on-device AI, voice interfaces and a fair marketplace so growers earn more — and waste less.
        </p>
      </header>

      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="font-display text-3xl font-extrabold text-primary">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-center font-display text-3xl font-bold">What we stand for</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {values.map((v) => (
          <div key={v.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <v.icon className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/40 p-8 text-center">
        <h2 className="font-display text-2xl font-bold">Want to be part of the journey?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Join thousands of farmers already growing smarter with AgriSmart.</p>
        <Link to="/signup">
          <Button size="lg" className="mt-5 bg-primary hover:bg-primary-dark">Create your free account</Button>
        </Link>
      </div>
    </div>
  );
}

export default AboutPage;
