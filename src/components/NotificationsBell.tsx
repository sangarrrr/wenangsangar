import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isOwner } from "@/lib/storage";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOwner()) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const id = u.user?.id ?? null;
      setUid(id);
      if (!id) return;
      await refetch(id);
      channel = supabase
        .channel("notif-" + id)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${id}` },
          () => refetch(id),
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function refetch(id: string) {
    const { data } = await (supabase.from("notifications" as any) as any)
      .select("id,type,title,message,is_read,created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10);
    setItems((data as Notif[]) ?? []);
  }

  async function markRead(n: Notif) {
    if (n.is_read) return;
    setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    await (supabase.from("notifications" as any) as any)
      .update({ is_read: true })
      .eq("id", n.id);
  }

  async function markAllRead() {
    if (!uid) return;
    setItems((xs) => xs.map((x) => ({ ...x, is_read: true })));
    await (supabase.from("notifications" as any) as any)
      .update({ is_read: true })
      .eq("user_id", uid)
      .eq("is_read", false);
  }

  if (!isOwner()) return null;
  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifikasi"
        className="relative inline-flex items-center justify-center rounded-lg border border-border p-1.5 hover:bg-accent"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[92vw] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">Notifikasi</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <Check className="h-3 w-3" /> Tandai semua
              </button>
            )}
          </div>
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Belum ada notifikasi.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`block w-full px-3 py-2.5 text-left text-xs hover:bg-accent ${
                    n.is_read ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{n.title}</span>
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{n.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                    {new Date(n.created_at).toLocaleString("id-ID")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}