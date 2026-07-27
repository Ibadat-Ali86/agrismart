import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { api, type Farm } from "@/lib/api";
import { Plus, MapPin, Trash2, Loader2, Sprout, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

export default function FarmsPage() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { formatArea } = useSettings();
  const [editing, setEditing] = useState<Farm | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Farm | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["farms"],
    queryFn: () => api.farms.list().then((r) => r.data),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.farms.remove(id),
    onSuccess: () => {
      toast.success(t("farms.deleted"));
      qc.invalidateQueries({ queryKey: ["farms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setPendingDelete(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <AppHeaderBack title={t("farms.title")} right={
        <Link to="/app/farms/new">
          <Button size="sm" className="h-8 gap-1 bg-primary px-3 text-xs hover:bg-primary-dark">
            <Plus className="size-3" /> {t("common.add")}
          </Button>
        </Link>
      } />
      <div className="space-y-3 p-4">
        {isLoading ? (
          <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : !data?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <Sprout className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-2 font-semibold">{t("farms.none")}</p>
            <p className="text-sm text-muted-foreground">{t("farms.addFirst")}</p>
            <Link to="/app/farms/new" className="mt-4 inline-block">
              <Button className="bg-primary hover:bg-primary-dark"><Plus className="size-4" /> {t("farms.add")}</Button>
            </Link>
          </div>
        ) : data.map((f) => (
          <div key={f.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
            <div className="grid h-28 place-items-center bg-gradient-to-br from-primary/20 to-soft-green text-5xl">🌾</div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold">{f.name}</p>
                {f.address && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {f.address}</p>}
                <p className="mt-1 text-xs font-medium">
                  {formatArea(Number(f.area_acres) * 0.4046856)}
                  {f.soil_type ? ` • ${f.soil_type}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => setEditing(f)}
                  className="rounded-full p-1.5 text-primary hover:bg-primary/10"
                  aria-label={t("common.edit")}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setPendingDelete(f)}
                  className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <EditFarmDialog farm={editing} onClose={() => setEditing(null)} />}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("farms.deleteConfirm")}</AlertDialogTitle>
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

function EditFarmDialog({ farm, onClose }: { farm: Farm; onClose: () => void }) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: farm.name,
      address: farm.address || "",
      area_acres: Number(farm.area_acres),
      soil_type: farm.soil_type || "",
      irrigation_type: farm.irrigation_type || "",
    },
  });
  const mut = useMutation({
    mutationFn: (d: any) => api.farms.update(farm.id, d),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["farms"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("farms.edit")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-3">
          <input className="input" placeholder={t("farms.name")} {...register("name", { required: true })} />
          <input className="input" placeholder={t("farms.address")} {...register("address")} />
          <input type="number" step="0.1" className="input" placeholder={t("farms.area")} {...register("area_acres", { valueAsNumber: true, required: true })} />
          <select className="input" {...register("soil_type")}>
            <option value="">{t("farms.soil")}</option>
            <option>Black</option><option>Red</option><option>Loamy</option><option>Sandy</option><option>Clay</option>
          </select>
          <select className="input" {...register("irrigation_type")}>
            <option value="">{t("farms.irrigation")}</option>
            <option>Drip</option><option>Sprinkler</option><option>Flood</option><option>Rainfed</option>
          </select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-primary hover:bg-primary-dark">
              {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : t("common.save")}
            </Button>
          </DialogFooter>
          <style>{`.input{height:2.5rem;width:100%;border-radius:0.625rem;border:1px solid var(--color-border);background:var(--color-background);padding:0 .75rem;font-size:.875rem;outline:none}.input:focus{border-color:var(--color-primary)}`}</style>
        </form>
      </DialogContent>
    </Dialog>
  );
}
