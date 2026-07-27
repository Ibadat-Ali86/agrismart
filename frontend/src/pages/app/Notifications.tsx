import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeaderBack } from "@/components/app/AppHeaderBack";
import { api } from "@/lib/api";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list().then((r) => r.data),
  });
  const markAll = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Subscribe to realtime stream
  useEffect(() => {
    const es = new EventSource(api.notifications.streamUrl());
    es.onmessage = () => qc.invalidateQueries({ queryKey: ["notifications"] });
    return () => es.close();
  }, [qc]);

  return (
    <div>
      <AppHeaderBack title="Notifications" right={
        <Button size="sm" variant="ghost" onClick={() => markAll.mutate()} className="text-xs">
          <Check className="size-3" /> Mark all read
        </Button>
      } />
      <div className="space-y-2 p-4">
        {isLoading ? (
          <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : !data?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <Bell className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-2 font-semibold">No notifications</p>
          </div>
        ) : data.map((n) => (
          <div key={n.id} className={`rounded-xl border p-3 ${n.read_at ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read_at && (
                <button onClick={() => api.notifications.markRead(n.id).then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))} className="rounded-full p-1 text-primary hover:bg-primary/10">
                  <Check className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
