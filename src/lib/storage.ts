// ===== Types =====
export type Barang = {
  id: string;
  nama: string;
  kategori: string;
  stokAwal: number;
  stok: number; // stok sekarang
  hargaBeli: number;
  marginPersen: number;
  hargaJual: number;
  expired: string | null; // YYYY-MM-DD, null = non-perishable
  imageUrl?: string;
};

export type Transaksi = {
  id: string;
  tanggal: string; // ISO
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
  jatuhTempo: string; // YYYY-MM-DD
  status: "Belum Lunas" | "Cicilan" | "Lunas";
  cicilan: { tanggal: string; jumlah: number }[];
  catatan?: string;
};

export type Pengeluaran = {
  id: string;
  kategori: string;
  jumlah: number;
  bulan: number; // 1-12
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

const K_BARANG = "sembako-barang";
const K_TRX = "sembako-transaksi";
const K_PIUTANG = "sembako-piutang";
const K_PENG = "sembako-pengeluaran";
const K_RETUR = "sembako-retur";

// ===== Generic =====
function load<T>(k: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(k) || "[]");
  } catch {
    return [];
  }
}
function save<T>(k: string, v: T[]) {
  localStorage.setItem(k, JSON.stringify(v));
  try {
    window.dispatchEvent(new CustomEvent("sembako-update", { detail: k }));
  } catch {}
}

// ===== Barang (with migration) =====
export function getBarang(): Barang[] {
  const raw = load<any>(K_BARANG);
  return raw.map((b) => migrasiBarang(b));
}
function migrasiBarang(b: any): Barang {
  const hargaBeli = Number(b.hargaBeli ?? 0);
  const hargaJual = Number(b.hargaJual ?? hargaBeli);
  const margin =
    b.marginPersen != null
      ? Number(b.marginPersen)
      : hargaBeli > 0
        ? Math.round(((hargaJual - hargaBeli) / hargaBeli) * 100)
        : 0;
  return {
    id: b.id,
    nama: b.nama ?? "",
    kategori: b.kategori ?? "Lainnya",
    stokAwal: Number(b.stokAwal ?? b.stok ?? 0),
    stok: Number(b.stok ?? 0),
    hargaBeli,
    marginPersen: margin,
    hargaJual,
    expired: b.expired ? b.expired : null,
    imageUrl: b.imageUrl || b.foto || undefined,
  };
}
export function saveBarang(items: Barang[]) {
  save(K_BARANG, items);
}

// ===== Transaksi =====
export function getTransaksi(): Transaksi[] {
  return load<Transaksi>(K_TRX);
}
export function saveTransaksi(items: Transaksi[]) {
  save(K_TRX, items);
}
export function tambahTransaksi(t: Transaksi) {
  saveTransaksi([t, ...getTransaksi()]);
}

// ===== Piutang =====
export function getPiutang(): Piutang[] {
  return load<Piutang>(K_PIUTANG);
}
export function savePiutang(items: Piutang[]) {
  save(K_PIUTANG, items);
}

// ===== Pengeluaran =====
export function getPengeluaran(): Pengeluaran[] {
  return load<Pengeluaran>(K_PENG);
}
export function savePengeluaran(items: Pengeluaran[]) {
  save(K_PENG, items);
}

// ===== Retur =====
export function getRetur(): ReturLog[] {
  return load<ReturLog>(K_RETUR);
}
export function saveRetur(items: ReturLog[]) {
  save(K_RETUR, items);
}
export function tambahRetur(r: ReturLog) {
  saveRetur([r, ...getRetur()]);
}

// ===== Helpers =====
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
  const trx = getTransaksi().filter((t) => {
    const d = new Date(t.tanggal);
    return d.getMonth() + 1 === bulan && d.getFullYear() === tahun && t.metode === "Cash";
  });
  const peng = getPengeluaran().filter((p) => p.bulan === bulan && p.tahun === tahun);
  const pemasukan = trx.reduce((s, t) => s + t.total, 0);
  const profit = trx.reduce((s, t) => s + t.profit, 0);
  const pengeluaran = peng.reduce((s, p) => s + p.jumlah, 0);
  return { pemasukan, profit, pengeluaran, laba: profit - pengeluaran };
}

export function exportSemuaData() {
  return {
    barang: getBarang(),
    transaksi: getTransaksi(),
    piutang: getPiutang(),
    pengeluaran: getPengeluaran(),
    exportedAt: new Date().toISOString(),
  };
}

// ===== Seed dummy data =====
export function seedDummyJikaKosong() {
  if (typeof window === "undefined") return;
  if (getBarang().length > 0) return;
  const today = new Date();
  const tgl = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const dummy: Barang[] = [
    { id: crypto.randomUUID(), nama: "Beras Premium 5kg", kategori: "Sembako", stokAwal: 20, stok: 18, hargaBeli: 60000, marginPersen: 15, hargaJual: 69000, expired: tgl(180) },
    { id: crypto.randomUUID(), nama: "Minyak Goreng 1L", kategori: "Sembako", stokAwal: 30, stok: 8, hargaBeli: 14000, marginPersen: 20, hargaJual: 16800, expired: tgl(120) },
    { id: crypto.randomUUID(), nama: "Gula Pasir 1kg", kategori: "Sembako", stokAwal: 25, stok: 6, hargaBeli: 13000, marginPersen: 18, hargaJual: 15340, expired: tgl(200) },
    { id: crypto.randomUUID(), nama: "Telur 1kg", kategori: "Protein", stokAwal: 15, stok: 4, hargaBeli: 26000, marginPersen: 12, hargaJual: 29120, expired: tgl(10) },
    { id: crypto.randomUUID(), nama: "Susu UHT 1L", kategori: "Minuman", stokAwal: 24, stok: 22, hargaBeli: 16000, marginPersen: 18, hargaJual: 18880, expired: tgl(7) },
    { id: crypto.randomUUID(), nama: "Roti Tawar", kategori: "Roti", stokAwal: 12, stok: 3, hargaBeli: 12000, marginPersen: 25, hargaJual: 15000, expired: tgl(5) },
    { id: crypto.randomUUID(), nama: "Mie Instan", kategori: "Sembako", stokAwal: 100, stok: 75, hargaBeli: 2800, marginPersen: 25, hargaJual: 3500, expired: tgl(300) },
    { id: crypto.randomUUID(), nama: "Kopi Sachet", kategori: "Minuman", stokAwal: 50, stok: 40, hargaBeli: 1500, marginPersen: 33, hargaJual: 2000, expired: tgl(250) },
  ];
  saveBarang(dummy);
}
