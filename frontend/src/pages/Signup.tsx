import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "farmer" as "farmer" | "buyer" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const r = await api.auth.register(form);
      setSession(r.token, r.user);
      toast.success("Account created — welcome to AgriSmart!");
      navigate("/app", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-secondary/50 via-background to-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-9">
        <div className="text-center">
          <Logo className="mx-auto justify-center" />
          <h1 className="mt-6 font-display text-2xl font-extrabold">Create your account 🌱</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join thousands of smart farmers</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field icon={UserIcon} label="Full name">
            <input
              required minLength={2} maxLength={80} autoComplete="name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ramesh Patel"
              className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field icon={Mail} label="Email">
            <input
              required type="email" autoComplete="email"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field icon={Lock} label="Password">
            <input
              required minLength={6} type={showPass ? "text" : "password"} autoComplete="new-password"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-10 text-sm outline-none focus:border-primary"
            />
            <button
              type="button" onClick={() => setShowPass((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </Field>

          <div>
            <label className="text-sm font-medium">I am a</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["farmer", "buyer"] as const).map((r) => (
                <button
                  type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                    form.role === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="h-12 w-full bg-primary text-base font-semibold hover:bg-primary-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : (<>Create account <ArrowRight className="ml-1 size-4" /></>)}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, children,
}: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative mt-1.5">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}

export default SignupPage;
