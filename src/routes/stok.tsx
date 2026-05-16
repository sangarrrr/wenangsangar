import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getBarang,
  saveBarang,
  formatRupiah,
  hitungHargaJual,
  hariSampaiExpired,
  persenStok,
  statusStok,
  type Barang,
} from "@/lib/storage";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, AlertTriangle, Clock, Upload, ImageOff, Loader2, Package } from "lucide-react";
import { uploadGambarKeCloudinary, CLOUDINARY_CONFIGURED } from "@/lib/cloudinary";

export const Route = createFileRoute("/stok")({
  head: () => ({ meta: [{ title: "Stok — Toko Sembako" }] }),
  component: StokPage,
});

type FormState = {
  nama: string;
  kategori: string;
  hargaBeli: string;
  marginPersen: string;
  stokAwal: string;
  stok: string;
  expired: string;
  imageUrl: string;
};
const empty: FormState = {
  nama: "",
  kategori: "Sembako",
  hargaBeli: "",
  marginPersen: "20",
  stokAwal: "",
  stok: "",
  expired: "",
  imageUrl: "",
};

function StokPage() {
  const [items, setItems] = useState<Barang[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setItems(getBarang());
  }, []);

  const hargaJualPreview = useMemo(() => {
    const hb = Number(form.hargaBeli) || 0;
    const m = Number(form.marginPersen) || 0;
    return hitungHargaJual(hb, m);
  }, [form.hargaBeli, form.marginPersen]);

  const filtered = useMemo(
    () => items.filter((b) => b.nama.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

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
      kategori: b.kategori,
      hargaBeli: String(b.hargaBeli),
      marginPersen: String(b.marginPersen),
      stokAwal: String(b.stokAwal),
      stok: String(b.stok),
      expired: b.expired ?? "",
      imageUrl: b.imageUrl || "",
    });
    setOpen(true);
  }
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!CLOUDINARY_CONFIGURED) {
      toast.error("Cloudinary belum dikonfigurasi. Edit src/lib/cloudinary.ts");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadGambarKeCloudinary(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Gambar berhasil diunggah.");
    } catch (err: any) {
      toast.error(err.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  }
  function handleHapus(id: string) {
    if (!confirm("Hapus barang ini?")) return;
    persist(items.filter((b) => b.id !== id));
    toast.success("Barang dihapus.");
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const nama = form.nama.trim();
      const kategori = form.kategori.trim() || "Lainnya";
      const hargaBeli = Number(form.hargaBeli);
      const margin = Number(form.marginPersen);
      const stokAwal = Number(form.stokAwal);
      const stok = form.stok === "" ? stokAwal : Number(form.stok);
      const expired = form.expired ? form.expired : null;

      if (!nama) throw new Error("Nama barang wajib diisi.");
      if (!Number.isFinite(hargaBeli) || hargaBeli < 0) throw new Error("Harga beli ≥ 0.");
      if (!Number.isFinite(margin) || margin < 0) throw new Error("Margin ≥ 0.");
      if (!Number.isInteger(stokAwal) || stokAwal < 0) throw new Error("Stok awal ≥ 0.");
      if (!Number.isInteger(stok) || stok < 0) throw new Error("Stok sekarang ≥ 0.");
      const hargaJual = hitungHargaJual(hargaBeli, margin);
      if (editId) {
        persist(
          items.map((b) =>
            b.id === editId
              ? { ...b, nama, kategori, hargaBeli, marginPersen: margin, hargaJual, stokAwal, stok, expired, imageUrl: form.imageUrl || undefined }
              : b,
          ),
        );
        toast.success("Barang diperbarui.");
      } else {
        const baru: Barang = {
          id: crypto.randomUUID(),
          nama,
          kategori,
          hargaBeli,
          marginPersen: margin,
          hargaJual,
          stokAwal,
          stok,
          expired,
          imageUrl: form.imageUrl || undefined,
        };
        persist([baru, ...items]);
        toast.success("Barang ditambahkan.");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Stok</h2>
          <p className="text-sm text-muted-foreground">Kelola barang, harga & expired</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      <input
        placeholder="Cari barang..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada barang.
          </div>
        ) : (
          filtered.map((b) => {
            const hasExp = !!b.expired;
            const sisaHari = hariSampaiExpired(b.expired);
            const sStok = statusStok(b);
            const sExp = !hasExp ? "none" : sisaHari < 0 ? "expired" : sisaHari <= 14 ? "danger" : "ok";
            return (
              <div key={b.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.nama} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{b.nama}</div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {b.kategori}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Stok: <b className="text-foreground">{b.stok}</b>/{b.stokAwal} ({persenStok(b)}%)
                      </span>
                      <span>Beli: {formatRupiah(b.hargaBeli)}</span>
                      <span>
                        Margin: <b className="text-foreground">{b.marginPersen}%</b>
                      </span>
                      <span>
                        Jual: <b className="text-primary">{formatRupiah(b.hargaJual)}</b>
                      </span>
                      <span>
                        Exp:{" "}
                        {b.expired ? (
                          formatTanggal(b.expired)
                        ) : (
                          <span className="text-[#9CA3AF]">∞</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sStok === "habis" && <Badge tone="danger">Stok Habis</Badge>}
                      {sStok === "menipis" && (
                        <Badge tone="warning">
                          <AlertTriangle className="h-3 w-3" />
                          Stok Menipis ({persenStok(b)}% tersisa)
                        </Badge>
                      )}
                      {sExp === "expired" && <Badge tone="danger">Sudah Expired</Badge>}
                      {sExp === "danger" && sisaHari >= 0 && (
                        <Badge tone="danger">
                          <Clock className="h-3 w-3" />
                          Segera Jual! Expired dalam {sisaHari} hari · saran diskon 20–30%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleHapus(b.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-foreground/40 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editId ? "Edit Barang" : "Tambah Barang"}</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Foto Produk (opsional, maks 2MB)">
                <div className="flex items-center gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent">
                      {uploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" /> {form.imageUrl ? "Ganti Gambar" : "Pilih Gambar"}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={handleFile}
                      />
                    </label>
                    {form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" /> Hapus Gambar
                      </button>
                    )}
                    {!CLOUDINARY_CONFIGURED && (
                      <p className="text-[10px] text-muted-foreground">
                        Cloudinary belum dikonfigurasi. Edit{" "}
                        <code>src/lib/cloudinary.ts</code>.
                      </p>
                    )}
                  </div>
                </div>
              </Field>
              <Field label="Nama Barang">
                <input
                  className={inputCls}
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </Field>
              <Field label="Kategori">
                <input
                  className={inputCls}
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  placeholder="Sembako / Minuman / Roti / dll"
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
                <Field label="Margin (%)">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.marginPersen}
                    onChange={(e) => setForm({ ...form, marginPersen: e.target.value })}
                  />
                </Field>
              </div>
              <div className="rounded-lg bg-[var(--primary-soft)] px-3 py-2 text-sm">
                Harga Jual Otomatis: <b className="text-primary">{formatRupiah(hargaJualPreview)}</b>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stok Awal">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.stokAwal}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stokAwal: e.target.value,
                        stok: editId ? form.stok : e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Stok Sekarang">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.stok}
                    onChange={(e) => setForm({ ...form, stok: e.target.value })}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.expired === ""}
                  onChange={(e) =>
                    setForm({ ...form, expired: e.target.checked ? "" : form.expired || "" })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                Barang Non-Perishable (tanpa kadaluarsa)
              </label>
              <Field label="Tanggal Kadaluarsa (opsional)">
                <input
                  type="date"
                  className={inputCls}
                  value={form.expired}
                  placeholder="Kosongkan untuk barang tahan lama (sapu, ember, dll)"
                  onChange={(e) => setForm({ ...form, expired: e.target.value })}
                />
              </Field>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
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

function Badge({ tone, children }: { tone: "warning" | "danger"; children: React.ReactNode }) {
  const cls =
    tone === "warning"
      ? "bg-[var(--warning)] text-[var(--warning-foreground)]"
      : "bg-destructive text-destructive-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}
