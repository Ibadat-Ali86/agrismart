import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Shield, Clock, CreditCard, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";

// Monthly prices in PKR
const PLANS = [
  { key: "free", price: 0, popular: false },
  { key: "premium", price: 2499, popular: true },
  { key: "pro", price: 7999, popular: false },
] as const;

function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const { t } = useTranslation();
  const { currency } = useSettings();
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {t("pricing.badge")}
        </span>
        <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">{t("pricing.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("pricing.subtitle")}</p>
        <div className="mx-auto mt-6 inline-flex rounded-full border border-border bg-card p-1 shadow-card">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              !yearly ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            {t("pricing.monthly")}
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              yearly ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            {t("pricing.yearly")} <span className="ms-1 text-xs opacity-90">{t("pricing.save20")}</span>
          </button>
        </div>
      </header>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => {
          const monthly = p.price;
          const price = yearly ? Math.round(monthly * 12 * 0.8) : monthly;
          const period = yearly ? t("pricing.perYear") : t("pricing.perMonth");
          const name = t(`pricing.${p.key}.name`);
          const desc = t(`pricing.${p.key}.desc`);
          const cta = t(`pricing.${p.key}.cta`);
          const features = t(`pricing.${p.key}.features`, { returnObjects: true }) as string[];
          return (
            <div
              key={p.key}
              className={`relative rounded-3xl border bg-card p-7 shadow-card transition hover:-translate-y-1 hover:shadow-soft ${
                p.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-4 py-1 text-xs font-bold text-primary-foreground shadow">
                  {t("pricing.mostPopular")}
                </span>
              )}
              <h3 className="font-display text-2xl font-bold">{name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-primary sm:text-5xl">
                  {price === 0 ? currency(0).replace(/\d.*$/, "0") : currency(price)}
                </span>
                <span className="text-muted-foreground">{period}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button
                  className={`mt-7 w-full ${
                    p.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary-dark"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  size="lg"
                >
                  {cta}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-around gap-4 rounded-2xl border border-border bg-card p-5 text-sm shadow-card">
        <span className="flex items-center gap-2 text-muted-foreground"><Shield className="size-4 text-primary" /> {t("pricing.noHidden")}</span>
        <span className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4 text-primary" /> {t("pricing.cancelAnytime")}</span>
        <span className="flex items-center gap-2 text-muted-foreground"><CreditCard className="size-4 text-primary" /> {t("pricing.securePayments")}</span>
        <span className="flex items-center gap-2 text-muted-foreground"><Sparkles className="size-4 text-primary" /> {t("pricing.freeTrial")}</span>
      </div>

      <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
        <div>
          <p className="font-semibold">{t("pricing.customPlanTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("pricing.customPlanDesc")}</p>
        </div>
        <Link to="/contact"><Button variant="outline">{t("pricing.contactSales")}</Button></Link>
      </div>
    </div>
  );
}

export default PricingPage;
