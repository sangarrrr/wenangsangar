import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isOwner } from "@/lib/storage";
import { toast } from "sonner";
import { Shield, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Manajemen User — Toko Sembako" }] }),
  component: UsersPage,
});

type Profile = {
  id: string;
  email: string | null;
  nama_toko: string | null;
  role: "owner" | "karyawan";
};

function UsersPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner()) {
      toast.error("Akses ditolak. Halaman ini khusus Owner.");
      navigate({ to: "/kasir" });
      return;
    }
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        setMe(u.user?.id ?? null);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, nama_toko, role")
          .order("created_at", { ascending: true });
        if (error) throw error;
        setProfiles((data as Profile[]) ?? []);
      } catch (e: any) {
        toast.error("Gagal memuat user: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function toggleRole(p: Profile) {
    if (p.id === me) {
      toast.error("Tidak bisa mengubah role diri sendiri.");
      return;
    }
    const newRole: "owner" | "karyawan" = p.role === "owner" ? "karyawan" : "owner";
    setSavingId(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", p.id);
    setSavingId(null);
    if (error) {
      toast.error("Gagal ubah role: " + error.message);
      return;
    }
    setProfiles((xs) => xs.map((x) => (x.id === p.id ? { ...x, role: newRole } : x)));
    toast.success(`Role diubah menjadi ${newRole.toUpperCase()}.`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Manajemen User</h2>
        <p className="text-sm text-muted-foreground">
          Kelola role pengguna. Owner punya akses penuh; Karyawan hanya bisa Kasir & Stok.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Memuat daftar user…
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Belum ada user terdaftar.
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-semibold">
                  {p.role === "owner" ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate">{p.email ?? "(tanpa email)"}</span>
                  {p.id === me && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Anda</span>
                  )}
                </div>
                {p.nama_toko && (
                  <div className="text-xs text-muted-foreground">{p.nama_toko}</div>
                )}
                <div className="mt-1 text-xs">
                  Role saat ini:{" "}
                  <b
                    className={
                      p.role === "owner" ? "text-primary" : "text-muted-foreground"
                    }
                  >
                    {p.role.toUpperCase()}
                  </b>
                </div>
              </div>
              <button
                onClick={() => toggleRole(p)}
                disabled={savingId === p.id || p.id === me}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                {savingId === p.id
                  ? "Menyimpan…"
                  : p.role === "owner"
                    ? "Jadikan Karyawan"
                    : "Jadikan Owner"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}