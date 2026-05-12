import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getBarang, saveBarang, formatRupiah, type Barang } from "@/lib/storage";
import { Pencil, Trash2, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/stok")({
  head: () => ({
    meta: [
      { title: "Manajemen Stok — Toko Sembako" },
      { name: "description", content: "Tambah, ubah, dan hapus stok barang toko sembako." },
    ],
  }),
  component: StokPage,
});

type FormState = {
  nama: string;
  hargaBeli: string;
  hargaJual: string;
  stok: string;
  expired: string;
};

const empty: FormState = { nama: "", hargaBeli: "", hargaJual: "", stok: "", expired: "" };

function StokPage() {
  const [items, setItems] = useState<Barang[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setItems(getBarang());
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);

  function persist(next: Barang[]) {
    setItems(next);
    saveBarang(next);
  }

  function openAdd() {
    setEditId(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(b: Barang) {
    setEditId(b.id);
    setForm({
      nama: b.nama,
      hargaBeli: String(b.hargaBeli),
      hargaJual: String(b.hargaJual),
      stok: String(b.stok),
      expired: b.expired,
    });
    setOpen(true);
  }

  function handleHapus(id: string) {
    if (!confirm("Hapus barang ini?")) return;
    persist(items.filter((b) => b.id !== id));
    setMsg({ type: "ok", text: "Barang berhasil dihapus." });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nama = form.nama.trim();
    const hargaBeli = Number(form.hargaBeli);
    const hargaJual = Number(form.hargaJual);
    const stok = Number(form.stok);
    const expired = form.expired;

    if (!nama) return setMsg({ type: "err", text: "Nama barang wajib diisi." });
    if (!Number.isFinite(hargaBeli) || hargaBeli < 0)
      return setMsg({ type: "err", text: "Harga beli harus angka ≥ 0." });
    if (!Number.isFinite(hargaJual) || hargaJual < 0)
      return setMsg({ type: "err", text: "Harga jual harus angka ≥ 0." });
    if (!Number.isInteger(stok) || stok < 0)
      return setMsg({ type: "err", text: "Stok tidak boleh negatif." });
    if (!expired) return setMsg({ type: "err", text: "Tanggal expired wajib diisi." });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expired);
    exp.setHours(0, 0, 0, 0);
    if (exp.getTime() < today.getTime())
      return setMsg({ type: "err", text: "Tanggal expired tidak boleh sebelum hari ini." });

    if (editId) {
      persist(
        items.map((b) =>
          b.id === editId ? { ...b, nama, hargaBeli, hargaJual, stok, expired } : b,
        ),
      );
      setMsg({ type: "ok", text: "Barang berhasil diperbarui." });
    } else {
      const baru: Barang = {
        id: crypto.randomUUID(),
        nama,
        hargaBeli,
        hargaJual,
        stok,
        expired,
      };
      persist([baru, ...items]);
      setMsg({ type: "ok", text: "Barang berhasil ditambahkan." });
    }
    setOpen(false);
    setForm(empty);
    setEditId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Stok</h2>
          <p className="text-sm text-muted-foreground">Kelola seluruh barang toko Anda</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            msg.type === "ok"
              ? "border-primary/30 bg-[var(--primary-soft)] text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {msg.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {msg.text}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada barang. Klik "Tambah" untuk memulai.
          </div>
        ) : (
          items.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <div className="font-semibold">{b.nama}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Stok: <b className="text-foreground">{b.stok}</b></span>
                  <span>Beli: {formatRupiah(b.hargaBeli)}</span>
                  <span>Jual: {formatRupiah(b.hargaJual)}</span>
                  <span>Exp: {b.expired}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(b)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => handleHapus(b.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editId ? "Edit Barang" : "Tambah Barang"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-accent"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nama Barang">
                <input
                  className={inputCls}
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: Beras 5kg"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Harga Beli">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.hargaBeli}
                    onChange={(e) => setForm({ ...form, hargaBeli: e.target.value })}
                  />
                </Field>
                <Field label="Harga Jual">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.hargaJual}
                    onChange={(e) => setForm({ ...form, hargaJual: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stok Awal">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.stok}
                    onChange={(e) => setForm({ ...form, stok: e.target.value })}
                  />
                </Field>
                <Field label="Tanggal Expired">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.expired}
                    onChange={(e) => setForm({ ...form, expired: e.target.value })}
                  />
                </Field>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}