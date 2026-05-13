import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getBarang,
  saveBarang,
  getPiutang,
  savePiutang,
  getTransaksi,
  saveTransaksi,
  tambahTransaksi,
  tambahRetur,
  formatRupiah,
  type Barang,
  type Transaksi,
  type Piutang,
  type ReturLog,
} from "@/lib/storage";
import { toast } from "sonner";
import { Trash2, Plus, Printer, Receipt, Package, PackageOpen, History, Undo2, X } from "lucide-react";

export const Route = createFileRoute("/kasir")({
  head: () => ({ meta: [{ title: "Kasir — Toko Sembako" }] }),
  component: KasirPage,
});

type Item = { produkId: string; jumlah: number };

function KasirPage() {
  const [barang, setBarang] = useState<Barang[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [metode, setMetode] = useState<"Cash" | "Piutang">("Cash");
  const [nama, setNama] = useState("");
  const [telp, setTelp] = useState("");
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [struk, setStruk] = useState<{ trx: Transaksi[]; total: number; metode: string; nama?: string } | null>(
    null,
  );
  const [tab, setTab] = useState<"kasir" | "riwayat">("kasir");
  const [trxAll, setTrxAll] = useState<Transaksi[]>([]);
  const [returBatchId, setReturBatchId] = useState<string | null>(null);

  useEffect(() => {
    setBarang(getBarang());
    setTrxAll(getTransaksi());
  }, []);

  function refreshAll() {
    setBarang(getBarang());
    setTrxAll(getTransaksi());
  }

  const opsi = useMemo(
    () => barang.filter((b) => b.nama.toLowerCase().includes(q.toLowerCase())),
    [barang, q],
  );

  const total = useMemo(() => {
    return items.reduce((s, it) => {
      const b = barang.find((x) => x.id === it.produkId);
      return s + (b ? b.hargaJual * it.jumlah : 0);
    }, 0);
  }, [items, barang]);

  function tambah(b: Barang) {
    if (b.stok <= 0) {
      toast.error(`${b.nama} habis`);
      return;
    }
    setItems((prev) => {
      const ada = prev.find((p) => p.produkId === b.id);
      if (ada) {
        if (ada.jumlah >= b.stok) {
          toast.error(`Stok ${b.nama} hanya ${b.stok}`);
          return prev;
        }
        return prev.map((p) => (p.produkId === b.id ? { ...p, jumlah: p.jumlah + 1 } : p));
      }
      return [...prev, { produkId: b.id, jumlah: 1 }];
    });
  }

  function ubahJumlah(id: string, j: number) {
    const b = barang.find((x) => x.id === id);
    if (!b) return;
    if (j <= 0) {
      setItems(items.filter((i) => i.produkId !== id));
      toast.success("Item dihapus, total diperbarui");
      return;
    }
    if (j > b.stok) return toast.error(`Stok ${b.nama} hanya ${b.stok}`);
    setItems(items.map((i) => (i.produkId === id ? { ...i, jumlah: j } : i)));
  }

  function hapusItem(id: string) {
    if (!confirm("Yakin ingin menghapus item ini dari keranjang?")) return;
    setItems(items.filter((i) => i.produkId !== id));
    toast.success("Item dihapus, total diperbarui");
  }

  function proses() {
    try {
      if (items.length === 0) throw new Error("Belum ada barang.");
      if (metode === "Piutang") {
        if (!nama.trim()) throw new Error("Nama pelanggan wajib diisi.");
        if (!jatuhTempo) throw new Error("Tanggal jatuh tempo wajib diisi.");
      }
      const now = new Date().toISOString();
      const batchId = crypto.randomUUID();
      const trxList: Transaksi[] = [];
      const newBarang = barang.map((b) => ({ ...b }));
      for (const it of items) {
        const b = newBarang.find((x) => x.id === it.produkId)!;
        const t: Transaksi = {
          id: crypto.randomUUID(),
          tanggal: now,
          batchId,
          produkId: b.id,
          namaProduk: b.nama,
          jumlah: it.jumlah,
          hargaJualSatuan: b.hargaJual,
          hargaBeliSatuan: b.hargaBeli,
          total: b.hargaJual * it.jumlah,
          profit: (b.hargaJual - b.hargaBeli) * it.jumlah,
          metode,
          jumlahRetur: 0,
          statusRetur: "Lunas",
        };
        b.stok -= it.jumlah;
        trxList.push(t);
        tambahTransaksi(t);
      }
      setBarang(newBarang);
      saveBarang(newBarang);
      setTrxAll(getTransaksi());

      if (metode === "Piutang") {
        const p: Piutang = {
          id: crypto.randomUUID(),
          transaksiId: trxList.map((t) => t.id).join(","),
          namaPelanggan: nama.trim(),
          telepon: telp.trim(),
          totalHutang: total,
          sisaHutang: total,
          tanggalTransaksi: now,
          jatuhTempo,
          status: "Belum Lunas",
          cicilan: [],
        };
        savePiutang([p, ...getPiutang()]);
      }
      setStruk({ trx: trxList, total, metode, nama: metode === "Piutang" ? nama : undefined });
      setItems([]);
      setNama("");
      setTelp("");
      setJatuhTempo("");
      toast.success("Transaksi berhasil!");
      console.log("[kasir] transaksi tercatat:", trxList);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (struk) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div id="struk" className="rounded-xl border border-border bg-card p-5 text-sm">
          <div className="text-center">
            <Receipt className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-1 text-lg font-bold">Toko Sembako</h3>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Metode: {struk.metode}</p>
            {struk.nama && <p className="text-xs">Pelanggan: {struk.nama}</p>}
          </div>
          <hr className="my-3 border-dashed" />
          {struk.trx.map((t) => (
            <div key={t.id} className="mb-1 flex justify-between">
              <div>
                {t.namaProduk} × {t.jumlah}
              </div>
              <div>{formatRupiah(t.total)}</div>
            </div>
          ))}
          <hr className="my-3 border-dashed" />
          <div className="flex justify-between text-base font-bold">
            <span>TOTAL</span>
            <span>{formatRupiah(struk.total)}</span>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Terima kasih 🙏</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> Cetak
          </button>
          <button
            onClick={() => setStruk(null)}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Kasir</h2>
          <p className="text-sm text-muted-foreground">Cari & tambahkan barang</p>
        </div>
        <input
          placeholder="Ketik nama barang..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        {barang.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Belum ada stok</p>
            <p className="text-xs text-muted-foreground">Tambahkan barang di menu Stok</p>
          </div>
        ) : opsi.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Tidak ada hasil untuk "{q}"
          </div>
        ) : (
          <div className="grid max-h-[calc(100vh-260px)] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
            {opsi.map((b) => {
              const habis = b.stok <= 0;
              return (
                <button
                  key={b.id}
                  onClick={() => tambah(b)}
                  disabled={habis}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-md disabled:opacity-60"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center bg-muted">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.nama} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground/60" />
                    )}
                    {habis && (
                      <span className="absolute right-1.5 top-1.5 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                        HABIS
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <div className="line-clamp-2 text-sm font-semibold leading-tight">
                      {b.nama}
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {formatRupiah(b.hargaJual)}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">Stok: {b.stok}</span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${
                          habis ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="font-bold">Keranjang</h3>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Belum ada barang</p>
        ) : (
          items.map((it) => {
            const b = barang.find((x) => x.id === it.produkId)!;
            return (
              <div key={it.produkId} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{b.nama}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRupiah(b.hargaJual)} × {it.jumlah} = {formatRupiah(b.hargaJual * it.jumlah)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => ubahJumlah(it.produkId, it.jumlah - 1)}
                    className="h-7 w-7 rounded-md border border-border"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{it.jumlah}</span>
                  <button
                    onClick={() => ubahJumlah(it.produkId, it.jumlah + 1)}
                    className="h-7 w-7 rounded-md border border-border"
                  >
                    +
                  </button>
                  <button
                    onClick={() => hapusItem(it.produkId)}
                    title="Hapus item"
                    className="ml-1 rounded-md p-1 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
          <span>Total</span>
          <span className="text-primary">{formatRupiah(total)}</span>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            {(["Cash", "Piutang"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetode(m)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  metode === m
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {metode === "Piutang" && (
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <input
              placeholder="Nama Pelanggan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
            <input
              placeholder="No. Telepon (opsional)"
              value={telp}
              onChange={(e) => setTelp(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={jatuhTempo}
              onChange={(e) => setJatuhTempo(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          onClick={proses}
          disabled={items.length === 0}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          Proses Transaksi
        </button>
      </div>
    </div>
  );
}
