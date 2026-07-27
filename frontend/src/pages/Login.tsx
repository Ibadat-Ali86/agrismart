import { Link, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Mode = "password" | "otp";

function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/app";

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.auth.login({ email, password });
      setSession(r.token, r.user);
      toast.success(`Welcome back, ${r.user.name.split(" ")[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.requestOtp(email);
      toast.success("OTP sent — check your inbox");
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-secondary/50 via-background to-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-9">
        <div className="text-center">
          <Logo className="mx-auto justify-center" />
          <h1 className="mt-6 font-display text-2xl font-extrabold">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your AgriSmart account</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded-lg py-2 transition ${mode === "password" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >Password</button>
          <button
            type="button"
            onClick={() => setMode("otp")}
            className={`rounded-lg py-2 transition ${mode === "otp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >Email OTP</button>
        </div>

        <form
          onSubmit={mode === "password" ? handlePassword : handleOtpRequest}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="text-sm font-medium">Email address</label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                required type="email" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </div>

          {mode === "password" && (
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required type={showPass ? "text" : "password"} autoComplete="current-password"
                  minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-10 text-sm outline-none transition focus:border-primary"
                />
                <button
                  type="button" onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading} className="h-12 w-full bg-primary text-base font-semibold hover:bg-primary-dark">
            {loading
              ? <Loader2 className="size-4 animate-spin" />
              : (<>{mode === "password" ? "Sign in" : "Send OTP"} <ArrowRight className="ml-1 size-4" /></>)}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          New to AgriSmart? <Link to="/signup" className="font-semibold text-primary">Create an account</Link>
        </p>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-primary">Terms</Link> &{" "}
          <Link to="/privacy" className="text-primary">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
