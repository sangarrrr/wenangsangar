import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — Toko Sembako" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [namaToko, setNamaToko] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user && namaToko.trim()) {
          await supabase
            .from("profiles")
            .update({ nama_toko: namaToko.trim() })
            .eq("id", data.user.id);
        }
        toast.success("Akun berhasil dibuat! Silakan cek email untuk konfirmasi.");
        if (data.session) navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berhasil masuk.");
        navigate({ to: "/" });
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal");
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Gagal sign-in Google");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message || "Gagal");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Toko Sembako</h1>
          <p className="text-xs text-muted-foreground">
            {mode === "login" ? "Masuk ke akun toko Anda" : "Daftar akun baru"}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          <button
            onClick={() => setMode("login")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              mode === "login" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              mode === "register" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <input
              placeholder="Nama Toko"
              value={namaToko}
              onChange={(e) => setNamaToko(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          atau
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={loginGoogle}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent"
        >
          <svg className="h-4 w-4" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2c-.4.4 6.7-4.9 6.7-14.9 0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          Masuk dengan Google
        </button>
      </div>
    </div>
  );
}
