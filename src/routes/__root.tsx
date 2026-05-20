import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hydrateAll, clearCache, isOwner } from "@/lib/storage";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import { Layout } from "../components/Layout";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ERP Toko" },
      { name: "description", content: "Sebuah alat bantu untuk manajerial toko menjadi lebih baik" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "ERP Toko" },
      { property: "og:description", content: "Sebuah alat bantu untuk manajerial toko menjadi lebih baik" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "ERP Toko" },
      { name: "twitter:description", content: "Sebuah alat bantu untuk manajerial toko menjadi lebih baik" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/52a3cb6c-7e5f-453d-8cc7-eff6e75a9e9a" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/52a3cb6c-7e5f-453d-8cc7-eff6e75a9e9a" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";
  const [status, setStatus] = useState<"checking" | "authed" | "anon">("checking");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setStatus("authed");
        hydrateAll().then(() => setHydrated(true)).catch((e) => {
          console.error("[hydrate] gagal:", e);
          setHydrated(true);
        });
      } else {
        clearCache();
        setHydrated(false);
        setStatus("anon");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("authed");
        hydrateAll().then(() => setHydrated(true)).catch(() => setHydrated(true));
      } else {
        setStatus("anon");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (status === "anon" && !isLogin) navigate({ to: "/login" });
    if (status === "authed" && isLogin) navigate({ to: "/" });
  }, [status, isLogin, navigate]);

  // Role-based route guard: karyawan hanya boleh akses /kasir & /stok
  useEffect(() => {
    if (status !== "authed" || !hydrated) return;
    if (isOwner()) return;
    const allowed = ["/kasir", "/stok", "/login"];
    if (!allowed.includes(location.pathname)) {
      toast.error("Akses ditolak. Halaman ini khusus Owner.");
      navigate({ to: "/kasir" });
    }
  }, [status, hydrated, location.pathname, navigate]);

  if (isLogin) return <Outlet />;
  if (status === "checking" || (status === "authed" && !hydrated)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Memuat data toko…
      </div>
    );
  }
  if (status === "anon") return null;
  return <Layout />;
}
