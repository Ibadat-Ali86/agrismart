import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(160),
  subject: z.string().trim().min(3, "Subject too short").max(120),
  message: z.string().trim().min(10, "Message too short").max(2000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || "Invalid form"); return; }
    setLoading(true);
    try {
      // Backend contact endpoint can be wired here; meanwhile show success.
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
      toast.success("Message received — we'll be in touch.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } finally { setLoading(false); }
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">Get in touch</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">We'd love to hear from you</h1>
        <p className="mt-3 text-muted-foreground">Questions, partnerships, support — our team replies within 24 hours.</p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-9">
          <h2 className="font-display text-xl font-bold">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">Our team will get back to you shortly.</p>
          <div className="mt-6 space-y-3">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name" maxLength={80}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address" maxLength={160}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject" maxLength={120}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Your message" maxLength={2000}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>
          <Button type="submit" size="lg" disabled={loading} className="mt-5 w-full bg-primary hover:bg-primary-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : sent ? "Message sent ✓" : "Send message"}
          </Button>
        </form>

        <div className="space-y-4">
          <InfoCard icon={Phone} title="Phone" lines={["+91 98765 43210", "Mon–Sat: 9:00 AM – 6:00 PM"]} />
          <InfoCard icon={Mail} title="Email" lines={["support@agrismart.com", "We reply within 24 hours"]} />
          <InfoCard icon={MapPin} title="Address" lines={["AgriSmart Technologies Pvt. Ltd.", "123 Green Avenue, Pune", "Maharashtra, India – 411001"]} />
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Follow us</p>
            <div className="mt-3 flex gap-2">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="grid size-10 place-items-center rounded-full bg-secondary text-primary transition hover:bg-primary hover:text-primary-foreground">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: React.ComponentType<{ className?: string }>; title: string; lines: string[] }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <p className="font-display font-bold">{title}</p>
        {lines.map((l, i) => (
          <p key={i} className={i === 0 ? "text-sm" : "text-xs text-muted-foreground"}>{l}</p>
        ))}
      </div>
    </div>
  );
}

export default ContactPage;
