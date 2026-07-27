import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { email: sp.get("email") || "", code: "", password: "" },
  });
  const submit = async (d: any) => {
    try { await api.auth.resetPassword(d); toast.success("Password updated — sign in"); nav("/login"); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-soft-green to-background p-4">
      <form onSubmit={handleSubmit(submit)} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center"><Logo /></div>
        <h1 className="font-display text-2xl font-bold">Reset password</h1>
        <input type="email" required placeholder="Email" className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm" {...register("email", { required: true })} />
        <input required maxLength={6} placeholder="6-digit code" className="h-11 w-full rounded-lg border border-border bg-background px-4 text-center text-lg tracking-widest" {...register("code", { required: true, pattern: /^\d{6}$/ })} />
        <input type="password" required minLength={6} placeholder="New password" className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm" {...register("password", { required: true, minLength: 6 })} />
        <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-primary hover:bg-primary-dark">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Reset password"}
        </Button>
        <p className="text-center text-sm"><Link to="/login" className="text-primary">Back to login</Link></p>
      </form>
    </div>
  );
}
