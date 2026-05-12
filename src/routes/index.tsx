import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getBarang, formatRupiah, hariSampaiExpired, type Barang } from "@/lib/storage";
import { AlertTriangle, CalendarClock, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Toko Sembako" },
      { name: "description", content: "Ringkasan penjualan dan stok toko sembako." },
    ],
  }),
  component: Index,
});

type Filter = "semua" | "expired" | "menipis";

function Index() {
  const [items, setItems] = useState<Barang[]>([]);
  const [filter, setFilter] = useState<Filter>("semua");

  useEffect(() => {
    setItems(getBarang());
  }, []);

  const totalPenjualan = 0; // belum ada modul penjualan
  const stokMenipis = items.filter((b) => b.stok < 5).length;
  const hampirExpired = items.filter((b) => {
    const d = hariSampaiExpired(b.expired);
    return d >= 0 && d <= 3;
  }).length;

  const filtered = useMemo(() => {
    if (filter === "expired")
      return items.filter((b) => {
        const d = hariSampaiExpired(b.expired);
        return d >= 0 && d <= 3;
      });
    if (filter === "menipis") return items.filter((b) => b.stok < 5);
    return items;
  }, [items, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Ringkasan toko hari ini</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Penjualan Hari Ini"
          value={formatRupiah(totalPenjualan)}
          tone="primary"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Stok Menipis (<5)"
          value={`${stokMenipis} barang`}
          tone="warning"
        />
        <SummaryCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Hampir Expired (≤3 hari)"
          value={`${hampirExpired} barang`}
          tone="danger"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterBtn active={filter === "semua"} onClick={() => setFilter("semua")}>
          Tampilkan Semua
        </FilterBtn>
        <FilterBtn active={filter === "expired"} onClick={() => setFilter("expired")}>
          Hampir Expired
        </FilterBtn>
        <FilterBtn active={filter === "menipis"} onClick={() => setFilter("menipis")}>
          Stok Menipis
        </FilterBtn>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-12 gap-2 border-b border-border bg-muted px-4 py-3 text-xs font-semibold uppercase text-muted-foreground sm:grid">
          <div className="col-span-5">Nama</div>
          <div className="col-span-2">Stok</div>
          <div className="col-span-3">Harga Jual</div>
          <div className="col-span-2">Expired</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada barang. Tambahkan di menu Manajemen Stok.
          </div>
        ) : (
          filtered.map((b) => {
            const sisa = hariSampaiExpired(b.expired);
            const danger = sisa <= 3;
            const low = b.stok < 5;
            return (
              <div
                key={b.id}
                className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-12 sm:items-center"
              >
                <div className="col-span-2 font-medium sm:col-span-5">{b.nama}</div>
                <div className="col-span-1 sm:col-span-2">
                  <span className={low ? "font-semibold text-destructive" : ""}>{b.stok}</span>
                </div>
                <div className="col-span-1 sm:col-span-3">{formatRupiah(b.hargaJual)}</div>
                <div className="col-span-2 text-sm sm:col-span-2">
                  <span className={danger ? "font-semibold text-destructive" : ""}>
                    {b.expired}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({sisa < 0 ? "expired" : `${sisa}h`})
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "warning" | "danger";
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "warning"
        ? "bg-[var(--warning)] text-[var(--warning-foreground)]"
        : "bg-destructive text-destructive-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneCls}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate text-lg font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
