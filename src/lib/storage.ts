import { supabase } from "@/integrations/supabase/client";

// ===== Types (kept compatible with existing UI) =====
export type Barang = {
  id: string;
  nama: string;
  kategori: string;
  stokAwal: number;
  stok: number;
  hargaBeli: number;
  marginPersen: number;
  hargaJual: number;
  expired: string | null;
  imageUrl?: string;
};

export type Transaksi = {
  id: string;
  tanggal: string;
  produkId: string;
  namaProduk: string;
  jumlah: number;
  hargaJualSatuan: number;
  hargaBeliSatuan: number;
  total: number;
  profit: number;
  metode: "Cash" | "Piutang";
  customerId?: string | null;
  jumlahRetur?: number;
  statusRetur?: "Lunas" | "Retur Sebagian" | "Retur Full";
  batchId?: string;
};

export type Piutang = {
  id: string;
  transaksiId: string;
  namaPelanggan: string;
  telepon: string;
  totalHutang: number;
  sisaHutang: number;
  tanggalTransaksi: string;
  jatuhTempo: string;
  status: "Belum Lunas" | "Cicilan" | "Lunas";
  cicilan: { tanggal: string; jumlah: number }[];
  catatan?: string;
};

export type Pengeluaran = {
  id: string;
  kategori: string;
  jumlah: number;
  bulan: number;
  tahun: number;
  keterangan?: string;
  tanggal: string;
};

export type ReturLog = {
  id: string;
  transaksiId: string;
  batchId?: string;
  produkId: string;
  namaProduk: string;
  jumlahRetur: number;
  refundAmount: number;
  tanggal: string;
};

// ===== In-memory cache (per session, hydrated from Supabase) =====
let _barang: Barang[] = [];
let _trx: Transaksi[] = [];
let _piutang: Piutang[] = [];
let _peng: Pengeluaran[] = [];
let _retur: ReturLog[] = [];
let _hydrated = false;
let _userId: string | null = null;

function emit(k = "all") {
  try {
    window.dispatchEvent(new CustomEvent("sembako-update", { detail: k }));
  } catch {}
}

export function isHydrated() {
  return _hydrated;
}

export function clearCache() {
  _barang = [];
  _trx = [];
  _piutang = [];
  _peng = [];
  _retur = [];
  _hydrated = false;
  _userId = null;
  emit("clear");
}

async function getUserId(): Promise<string> {
  if (_userId) return _userId;
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Belum login");
  _userId = data.user.id;
  return _userId;
}

// ===== Mappers =====
function rowToBarang(r: any): Barang {
  return {
    id: r.id,
    nama: r.nama_barang,
    kategori: r.kategori,
    stokAwal: Number(r.stok_awal),
    stok: Number(r.stok),
    hargaBeli: Number(r.harga_beli),
    marginPersen: Number(r.margin_persen),
    hargaJual: Number(r.harga_jual),
    expired: r.expired_date,
    imageUrl: r.image_url ?? undefined,
  };
}
function barangToRow(b: Barang, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    nama_barang: b.nama,
    kategori: b.kategori,
    stok_awal: b.stokAwal,
    stok: b.stok,
    harga_beli: b.hargaBeli,
    margin_persen: b.marginPersen,
    harga_jual: b.hargaJual,
    expired_date: b.expired,
    image_url: b.imageUrl ?? null,
  };
}

function rowToTrx(r: any): Transaksi {
  return {
    id: r.id,
    tanggal: r.created_at,
    produkId: r.product_id ?? "",
    namaProduk: r.nama_produk,
    jumlah: r.quantity,
    hargaJualSatuan: Number(r.harga_jual_satuan),
    hargaBeliSatuan: Number(r.harga_beli_satuan),
    total: Number(r.total_harga),
    profit: Number(r.profit),
    metode: r.metode_pembayaran,
    customerId: r.customer_id ?? null,
    jumlahRetur: r.jumlah_retur ?? 0,
    statusRetur: (r.status_retur as Transaksi["statusRetur"]) ?? "Lunas",
    batchId: r.batch_id ?? undefined,
  };
}
function trxToRow(t: Transaksi, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    product_id: t.produkId || null,
    nama_produk: t.namaProduk,
    quantity: t.jumlah,
    harga_jual_satuan: t.hargaJualSatuan,
    harga_beli_satuan: t.hargaBeliSatuan,
    total_harga: t.total,
    profit: t.profit,
    metode_pembayaran: t.metode,
    customer_id: t.customerId ?? null,
    batch_id: t.batchId ?? null,
    jumlah_retur: t.jumlahRetur ?? 0,
    status_retur: t.statusRetur ?? "Lunas",
    created_at: t.tanggal,
  };
}

function rowToPiutang(r: any): Piutang {
  return {
    id: r.id,
    transaksiId: r.transaction_id ?? "",
    namaPelanggan: r.nama_pelanggan,
    telepon: r.telepon ?? "",
    totalHutang: Number(r.total_hutang),
    sisaHutang: Number(r.sisa_hutang),
    tanggalTransaksi: r.created_at,
    jatuhTempo: r.jatuh_tempo,
    status: r.status,
    cicilan: Array.isArray(r.cicilan) ? r.cicilan : [],
    catatan: r.catatan ?? undefined,
  };
}
function piutangToRow(p: Piutang, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    transaction_id: null, // ID list dipisah koma -> tidak fit FK; simpan di catatan
    nama_pelanggan: p.namaPelanggan,
    telepon: p.telepon || null,
    total_hutang: p.totalHutang,
    sisa_hutang: p.sisaHutang,
    jatuh_tempo: p.jatuhTempo,
    status: p.status,
    cicilan: p.cicilan,
    catatan: p.catatan ?? null,
    created_at: p.tanggalTransaksi,
  };
}

function rowToPeng(r: any): Pengeluaran {
  return {
    id: r.id,
    kategori: r.kategori,
    jumlah: Number(r.jumlah),
    bulan: r.bulan,
    tahun: r.tahun,
    keterangan: r.keterangan ?? undefined,
    tanggal: r.tanggal,
  };
}
function pengToRow(p: Pengeluaran, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    kategori: p.kategori,
    jumlah: p.jumlah,
    bulan: p.bulan,
    tahun: p.tahun,
    keterangan: p.keterangan ?? null,
    tanggal: p.tanggal,
  };
}

function rowToRetur(r: any): ReturLog {
  return {
    id: r.id,
    transaksiId: r.transaction_id ?? "",
    batchId: r.batch_id ?? undefined,
    produkId: r.product_id ?? "",
    namaProduk: r.nama_produk,
    jumlahRetur: r.jumlah_retur,
    refundAmount: Number(r.refund_amount),
    tanggal: r.created_at,
  };
}
function returToRow(r: ReturLog, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    transaction_id: r.transaksiId || null,
    batch_id: r.batchId ?? null,
    product_id: r.produkId || null,
    nama_produk: r.namaProduk,
    jumlah_retur: r.jumlahRetur,
    refund_amount: r.refundAmount,
    created_at: r.tanggal,
  };
}

// ===== Hydration =====
export async function hydrateAll(): Promise<void> {
  await getUserId();
  const [pr, tr, rec, exp, ret] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }),
    supabase.from("receivables").select("*").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("tanggal", { ascending: false }),
    supabase.from("returns").select("*").order("created_at", { ascending: false }),
  ]);
  if (pr.error) throw pr.error;
  if (tr.error) throw tr.error;
  if (rec.error) throw rec.error;
  if (exp.error) throw exp.error;
  if (ret.error) throw ret.error;
  _barang = (pr.data ?? []).map(rowToBarang);
  _trx = (tr.data ?? []).map(rowToTrx);
  _piutang = (rec.data ?? []).map(rowToPiutang);
  _peng = (exp.data ?? []).map(rowToPeng);
  _retur = (ret.data ?? []).map(rowToRetur);
  _hydrated = true;
  emit("hydrate");
}

// ===== Generic diff sync =====
async function syncTable<T extends { id: string }>(
  table: string,
  prev: T[],
  next: T[],
  toRow: (item: T, userId: string) => any,
) {
  const userId = await getUserId();
  const prevIds = new Set(prev.map((x) => x.id));
  const nextIds = new Set(next.map((x) => x.id));
  const toDelete = [...prevIds].filter((id) => !nextIds.has(id));
  // Upsert semua next (insert baru + update existing)
  if (next.length > 0) {
    const rows = next.map((n) => toRow(n, userId));
    const { error } = await (supabase.from(table as any) as any).upsert(rows);
    if (error) throw error;
  }
  if (toDelete.length > 0) {
    const { error } = await (supabase.from(table as any) as any).delete().in("id", toDelete);
    if (error) throw error;
  }
}

// ===== Barang =====
export function getBarang(): Barang[] {
  return _barang;
}
export function saveBarang(items: Barang[]) {
  const prev = _barang;
  _barang = items;
  emit("barang");
  syncTable("products", prev, items, barangToRow).catch((e) => {
    console.error("[saveBarang] gagal:", e);
    try {
      // toast lazy
      import("sonner").then(({ toast }) => toast.error("Gagal simpan barang: " + e.message));
    } catch {}
  });
}

// ===== Transaksi =====
export function getTransaksi(): Transaksi[] {
  return _trx;
}
export function saveTransaksi(items: Transaksi[]) {
  const prev = _trx;
  _trx = items;
  emit("trx");
  syncTable("transactions", prev, items, trxToRow).catch((e) => {
    console.error("[saveTransaksi] gagal:", e);
    import("sonner").then(({ toast }) => toast.error("Gagal simpan transaksi: " + e.message));
  });
}
export function tambahTransaksi(t: Transaksi) {
  saveTransaksi([t, ..._trx]);
}

// ===== Piutang =====
export function getPiutang(): Piutang[] {
  return _piutang;
}
export function savePiutang(items: Piutang[]) {
  const prev = _piutang;
  _piutang = items;
  emit("piutang");
  syncTable("receivables", prev, items, piutangToRow).catch((e) => {
    console.error("[savePiutang] gagal:", e);
    import("sonner").then(({ toast }) => toast.error("Gagal simpan piutang: " + e.message));
  });
}

// ===== Pengeluaran =====
export function getPengeluaran(): Pengeluaran[] {
  return _peng;
}
export function savePengeluaran(items: Pengeluaran[]) {
  const prev = _peng;
  _peng = items;
  emit("peng");
  syncTable("expenses", prev, items, pengToRow).catch((e) => {
    console.error("[savePengeluaran] gagal:", e);
    import("sonner").then(({ toast }) => toast.error("Gagal simpan pengeluaran: " + e.message));
  });
}

// ===== Retur =====
export function getRetur(): ReturLog[] {
  return _retur;
}
export function saveRetur(items: ReturLog[]) {
  const prev = _retur;
  _retur = items;
  emit("retur");
  syncTable("returns", prev, items, returToRow).catch((e) => {
    console.error("[saveRetur] gagal:", e);
    import("sonner").then(({ toast }) => toast.error("Gagal simpan retur: " + e.message));
  });
}
export function tambahRetur(r: ReturLog) {
  saveRetur([r, ..._retur]);
}

// ===== Helpers (pure) =====
export function formatRupiah(n: number) {
  return "Rp " + Math.round(n || 0).toLocaleString("id-ID");
}
export function hitungHargaJual(hargaBeli: number, margin: number) {
  return Math.round(hargaBeli * (1 + margin / 100));
}
export function hariSampaiExpired(tanggal: string | null | undefined): number {
  if (!tanggal) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(tanggal);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}
export function persenStok(b: Barang) {
  if (!b.stokAwal) return 100;
  return Math.round((b.stok / b.stokAwal) * 100);
}
export function statusStok(b: Barang): "ok" | "menipis" | "habis" {
  if (b.stok <= 0) return "habis";
  if (persenStok(b) <= 30) return "menipis";
  return "ok";
}
export function statusExpired(b: Barang): "ok" | "warning" | "danger" {
  if (!b.expired) return "ok";
  const d = hariSampaiExpired(b.expired);
  if (d < 0) return "danger";
  if (d <= 14) return "danger";
  return "ok";
}

export function getLabaBersih(bulan: number, tahun: number) {
  const trx = _trx.filter((t) => {
    const d = new Date(t.tanggal);
    return d.getMonth() + 1 === bulan && d.getFullYear() === tahun;
  });
  const trxCash = trx.filter((t) => t.metode === "Cash");
  const peng = _peng.filter((p) => p.bulan === bulan && p.tahun === tahun);
  const penjualanCash = trxCash.reduce((s, t) => s + t.total, 0);
  // Profit dihitung dari SEMUA transaksi (Cash + Piutang) karena profit dicatat
  // saat transaksi awal, bukan saat pelunasan piutang.
  const profit = trx.reduce((s, t) => s + t.profit, 0);
  const pelunasanPiutang = getCicilanPayments(bulan, tahun).reduce(
    (s, c) => s + c.jumlah,
    0,
  );
  // Total uang masuk = penjualan cash + pelunasan piutang (perpindahan aset).
  const pemasukan = penjualanCash + pelunasanPiutang;
  const pengeluaran = peng.reduce((s, p) => s + p.jumlah, 0);
  return {
    pemasukan,
    penjualanCash,
    pelunasanPiutang,
    profit,
    pengeluaran,
    laba: profit - pengeluaran,
    arusKas: pemasukan - pengeluaran,
  };
}

// ===== Cicilan payments (di-extract dari receivables.cicilan JSONB) =====
export type CicilanPayment = {
  receivableId: string;
  namaPelanggan: string;
  telepon: string;
  tanggal: string;
  jumlah: number;
  sisaSetelah: number;
};

export function getAllCicilanPayments(): CicilanPayment[] {
  const out: CicilanPayment[] = [];
  for (const p of _piutang) {
    let sisaRunning = p.totalHutang;
    const sorted = [...p.cicilan].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );
    for (const c of sorted) {
      sisaRunning = Math.max(0, sisaRunning - c.jumlah);
      out.push({
        receivableId: p.id,
        namaPelanggan: p.namaPelanggan,
        telepon: p.telepon,
        tanggal: c.tanggal,
        jumlah: c.jumlah,
        sisaSetelah: sisaRunning,
      });
    }
  }
  return out.sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
  );
}

export function getCicilanPayments(bulan: number, tahun: number): CicilanPayment[] {
  return getAllCicilanPayments().filter((c) => {
    const d = new Date(c.tanggal);
    return d.getMonth() + 1 === bulan && d.getFullYear() === tahun;
  });
}

export function getTotalPiutangBelumLunas(): number {
  return _piutang
    .filter((p) => p.status !== "Lunas")
    .reduce((s, p) => s + p.sisaHutang, 0);
}

// ===== Realized vs Unrealized Profit =====
// Laba Kotor (Potensial): semua profit dari transaksi (Cash + Piutang) dalam periode.
// Laba Cair (Terealisasi): profit Cash + profit Piutang × (terbayar/totalHutang).
// Laba Terkunci: Laba Kotor - Laba Cair (masih nyangkut di piutang).
export function getLabaTerealisasi(bulan: number, tahun: number) {
  const inPeriod = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() + 1 === bulan && d.getFullYear() === tahun;
  };
  const trxBulan = _trx.filter((t) => inPeriod(t.tanggal));
  const labaKotor = trxBulan.reduce((s, t) => s + t.profit, 0);
  const labaCash = trxBulan
    .filter((t) => t.metode === "Cash")
    .reduce((s, t) => s + t.profit, 0);

  // Profit per transaksi (semua periode, untuk lookup)
  const trxProfitById = new Map<string, { profit: number; tanggal: string }>();
  for (const t of _trx) trxProfitById.set(t.id, { profit: t.profit, tanggal: t.tanggal });

  let labaPiutangRealized = 0;
  for (const p of _piutang) {
    if (!p.totalHutang) continue;
    const ids = (p.transaksiId || "").split(",").map((s) => s.trim()).filter(Boolean);
    const linked = ids
      .map((id) => trxProfitById.get(id))
      .filter((x): x is { profit: number; tanggal: string } => !!x)
      .filter((x) => inPeriod(x.tanggal));
    const totalProfitPiutang = linked.reduce((s, x) => s + x.profit, 0);
    if (totalProfitPiutang <= 0) continue;
    const fraksiBayar = Math.min(
      1,
      Math.max(0, (p.totalHutang - p.sisaHutang) / p.totalHutang),
    );
    labaPiutangRealized += totalProfitPiutang * fraksiBayar;
  }

  const labaCair = labaCash + labaPiutangRealized;
  const labaTerkunci = Math.max(0, labaKotor - labaCair);
  return { labaKotor, labaCair, labaTerkunci };
}

export function exportSemuaData() {
  return {
    barang: _barang,
    transaksi: _trx,
    piutang: _piutang,
    pengeluaran: _peng,
    exportedAt: new Date().toISOString(),
  };
}

// Deprecated — multi-user tidak butuh seed dummy.
export function seedDummyJikaKosong() {
  /* no-op */
}
