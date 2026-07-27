import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const nav = useNavigate();
  const { register, handleSubmit } = useForm({ defaultValues: {
    name: user?.name || "", phone: user?.phone || "", language: user?.language || "en",
    state: user?.state || "", district: user?.district || "", village: user?.village || "",
  }});
  const mut = useMutation({
    mutationFn: (d: any) => api.users.updateMe(d),
    onSuccess: () => { toast.success("Profile updated"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <AppHeaderBack title="Profile" />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-5 text-primary-foreground shadow-md">
          <span className="grid size-16 place-items-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </span>
          <div>
            <p className="font-display text-lg font-bold">{user?.name}</p>
            <p className="text-sm text-white/85">{user?.email}</p>
            <p className="text-xs text-white/70 capitalize">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <Field label="Name"><input className="input" {...register("name")} /></Field>
          <Field label="Phone"><input className="input" {...register("phone")} /></Field>
          <Field label="Language">
            <select className="input" {...register("language")}>
              <option value="en">English</option>
              <option value="ur">اردو</option>
              <option value="hi">हिन्दी</option>
            </select>
          </Field>
          <Field label="State"><input className="input" {...register("state")} /></Field>
          <Field label="District"><input className="input" {...register("district")} /></Field>
          <Field label="Village"><input className="input" {...register("village")} /></Field>
          <Button type="submit" disabled={mut.isPending} className="w-full bg-primary hover:bg-primary-dark">
            {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
          </Button>
        </form>

        <Button variant="outline" onClick={async () => { await logout(); nav("/login"); }} className="w-full text-destructive">
          <LogOut className="size-4" /> Sign out
        </Button>

        <style>{`.input{height:2.5rem;width:100%;border-radius:0.625rem;border:1px solid var(--color-border);background:var(--color-background);padding:0 .75rem;font-size:.875rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>;
}
