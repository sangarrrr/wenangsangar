import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingCart, Wallet, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { seedDummyJikaKosong } from "@/lib/storage";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stok", label: "Stok", icon: Package },
  { to: "/kasir", label: "Kasir", icon: ShoppingCart },
  { to: "/piutang", label: "Piutang", icon: Wallet },
  { to: "/laporan", label: "Laporan", icon: BarChart3 },
];

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    seedDummyJikaKosong();
  }, []);
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold text-primary md:text-lg">🛒 Toko Sembako</h1>
          <nav className="hidden gap-1 md:flex">
            {nav.map((n) => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-10 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {nav.map((n) => {
          const active = pathname === n.to;
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
