import { Link } from "react-router-dom";
import { Smartphone, Sprout, Cpu, IndianRupee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { step: 1, title: "Sign up in seconds", desc: "Email + password or one-tap OTP — that's it.", Icon: Smartphone },
  { step: 2, title: "Add your farm", desc: "Name your farm, mark your crops, set your location.", Icon: Sprout },
  { step: 3, title: "Get smart insights", desc: "AI scans, weather, prices and personalised advice.", Icon: Cpu },
  { step: 4, title: "Grow & earn more", desc: "Sell direct, reduce waste, and watch profits climb.", Icon: IndianRupee },
];

function HowPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">How it works</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">From signup to smarter decisions in minutes</h1>
        <p className="mt-3 text-muted-foreground">Four simple steps to a more productive farm.</p>
        <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-gradient-to-r from-primary to-primary-dark" />
      </header>

      <ol className="relative mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />
        {steps.map(({ step, title, desc, Icon }) => (
          <li key={step} className="relative text-center">
            <div className="relative mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-4 ring-primary/5">
              <Icon className="size-10 text-primary" />
              <span className="absolute -top-1 -right-1 grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg">
                {step}
              </span>
            </div>
            <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{desc}</p>
          </li>
        ))}
      </ol>

      <div className="mt-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/40 p-8 text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to start growing smarter?</h2>
        <p className="mt-2 text-muted-foreground">Create your account in under a minute. No credit card required.</p>
        <Link to="/signup">
          <Button size="lg" className="mt-5 bg-primary hover:bg-primary-dark">
            Start free <ArrowRight className="ml-1 size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default HowPage;
