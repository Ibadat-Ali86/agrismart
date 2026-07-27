import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const faqs = [
  { q: "How do I add a new farm?", a: "Go to Profile → My Farms → Add Farm, then fill in the details and save." },
  { q: "How does disease scanning work?", a: "Open Scan Crop, take a clear photo of an affected leaf, and our on-device AI returns a diagnosis." },
  { q: "How to place an order in the marketplace?", a: "Browse Marketplace, tap Buy Now on a listing, and complete checkout." },
  { q: "Can I use AgriSmart offline?", a: "Yes — most core features are cached for low-connectivity areas." },
  { q: "How do I estimate my yield?", a: "Use the free yield calculator on the Smart Farming Guides page." },
];

export default function Help() {
  useEffect(() => {
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
    document.head.appendChild(ld);
    return () => {
      document.head.removeChild(ld);
    };
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <li><ChevronRight className="size-3.5" aria-hidden /></li>
          <li aria-current="page" className="text-foreground">Help Center</li>
        </ol>
      </nav>
      <h1 className="font-display text-3xl font-extrabold">Help Center</h1>
      <p className="mt-2 text-muted-foreground">Find answers or open a ticket — we usually reply within 24 hours.</p>
      <div className="mt-6 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="rounded-2xl border border-border bg-card p-5">
            <summary className="cursor-pointer font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Looking for planning tools? Try the{" "}
        <Link to="/guides" className="text-primary hover:underline">Smart Farming Guides &amp; yield calculator</Link>.
      </p>
    </div>
  );
}
