import { FileCheck2 } from "lucide-react";

const terms = [
  { title: "1. Acceptance of Terms", body: "By using AgriSmart you agree to these terms." },
  { title: "2. Use of the App", body: "Use the app only for lawful agricultural purposes." },
  { title: "3. User Responsibilities", body: "Maintain accurate information and protect your account." },
  { title: "4. Marketplace Terms", body: "Listings must be truthful. AgriSmart is a facilitator, not a party to transactions." },
  { title: "5. Payments & Refunds", body: "Refunds are handled per the marketplace policy." },
  { title: "6. Intellectual Property", body: "All AgriSmart content remains our property." },
  { title: "7. Limitation of Liability", body: "AgriSmart is not liable for indirect or consequential damages." },
  { title: "8. Termination", body: "We may suspend accounts that violate these terms." },
  { title: "9. Governing Law", body: "These terms are governed by the laws of India." },
];

export default function Terms() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="grid place-items-center rounded-2xl bg-gradient-to-br from-soft-green to-primary/20 p-8">
        <FileCheck2 className="size-16 text-primary" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Terms & Conditions</h1>
      <p className="mt-3 text-muted-foreground">Please read these terms and conditions carefully before using AgriSmart.</p>
      {terms.map((t, i) => (
        <details key={t.title} open={i < 2} className="mt-3 rounded-2xl border border-border bg-card p-5">
          <summary className="cursor-pointer font-display font-bold">{t.title}</summary>
          <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
        </details>
      ))}
      <p className="mt-6 text-xs text-muted-foreground">Last updated: May 15, 2025</p>
    </div>
  );
}
