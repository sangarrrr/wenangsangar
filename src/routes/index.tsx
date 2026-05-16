import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getBarang,
  getTransaksi,
  getPiutang,
  getLabaBersih,
  getRetur,
  formatRupiah,
  hariSampaiExpired,
  persenStok,
  type Barang,
  type Transaksi,
  type Piutang,
  type ReturLog,
} from "@/lib/storage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { TrendingUp, AlertTriangle, CalendarClock, Wallet, Undo2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Toko Sembako" }] }),
  component: Dashboard,
});

const PIE_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"];

function Dashboard() {
  const [barang, setBarang] = useState<Barang[]>([]);
  const [trx, setTrx] = useState<Transaksi[]>([]);
  const [piutang, setPiutang] = useState<Piutang[]>([]);
  const [retur, setRetur] = useState<ReturLog[]>([]);
  const [showReset, setShowReset] = useState(false);
  const [konfirmText, setKonfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [lastReset, setLastReset] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setBarang(getBarang());
      setTrx(getTransaksi());
      setPiutang(getPiutang());
      setRetur(getRetur());
      try {
        setLastReset(localStorage.getItem("sembako-last-reset"));
      } catch {}
    };
    refresh();
    window.addEventListener("sembako-update", refresh);
    return () => window.removeEventListener("sembako-update", refresh);
  }, []);

  function handleReset() {
    if (resetting) return;
    if (konfirmText.trim().toUpperCase() !== "RESET") {
      toast.error('Ketik "RESET" untuk konfirmasi');
      return;
    }
    setResetting(true);
    try {
      localStorage.removeItem("sembako-transaksi");
      localStorage.removeItem("sembako-retur");
      const ts = new Date().toISOString();
      localStorage.setItem("sembako-last-reset", ts);
      window.dispatchEvent(new CustomEvent("sembako-update", { detail: "reset" }));
      console.log(`Data penjualan direset oleh user pada ${new Date(ts).toLocaleString("id-ID")}`);
      toast.success("✅ Data penjualan berhasil direset. Stok & pelanggan tetap aman.");
      setShowReset(false);
      setKonfirmText("");
    } catch (e: any) {
      toast.error("Gagal mereset: " + e.message);
    } finally {
      setTimeout(() => setResetting(false), 1500);
    }
  }

  const today = new Date();
  const todayStr = today.toDateString();
  const totalHariIni = trx
    .filter((t) => new Date(t.tanggal).toDateString() === todayStr)
    .reduce((s, t) => s + t.total, 0);

  const returHariIni = retur
    .filter((r) => new Date(r.tanggal).toDateString() === todayStr)
    .reduce((s, r) => s + r.refundAmount, 0);

  const stokMenipis = barang.filter((b) => b.stok > 0 && persenStok(b) <= 30).length;
  const hampirExpired = barang.filter((b) => {
    if (!b.expired) return false;
    const d = hariSampaiExpired(b.expired);
    return d >= 0 && d <= 14;
  }).length;

  const ringkasan = getLabaBersih(today.getMonth() + 1, today.getFullYear());
  const piutangBelum = piutang
    .filter((p) => p.status !== "Lunas")
    .reduce((s, p) => s + p.sisaHutang, 0);

  const totalUangMasuk = trx
    .filter((t) => {
      const d = new Date(t.tanggal);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear() &&
        t.metode === "Cash"
      );
    })
    .reduce((s, t) => s + t.total, 0);

  const rasioKas =
    totalUangMasuk + piutangBelum === 0
      ? 100
      : Math.round((totalUangMasuk / (totalUangMasuk + piutangBelum)) * 100);
  const rasioColor = rasioKas > 70 ? "bg-primary" : rasioKas >= 40 ? "bg-[var(--warning)]" : "bg-destructive";

  // Top 5 paling sering dibeli (jumlah)
  const topJumlah = useMemo(() => {
    const map = new Map<string, { nama: string; jumlah: number }>();
    trx.forEach((t) => {
      const e = map.get(t.produkId) ?? { nama: t.namaProduk, jumlah: 0 };
      e.jumlah += t.jumlah;
      map.set(t.produkId, e);
    });
    return [...map.values()].sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);
  }, [trx]);

  // Top profit
  const topProfit = useMemo(() => {
    const map = new Map<string, { nama: string; profit: number }>();
    trx.forEach((t) => {
      const e = map.get(t.produkId) ?? { nama: t.namaProduk, profit: 0 };
      e.profit += t.profit;
      map.set(t.produkId, e);
    });
    return [...map.values()]
      .filter((x) => x.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 8);
  }, [trx]);

  // Tren 30 hari
  const tren30 = useMemo(() => {
    const arr: { tgl: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const total = trx
        .filter((t) => new Date(t.tanggal).toDateString() === key)
        .reduce((s, t) => s + t.total, 0);
      arr.push({
        tgl: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        total,
      });
    }
    return arr;
  }, [trx]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Ringkasan toko hari ini</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SumCard icon={<TrendingUp className="h-4 w-4" />} label="Penjualan Hari Ini" value={formatRupiah(totalHariIni)} tone="primary" />
        <SumCard icon={<AlertTriangle className="h-4 w-4" />} label="Stok Menipis" value={`${stokMenipis} item`} tone="warning" />
        <SumCard icon={<CalendarClock className="h-4 w-4" />} label="Hampir Expired" value={`${hampirExpired} item`} tone="danger" />
        <SumCard icon={<Wallet className="h-4 w-4" />} label="Piutang Aktif" value={formatRupiah(piutangBelum)} tone="warning" />
        <SumCard icon={<Undo2 className="h-4 w-4" />} label="Total Retur Hari Ini" value={formatRupiah(returHariIni)} tone="retur" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MiniCard label="💵 Uang Masuk (Bulan Ini)" value={formatRupiah(totalUangMasuk)} />
        <MiniCard label="💸 Pengeluaran" value={formatRupiah(ringkasan.pengeluaran)} />
        <MiniCard
          label="✅ Laba Bersih"
          value={formatRupiah(ringkasan.laba)}
          highlight={ringkasan.laba >= 0 ? "primary" : "danger"}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Rasio Kas vs Piutang</span>
          <span className="font-bold">{rasioKas}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div className={`h-full ${rasioColor}`} style={{ width: `${rasioKas}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Target sehat: ≥ 70% (hijau). Kuning 40–70%, merah &lt; 40%.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="5 Barang Paling Sering Dibeli">
          {topJumlah.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topJumlah}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="nama" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Profit Tertinggi per Barang">
          {topProfit.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={topProfit}
                  dataKey="profit"
                  nameKey="nama"
                  innerRadius={45}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {topProfit.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Tren Penjualan 30 Hari Terakhir">
        {trx.length === 0 ? (
          <Empty />
        ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={tren30}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="tgl" tick={{ fontSize: 10 }} interval={3} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip formatter={(v: number) => formatRupiah(v)} />
            <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="flex flex-col items-center gap-2 border-t border-border pt-5">
        <button
          onClick={() => setShowReset(true)}
          className="rounded-lg bg-[oklch(0.88_0.06_25)] px-4 py-2 text-sm font-semibold text-[oklch(0.35_0.15_25)] hover:bg-[oklch(0.84_0.08_25)]"
        >
          🗑️ Reset Data Penjualan
        </button>
        {lastReset && (
          <p className="text-xs text-muted-foreground">
            Terakhir direset: {new Date(lastReset).toLocaleString("id-ID")}
          </p>
        )}
      </div>

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-5 shadow-xl">
            <h3 className="text-lg font-bold">⚠️ PERINGATAN</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tindakan ini akan menghapus <strong>SEMUA</strong> riwayat transaksi, retur, dan
              perhitungan laba bulan ini. Data stok & pelanggan <strong>TETAP AMAN</strong>. Lanjutkan?
            </p>
            <div className="mt-4">
              <label className="block text-xs font-medium text-muted-foreground">
                Ketik <span className="font-mono font-bold text-destructive">RESET</span> untuk konfirmasi
              </label>
              <input
                value={konfirmText}
                onChange={(e) => setKonfirmText(e.target.value.slice(0, 10))}
                maxLength={10}
                placeholder="RESET"
                className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono outline-none focus:border-destructive"
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowReset(false);
                  setKonfirmText("");
                }}
                className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                disabled={resetting || konfirmText.trim().toUpperCase() !== "RESET"}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground disabled:opacity-40"
              >
                {resetting ? "Mereset..." : "Ya, Reset Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SumCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "warning" | "danger" | "retur" }) {
  const cls =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "warning"
        ? "bg-[var(--warning)] text-[var(--warning-foreground)]"
        : tone === "retur"
          ? "bg-[var(--retur)] text-[var(--retur-foreground)]"
          : "bg-destructive text-destructive-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${cls}`}>{icon}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="truncate text-base font-bold">{value}</div>
    </div>
  );
}
function MiniCard({ label, value, highlight }: { label: string; value: string; highlight?: "primary" | "danger" }) {
  const cls =
    highlight === "primary"
      ? "text-primary"
      : highlight === "danger"
        ? "text-destructive"
        : "";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-bold ${cls}`}>{value}</div>
    </div>
  );
}
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
function Empty() {
  return <div className="py-12 text-center text-sm text-muted-foreground">Belum ada data transaksi.</div>;
}
