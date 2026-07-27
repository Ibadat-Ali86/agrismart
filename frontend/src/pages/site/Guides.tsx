import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, RefreshCw, Sprout, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const rotations: Record<string, { next: string; reason: string }> = {
  wheat: { next: "Mung bean or chickpea", reason: "A legume helps replenish nitrogen and breaks cereal disease cycles." },
  rice: { next: "Wheat or lentil", reason: "A dry-season crop improves field use while reducing continuous-rice pest pressure." },
  cotton: { next: "Wheat or maize", reason: "Rotating away from cotton interrupts bollworm and soil-borne disease cycles." },
  maize: { next: "Chickpea or fodder legume", reason: "Legumes support soil fertility after a nutrient-demanding maize crop." },
  sugarcane: { next: "Pulses or green manure", reason: "Pulses restore nitrogen lost to long sugarcane cycles." },
  potato: { next: "Cereal (wheat/maize)", reason: "A cereal disrupts soil-borne potato diseases like blight and scab." },
};

const soilOptions = ["Healthy", "Moderate", "Depleted"] as const;
type Soil = (typeof soilOptions)[number];

const soilHints: Record<Soil, string> = {
  Healthy: "Soil is in good shape — you can stick with the recommended rotation.",
  Moderate: "Add organic compost and consider a legume cover crop before the next sowing.",
  Depleted: "Prioritise a nitrogen-fixing legume and a full season of soil restoration before heavy feeders.",
};

export default function Guides() {
  // Yield calculator
  const [area, setArea] = useState("5");
  const [plants, setPlants] = useState("24000");
  const [yieldPerPlant, setYieldPerPlant] = useState("0.18");

  // Rotation planner
  const [crop, setCrop] = useState<keyof typeof rotations>("wheat");
  const [soil, setSoil] = useState<Soil>("Moderate");

  const estimate = useMemo(() => {
    const total = Number(plants) * Number(yieldPerPlant);
    const acres = Number(area);
    return Number.isFinite(total) && Number.isFinite(acres) && total >= 0 && acres > 0
      ? { total, perAcre: total / acres }
      : null;
  }, [area, plants, yieldPerPlant]);

  // FAQPage / HowTo JSON-LD for rich results
  useEffect(() => {
    document.title = "Smart Farming Guides & Yield Calculators | AgriSmart";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Estimate crop yield and plan healthier crop rotations with free, practical smart farming tools.");
    document.head.appendChild(meta);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "Estimate crop yield",
      step: [
        { "@type": "HowToStep", name: "Enter farm area", text: "Provide the cultivated area in acres." },
        { "@type": "HowToStep", name: "Enter plant count", text: "Provide the number of harvestable plants." },
        { "@type": "HowToStep", name: "Enter expected yield per plant", text: "Provide your estimate in kilograms." },
      ],
    });
    document.head.appendChild(ld);
    return () => {
      document.head.removeChild(ld);
    };
  }, []);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-14 sm:py-16">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li><ChevronRight className="size-3.5" aria-hidden /></li>
          <li aria-current="page" className="text-foreground">Smart Farming Guides</li>
        </ol>
      </nav>

      <header className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <Sprout className="size-4" /> Practical farm planning
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold sm:text-5xl">Smart Farming Guides</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Use simple field data to estimate harvest potential, then choose a crop rotation that supports healthier soil and lower pest risk.
        </p>
      </header>

      <section className="mt-12 grid gap-8 lg:grid-cols-2" aria-labelledby="yield-calculator-title">
        {/* Yield calculator */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10"><Calculator className="size-6 text-primary" /></div>
            <div>
              <h2 id="yield-calculator-title" className="font-display text-2xl font-bold">Crop yield calculator</h2>
              <p className="text-sm text-muted-foreground">Project total harvest from field data.</p>
            </div>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farm-area">Farm area (acres)</Label>
              <Input id="farm-area" type="number" min="0.1" step="0.1" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plant-count">Harvestable plants</Label>
              <Input id="plant-count" type="number" min="0" value={plants} onChange={(e) => setPlants(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="yield-plant">Expected yield per plant (kg)</Label>
              <Input id="yield-plant" type="number" min="0" step="0.01" value={yieldPerPlant} onChange={(e) => setYieldPerPlant(e.target.value)} />
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-secondary p-5" aria-live="polite">
            <p className="text-sm font-medium text-muted-foreground">Projected harvest</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-primary">
              {estimate ? `${estimate.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg` : "Enter valid values"}
            </p>
            {estimate && (
              <p className="mt-1 text-sm text-muted-foreground">
                About {estimate.perAcre.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg per acre
              </p>
            )}
          </div>
        </div>

        {/* Rotation planner */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10"><RefreshCw className="size-6 text-primary" /></div>
            <div>
              <h2 className="font-display text-2xl font-bold">Crop rotation planner</h2>
              <p className="text-sm text-muted-foreground">Choose a next-season crop based on the last one.</p>
            </div>
          </div>

          <fieldset className="mt-7">
            <legend className="text-sm font-semibold">Previous crop</legend>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.keys(rotations).map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={crop === item ? "default" : "outline"}
                  onClick={() => setCrop(item as keyof typeof rotations)}
                  className="capitalize"
                >
                  {item}
                </Button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Soil health</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {soilOptions.map((s) => (
                <Button key={s} type="button" size="sm" variant={soil === s ? "default" : "outline"} onClick={() => setSoil(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 rounded-2xl bg-secondary p-5" aria-live="polite">
            <p className="text-sm font-medium text-muted-foreground">Suggested next crop</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{rotations[crop].next}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{rotations[crop].reason}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80"><strong>Soil note:</strong> {soilHints[soil]}</p>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Local soil tests, water availability, sowing windows, and extension guidance should always inform the final crop choice.
          </p>
        </div>
      </section>

      {/* Related internal links for crawlability */}
      <section className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-8" aria-labelledby="related-links">
        <h2 id="related-links" className="font-display text-xl font-bold">Continue exploring AgriSmart</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li><Link to="/features" className="text-primary hover:underline">Explore AI crop-health features</Link></li>
          <li><Link to="/marketplace" className="text-primary hover:underline">Check live market prices &amp; listings</Link></li>
          <li><Link to="/help" className="text-primary hover:underline">Read farming FAQs &amp; support</Link></li>
        </ul>
      </section>
    </div>
  );
}
