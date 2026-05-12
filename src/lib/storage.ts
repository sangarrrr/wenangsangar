export type Barang = {
  id: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  expired: string; // YYYY-MM-DD
};

const KEY = "sembako-barang";

export function getBarang(): Barang[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveBarang(items: Barang[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function hariSampaiExpired(tanggal: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(tanggal);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}