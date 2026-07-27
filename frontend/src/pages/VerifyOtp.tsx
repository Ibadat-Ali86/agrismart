import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [seconds, setSeconds] = useState(45);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) navigate("/login", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d) && i === 5) verify(next.join(""));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      const arr = text.split("");
      setOtp(arr);
      verify(text);
    }
  };

  async function verify(code: string) {
    if (loading) return;
    setLoading(true);
    try {
      const r = await api.auth.verifyOtp(email, code);
      setSession(r.token, r.user);
      toast.success("Verified — welcome!");
      navigate("/app", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Invalid code");
      setOtp(Array(6).fill(""));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (resending || seconds > 0) return;
    setResending(true);
    try {
      await api.auth.requestOtp(email);
      toast.success("New code sent");
      setSeconds(45);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not resend");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-secondary/50 via-background to-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-9">
        <Logo className="mx-auto justify-center" />
        <h1 className="mt-6 text-center font-display text-2xl font-extrabold">Verify your email</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Enter the 6-digit code we sent to<br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>

        <div className="mt-7 flex justify-center gap-2" onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }}
              inputMode="numeric" maxLength={1} disabled={loading}
              className="size-12 rounded-xl border border-border bg-background text-center text-xl font-bold outline-none transition focus:border-primary disabled:opacity-50"
            />
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {seconds > 0 ? (
            <>Resend in <span className="font-semibold text-primary">00:{seconds.toString().padStart(2, "0")}</span></>
          ) : (
            <button onClick={resend} disabled={resending} className="font-semibold text-primary disabled:opacity-50">
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          )}
        </p>

        <Button
          onClick={() => verify(otp.join(""))}
          disabled={loading || otp.some((d) => !d)}
          size="lg" className="mt-6 h-12 w-full bg-primary hover:bg-primary-dark"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify & continue"}
        </Button>
        <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-primary">Use a different email</Link>
      </div>
    </div>
  );
}

export default VerifyOtp;
