import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type FormData = {
  name: string; area_acres: number; soil_type?: string;
  irrigation_type?: string; address?: string;
};

export default function AddFarm() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const mut = useMutation({
    mutationFn: (d: FormData) => api.farms.create(d),
    onSuccess: () => {
      toast.success("Farm created");
      qc.invalidateQueries({ queryKey: ["farms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      nav("/app/farms");
    },
    onError: (e: any) => toast.error(e.message || "Failed to create farm"),
  });

  return (
    <div>
      <AppHeaderBack title="Add New Farm" to="/app/farms" />
      <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-4 p-4">
        <Field label="Farm Name" error={errors.name?.message}>
          <input className="input" placeholder="My Farm" {...register("name", { required: "Name is required", minLength: { value: 2, message: "Too short" } })} />
        </Field>
        <Field label="Address / Location">
          <input className="input" placeholder="Village, District, State" {...register("address")} />
        </Field>
        <Field label="Total Area (Acres)" error={errors.area_acres?.message}>
          <input type="number" step="0.1" className="input" placeholder="2.5" {...register("area_acres", { required: "Area is required", valueAsNumber: true, min: { value: 0, message: "Must be positive" } })} />
        </Field>
        <Field label="Soil Type">
          <select className="input" {...register("soil_type")}>
            <option value="">Select…</option><option>Black</option><option>Red</option><option>Loamy</option><option>Sandy</option><option>Clay</option>
          </select>
        </Field>
        <Field label="Irrigation">
          <select className="input" {...register("irrigation_type")}>
            <option value="">Select…</option><option>Drip</option><option>Sprinkler</option><option>Flood</option><option>Rainfed</option>
          </select>
        </Field>
        <Button type="submit" size="lg" disabled={mut.isPending} className="h-12 w-full bg-primary hover:bg-primary-dark">
          {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save Farm"}
        </Button>
      </form>
      <style>{`.input{height:2.75rem;width:100%;border-radius:0.75rem;border:1px solid var(--color-border);background:var(--color-background);padding:0 1rem;font-size:.875rem;outline:none}.input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px color-mix(in oklab, var(--color-primary) 15%, transparent)}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
