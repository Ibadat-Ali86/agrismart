import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, type Crop } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Leaf, Trash2, Loader2, Pencil } from "lucide-react";

export default function CropsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Crop | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Crop | null>(null);
  const [farmFilter, setFarmFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const qc = useQueryClient();
  const { t } = useTranslation();
  const farms = useQuery({ queryKey: ["farms"], queryFn: () => api.farms.list().then((r) => r.data) });
  const crops = useQuery({ queryKey: ["crops"], queryFn: () => api.crops.list().then((r) => r.data) });
  const del = useMutation({
    mutationFn: (id: string) => api.crops.remove(id),
    onSuccess: () => {
      toast.success(t("common.delete"));
      qc.invalidateQueries({ queryKey: ["crops"] });
      setPendingDelete(null);
    },
  });

  const filtered = useMemo(() => {
    return (crops.data || []).filter((c) => {
      if (farmFilter && c.farm_id !== farmFilter) return false;
      if (healthFilter && c.health_status !== healthFilter) return false;
      return true;
    });
  }, [crops.data, farmFilter, healthFilter]);

  return (
    <div>
      <AppHeaderBack title={t("crops.title")} right={
        <Button size="sm" onClick={() => setShowForm((s) => !s)} className="h-8 gap-1 bg-primary px-3 text-xs hover:bg-primary-dark">
          <Plus className="size-3" /> {t("common.add")}
        </Button>
      } />
      <div className="space-y-3 p-4">
        {showForm && farms.data?.length ? (
          <CropForm farms={farms.data} onDone={() => setShowForm(false)} />
        ) : showForm ? (
          <p className="rounded-xl border border-warning/40 bg-soft-orange p-3 text-sm">{t("crops.addFarmFirst")}</p>
        ) : null}

        {/* Filters */}
        <div className="flex gap-2">
          <select className="input flex-1" value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)}>
            <option value="">{t("crops.filterAllFarms")}</option>
            {farms.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select className="input flex-1" value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
            <option value="">{t("crops.filterAllHealth")}</option>
            <option value="good">{t("crops.good")}</option>
            <option value="moderate">{t("crops.moderate")}</option>
            <option value="poor">{t("crops.poor")}</option>
          </select>
        </div>

        {crops.isLoading ? (
          <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : !filtered.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <Leaf className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-2 font-semibold">{t("crops.none")}</p>
          </div>
        ) : filtered.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold">
                {c.name}
                {c.variety && <span className="ms-1 text-xs font-normal text-muted-foreground">({c.variety})</span>}
              </p>
              {c.sown_at && <p className="text-xs text-muted-foreground">Sown {new Date(c.sown_at).toLocaleDateString()}</p>}
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                c.health_status === "good" ? "bg-primary/10 text-primary" :
                c.health_status === "moderate" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
              }`}>{t(`crops.${c.health_status}`)}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(c)} className="rounded-full p-1.5 text-primary hover:bg-primary/10" aria-label={t("common.edit")}>
                <Pencil className="size-4" />
              </button>
              <button onClick={() => setPendingDelete(c)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10" aria-label={t("common.delete")}>
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <style>{`.input{height:2.5rem;border-radius:0.625rem;border:1px solid var(--color-border);background:var(--color-background);padding:0 .75rem;font-size:.875rem;outline:none}`}</style>
      </div>

      {editing && farms.data && (
        <EditCropDialog crop={editing} farms={farms.data} onClose={() => setEditing(null)} />
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("crops.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingDelete && del.mutate(pendingDelete.id)}>
              {del.isPending ? <Loader2 className="size-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CropForm({ farms, onDone }: { farms: any[]; onDone: () => void }) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { register, handleSubmit, reset } = useForm<Partial<Crop>>();
  const mut = useMutation({
    mutationFn: (d: any) => api.crops.create(d),
    onSuccess: () => { toast.success(t("common.save")); qc.invalidateQueries({ queryKey: ["crops"] }); reset(); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <select className="input" {...register("farm_id", { required: true })}>
        <option value="">{t("crops.select")}</option>
        {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <input className="input" placeholder={t("crops.name")} {...register("name", { required: true })} />
      <input className="input" placeholder={t("crops.variety")} {...register("variety")} />
      <input type="date" className="input" {...register("sown_at")} />
      <select className="input" {...register("health_status")}>
        <option value="good">{t("crops.good")}</option>
        <option value="moderate">{t("crops.moderate")}</option>
        <option value="poor">{t("crops.poor")}</option>
      </select>
      <Button type="submit" disabled={mut.isPending} className="w-full bg-primary hover:bg-primary-dark">
        {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : t("common.save")}
      </Button>
      <style>{`.input{height:2.5rem;width:100%;border-radius:0.625rem;border:1px solid var(--color-border);background:var(--color-background);padding:0 .75rem;font-size:.875rem;outline:none}`}</style>
    </form>
  );
}

function EditCropDialog({ crop, farms, onClose }: { crop: Crop; farms: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      farm_id: crop.farm_id,
      name: crop.name,
      variety: crop.variety || "",
      sown_at: crop.sown_at?.slice(0, 10) || "",
      health_status: crop.health_status,
      notes: crop.notes || "",
    },
  });
  const mut = useMutation({
    mutationFn: (d: any) => api.crops.update(crop.id, d),
    onSuccess: () => { toast.success(t("common.save")); qc.invalidateQueries({ queryKey: ["crops"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("common.edit")} — {crop.name}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-3">
          <select className="input" {...register("farm_id", { required: true })}>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input className="input" {...register("name", { required: true })} />
          <input className="input" placeholder={t("crops.variety")} {...register("variety")} />
          <input type="date" className="input" {...register("sown_at")} />
          <select className="input" {...register("health_status")}>
            <option value="good">{t("crops.good")}</option>
            <option value="moderate">{t("crops.moderate")}</option>
            <option value="poor">{t("crops.poor")}</option>
          </select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-primary hover:bg-primary-dark">
              {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : t("common.save")}
            </Button>
          </DialogFooter>
          <style>{`.input{height:2.5rem;width:100%;border-radius:0.625rem;border:1px solid var(--color-border);background:var(--color-background);padding:0 .75rem;font-size:.875rem;outline:none}`}</style>
        </form>
      </DialogContent>
    </Dialog>
  );
}
