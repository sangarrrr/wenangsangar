import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getPendingBarang,
  approveProductAction,
  rejectProductAction,
  getUserLabel,
  formatRupiah,
  isOwner,
  type Barang,
} from "@/lib/storage";
import { toast } from "sonner";
import { Check, X, ClipboardCheck, Plus, Trash2, Loader2, Package } from "lucide-react";

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [{ title: "Approval Stok — Toko Sembako" }] }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const [items, setItems] = useState<Barang[]>(() => getPendingBarang());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "barang" || detail === "hydrate" || detail === "all") {
        setItems(getPendingBarang());
      }
    };
    window.addEventListener("sembako-update", refresh);
    return () => window.removeEventListener("sembako-update", refresh);
  }, []);

  if (!isOwner()) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Halaman ini khusus Owner.
      </div>
    );
  }

  async function handleApprove(b: Barang) {
    setBusy(b.id);
    try {
      await approveProductAction(b.id);
      toast.success(
        b.approvalStatus === "pending_delete"
          ? `"${b.nama}" dihapus permanen.`
          : `"${b.nama}" disetujui & masuk inventory.`,
      );
      setItems(getPendingBarang());
    } catch (e: any) {
      toast.error("Gagal: " + (e?.message ?? "Unknown"));
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(b: Barang) {
    setBusy(b.id);
    try {
      await rejectProductAction(b.id);
      toast.success(
        b.approvalStatus === "pending_delete"
          ? `Permintaan hapus "${b.nama}" dibatalkan.`
          : `Permintaan tambah "${b.nama}" ditolak.`,
      );
      setItems(getPendingBarang());
    } catch (e: any) {
      toast.error("Gagal: " + (e?.message ?? "Unknown"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <ClipboardCheck className="h-6 w-6 text-primary" /> Panel Approval
        </h2>
        <p className="text-sm text-muted-foreground">
          Setujui atau tolak permintaan tambah/hapus stok dari karyawan.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          🎉 Tidak ada permintaan menunggu. Semua bersih.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => {
            const isDel = b.approvalStatus === "pending_delete";
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 ${
                  isDel
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-[var(--warning)]/40 bg-[var(--warning)]/5"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.nama} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            isDel
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-[var(--warning)] text-[var(--warning-foreground)]"
                          }`}
                        >
                          {isDel ? (
                            <>
                              <Trash2 className="h-3 w-3" /> Minta Hapus
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" /> Minta Tambah
                            </>
                          )}
                        </span>
                        <div className="font-semibold">{b.nama}</div>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {b.kategori}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Stok: <b className="text-foreground">{b.stok}</b>
                        </span>
                        <span>Jual: {formatRupiah(b.hargaJual)}</span>
                        <span>
                          Oleh: <b className="text-foreground">{getUserLabel(b.requestedBy)}</b>
                        </span>
                        {b.createdAt && (
                          <span>
                            {new Date(b.createdAt).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busy === b.id}
                      onClick={() => handleReject(b)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      disabled={busy === b.id}
                      onClick={() => handleApprove(b)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {busy === b.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      ACC
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}