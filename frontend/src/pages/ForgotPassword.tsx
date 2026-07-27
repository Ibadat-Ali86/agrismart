import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, getValues } = useForm<{ email: string }>();
  const submit = async ({ email }: { email: string }) => {
    try { await api.auth.forgotPassword(email); setSent(true); toast.success("Check your email"); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-soft-green to-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center"><Logo /></div>
        <div>
          <h1 className="font-display text-2xl font-bold">Forgot password</h1>
          <p className="text-sm text-muted-foreground">We'll email you a 6-digit reset code.</p>
        </div>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <input type="email" required placeholder="Email" className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm" {...register("email", { required: true })} />
          <Button type="submit" className="h-11 w-full bg-primary hover:bg-primary-dark">Send code</Button>
        </form>
        {sent && (
          <Button variant="outline" className="w-full" onClick={() => nav(`/reset-password?email=${encodeURIComponent(getValues("email"))}`)}>
            I have a code — reset password
          </Button>
        )}
        <p className="text-center text-sm"><Link to="/login" className="text-primary">Back to login</Link></p>
      </div>
    </div>
  );
}
