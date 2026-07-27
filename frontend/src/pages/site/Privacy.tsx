import { ShieldCheck } from "lucide-react";

const sections = [
  { title: "1. Information We Collect", body: "Personal info (name, email, phone), farm and location data, device and usage info, images you upload." },
  { title: "2. How We Use Your Information", body: "To provide and improve the service, send alerts, and personalize recommendations." },
  { title: "3. Data Sharing & Disclosure", body: "We do not sell your data. We share only with vetted partners required to operate the service." },
  { title: "4. Data Security", body: "Industry-standard encryption, JWT tokens, and secure cookies protect your account." },
  { title: "5. Your Rights", body: "Access, correction, deletion and portability of your personal data on request." },
  { title: "6. Changes to This Policy", body: "We will notify you of any material changes via email or in-app notification." },
];

export default function Privacy() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="grid place-items-center rounded-2xl bg-gradient-to-br from-soft-green to-primary/20 p-8">
        <ShieldCheck className="size-16 text-primary" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Your privacy is important to us</h1>
      <p className="mt-3 text-muted-foreground">At AgriSmart, we are committed to protecting your personal information and your right to privacy.</p>
      {sections.map((s) => (
        <section key={s.title} className="mt-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">{s.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
        </section>
      ))}
      <p className="mt-6 text-xs text-muted-foreground">Last updated: May 15, 2025</p>
    </div>
  );
}
