import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-info/10 text-info",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-primary/20 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Orders() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { currency } = useSettings();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", role],
    queryFn: () => api.orders.list(role).then((r) => r.data),
  });
  const status = useMutation({
    mutationFn: ({ id, status }: any) => api.orders.updateStatus(id, status),
    onSuccess: () => { toast.success(t("common.save")); qc.invalidateQueries({ queryKey: ["orders"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <AppHeaderBack title={t("orders.title")} />
      <div className="p-4">
        <div className="mb-4 grid grid-cols-2 rounded-xl border border-border bg-muted/40 p-1">
          {(["buyer", "seller"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`rounded-lg py-2 text-sm font-medium transition ${role === r ? "bg-card text-primary shadow" : "text-muted-foreground"}`}>
              {r === "buyer" ? t("orders.purchases") : t("orders.sales")}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : !data?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <Package className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-2 font-semibold">{t("orders.none")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((o) => (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{o.listing_title}</p>
                    <p className="text-xs text-muted-foreground">{o.quantity} {o.unit} · {new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{currency(Number(o.total_amount))}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                  </div>
                </div>
                {role === "seller" && o.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => status.mutate({ id: o.id, status: "confirmed" })} className="bg-primary hover:bg-primary-dark">{t("orders.confirm")}</Button>
                    <Button size="sm" variant="outline" onClick={() => status.mutate({ id: o.id, status: "cancelled" })}>{t("orders.decline")}</Button>
                  </div>
                )}
                {role === "seller" && o.status === "confirmed" && (
                  <Button size="sm" onClick={() => status.mutate({ id: o.id, status: "shipped" })} className="mt-3 bg-primary hover:bg-primary-dark">{t("orders.markShipped")}</Button>
                )}
                {role === "seller" && o.status === "shipped" && (
                  <Button size="sm" onClick={() => status.mutate({ id: o.id, status: "delivered" })} className="mt-3 bg-primary hover:bg-primary-dark">{t("orders.markDelivered")}</Button>
                )}
                {role === "buyer" && o.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => status.mutate({ id: o.id, status: "cancelled" })} className="mt-3">{t("common.cancel")}</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
