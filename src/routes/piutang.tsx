import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getPiutang, savePiutang, formatRupiah, hariSampaiExpired, getUserLabel, type Piutang } from "@/lib/storage";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/piutang")({
  head: () => ({ meta: [{ title: "Piutang — Toko Sembako" }] }),
  component: PiutangPage,
});

type Filter = "semua" | "minggu" | "overdue" | "lunas";

function PiutangPage() {
  const [items, setItems] = useState<Piutang[]>([]);
  const [filter, setFilter] = useState<Filter>("semua");
  const [bayar, setBayar] = useState<{ id: string; jumlah: string } | null>(null);
  const [konfirmLunas, setKonfirmLunas] = useState<Piutang | null>(null);
  const [processingLunas, setProcessingLunas] = useState(false);

  useEffect(() => {
    setItems(getPiutang());
  }, []);

  function persist(next: Piutang[]) {
    setItems(next);
    savePiutang(next);
  }

  const filtered = useMemo(() => {
    if (filter === "lunas") return items.filter((p) => p.status === "Lunas");
    if (filter === "overdue")
      return items.filter((p) => p.status !== "Lunas" && hariSampaiExpired(p.jatuhTempo) < 0);
    if (filter === "minggu")
      return items.filter((p) => {
        const d = hariSampaiExpired(p.jatuhTempo);
        return p.status !== "Lunas" && d >= 0 && d <= 7;
      });
    return items;
  }, [items, filter]);

  function konfirmasiLunas() {
    if (!konfirmLunas || processingLunas) return;
    setProcessingLunas(true);
    const p = konfirmLunas;
    persist(
      items.map((x) =>
        x.id === p.id ? { ...x, status: "Lunas", sisaHutang: 0 } : x,
      ),
    );
    toast.success(`Hutang ${p.namaPelanggan} ditandai LUNAS.`);
    setKonfirmLunas(null);
    setTimeout(() => setProcessingLunas(false), 800);
  }

  function hapusPiutang(p: Piutang) {
    if (p.status !== "Lunas") {
      toast.error("Hanya piutang lunas yang dapat dihapus.");
      return;
    }
    if (!confirm(`Hapus data piutang ${p.namaPelanggan}?`)) return;
    persist(items.filter((x) => x.id !== p.id));
    toast.success("Data piutang dihapus.");
  }

  function submitCicilan() {
    if (!bayar) return;
    const j = Number(bayar.jumlah);
    if (!Number.isFinite(j) || j <= 0) return toast.error("Jumlah tidak valid");
    persist(
      items.map((p) => {
        if (p.id !== bayar.id) return p;
        const sisa = Math.max(0, p.sisaHutang - j);
        return {
          ...p,
          sisaHutang: sisa,
          status: sisa === 0 ? "Lunas" : "Cicilan",
          cicilan: [...p.cicilan, { tanggal: new Date().toISOString(), jumlah: j }],
        };
      }),
    );
    setBayar(null);
    toast.success("Cicilan dicatat.");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Piutang Pelanggan</h2>
        <p className="text-sm text-muted-foreground">Kelola hutang & cicilan</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["semua", "Semua"],
            ["minggu", "Jatuh Tempo Minggu Ini"],
            ["overdue", "Overdue"],
            ["lunas", "Lunas"],
          ] as [Filter, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-lg px-3 py-2 text-xs font-medium ${
              filter === k
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada piutang.
          </div>
        ) : (
          filtered.map((p) => {
            const d = hariSampaiExpired(p.jatuhTempo);
            const overdue = d < 0 && p.status !== "Lunas";
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{p.namaPelanggan}</div>
                      <StatusBadge status={p.status} overdue={overdue} />
                    </div>
                    {p.telepon && <div className="text-xs text-muted-foreground">📞 {p.telepon}</div>}
                    {p.createdBy && (
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        Dicatat oleh: <b className="text-foreground">{getUserLabel(p.createdBy)}</b>
                      </div>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        Total: <b>{formatRupiah(p.totalHutang)}</b>
                      </div>
                      <div>
                        Sisa: <b className={p.sisaHutang > 0 ? "text-destructive" : "text-primary"}>
                          {formatRupiah(p.sisaHutang)}
                        </b>
                      </div>
                      <div className="text-muted-foreground">
                        Jatuh tempo: <span className={overdue ? "font-semibold text-destructive" : ""}>{p.jatuhTempo}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {overdue ? `Lewat ${-d} hari` : d >= 0 ? `${d} hari lagi` : ""}
                      </div>
                    </div>
                    {p.cicilan.length > 0 && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          Riwayat cicilan ({p.cicilan.length})
                        </summary>
                        <ul className="mt-1 space-y-0.5 pl-4">
                          {p.cicilan.map((c, i) => (
                            <li key={i}>
                              {new Date(c.tanggal).toLocaleDateString("id-ID")} —{" "}
                              {formatRupiah(c.jumlah)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  {p.status !== "Lunas" && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setBayar({ id: p.id, jumlah: "" })}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                      >
                        Catat Cicilan
                      </button>
                      <button
                        onClick={() => setKonfirmLunas(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Lunas
                      </button>
                    </div>
                  )}
                  {p.status === "Lunas" && (
                    <button
                      onClick={() => hapusPiutang(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-destructive px-3 py-1.5 text-xs font-semibold text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {bayar && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5">
            <h3 className="mb-3 font-bold">Catat Cicilan</h3>
            <input
              type="number"
              placeholder="Jumlah dibayar"
              value={bayar.jumlah}
              onChange={(e) => setBayar({ ...bayar, jumlah: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setBayar(null)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm"
              >
                Batal
              </button>
              <button
                onClick={submitCicilan}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {konfirmLunas && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl">
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold">
              <AlertCircle className="h-5 w-5 text-[var(--warning-foreground)]" />
              Konfirmasi Lunas
            </h3>
            <p className="text-sm text-muted-foreground">
              ⚠️ Tandai hutang <b className="text-foreground">{konfirmLunas.namaPelanggan}</b>{" "}
              sebesar{" "}
              <b className="text-foreground">{formatRupiah(konfirmLunas.sisaHutang)}</b> sebagai{" "}
              <b className="text-primary">LUNAS</b>? Data ini tidak bisa di-undo.
            </p>
            {konfirmLunas.createdBy && (
              <p className="mt-2 text-xs text-muted-foreground">
                Dicatat oleh: <b className="text-foreground">{getUserLabel(konfirmLunas.createdBy)}</b>
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setKonfirmLunas(null)}
                disabled={processingLunas}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm"
              >
                Batal
              </button>
              <button
                onClick={konfirmasiLunas}
                disabled={processingLunas}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {processingLunas ? "Memproses..." : "Ya, Sudah Lunas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, overdue }: { status: Piutang["status"]; overdue: boolean }) {
  if (overdue)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
        <AlertCircle className="h-3 w-3" /> Overdue
      </span>
    );
  const cls =
    status === "Lunas"
      ? "bg-primary text-primary-foreground"
      : status === "Cicilan"
        ? "bg-[var(--warning)] text-[var(--warning-foreground)]"
        : "bg-muted text-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status}</span>;
}
