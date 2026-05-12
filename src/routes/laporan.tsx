import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getPengeluaran,
  savePengeluaran,
  getLabaBersih,
  formatRupiah,
  exportSemuaData,
  type Pengeluaran,
} from "@/lib/storage";
import { toast } from "sonner";
import { Download, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/laporan")({
  head: () => ({ meta: [{ title: "Laporan — Toko Sembako" }] }),
  component: LaporanPage,
});

const today = new Date();

function LaporanPage() {
  const [items, setItems] = useState<Pengeluaran[]>([]);
  const [bulan, setBulan] = useState(today.getMonth() + 1);
  const [tahun, setTahun] = useState(today.getFullYear());
  const [form, setForm] = useState({
    kategori: "Listrik",
    jumlah: "",
    keterangan: "",
  });

  useEffect(() => {
    setItems(getPengeluaran());
  }, []);

  function persist(next: Pengeluaran[]) {
    setItems(next);
    savePengeluaran(next);
  }

  function tambah(e: React.FormEvent) {
    e.preventDefault();
    const j = Number(form.jumlah);
    if (!Number.isFinite(j) || j <= 0) return toast.error("Jumlah tidak valid");
    const baru: Pengeluaran = {
      id: crypto.randomUUID(),
      kategori: form.kategori,
      jumlah: j,
      bulan,
      tahun,
      keterangan: form.keterangan,
      tanggal: new Date().toISOString(),
    };
    persist([baru, ...items]);
    setForm({ kategori: "Listrik", jumlah: "", keterangan: "" });
    toast.success("Pengeluaran ditambahkan.");
  }

  function hapus(id: string) {
    persist(items.filter((x) => x.id !== id));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(exportSemuaData(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toko-sembako-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup berhasil diunduh.");
  }

  const ringkasan = getLabaBersih(bulan, tahun);
  const filtered = items.filter((p) => p.bulan === bulan && p.tahun === tahun);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Laporan Keuangan</h2>
          <p className="text-sm text-muted-foreground">Biaya operasional & laba bersih</p>
        </div>
        <button
          onClick={exportJson}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
        >
          <Download className="h-4 w-4" /> Export JSON
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1).toLocaleString("id-ID", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="w-24 rounded-lg border border-input bg-card px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="💵 Pemasukan" value={formatRupiah(ringkasan.pemasukan)} tone="primary" />
        <Card label="💸 Pengeluaran" value={formatRupiah(ringkasan.pengeluaran)} tone="warning" />
        <Card
          label="✅ Laba Bersih"
          value={formatRupiah(ringkasan.laba)}
          tone={ringkasan.laba >= 0 ? "primary" : "danger"}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        * Laba bersih = total profit penjualan Cash − total pengeluaran bulan terpilih
      </p>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-bold">Tambah Pengeluaran</h3>
        <form onSubmit={tambah} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <select
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {["Listrik", "Air", "Gaji", "Sewa", "Lainnya"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Jumlah"
            value={form.jumlah}
            onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            placeholder="Keterangan (opsional)"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Daftar Pengeluaran ({filtered.length})
        </div>
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Belum ada data.</div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div>
                <div className="font-medium">{p.kategori}</div>
                {p.keterangan && (
                  <div className="text-xs text-muted-foreground">{p.keterangan}</div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="font-semibold">{formatRupiah(p.jumlah)}</div>
                <button onClick={() => hapus(p.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "warning" | "danger";
}) {
  const cls =
    tone === "primary"
      ? "border-primary/30 bg-[var(--primary-soft)] text-primary"
      : tone === "warning"
        ? "border-[var(--warning)]/40 bg-[var(--warning)]/15 text-[var(--warning-foreground)]"
        : "border-destructive/30 bg-destructive/10 text-destructive";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
