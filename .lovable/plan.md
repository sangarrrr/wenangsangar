## Ringkasan

Migrasi penuh aplikasi Toko Sembako dari `localStorage` ke **Lovable Cloud** (powered by Supabase) sehingga setiap pemilik toko punya akun sendiri dan datanya terisolasi via Row Level Security. UI tidak diubah, hanya layer data + tambahan halaman Login/Register.

> Catatan: di Lovable, backend disebut **Lovable Cloud**. Library `@supabase/supabase-js`, env `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, dan client di `src/integrations/supabase/client.ts` **sudah otomatis disediakan** saat Cloud aktif — tidak perlu install manual atau bikin `.env.example`.

---

## 1. Aktifkan Lovable Cloud

Akan otomatis menyediakan:
- Postgres database
- Auth (email/password + Google)
- Supabase client di `src/integrations/supabase/client.ts`
- Env vars terkonfigurasi

## 2. Skema Database (via migration)

Tabel yang dibuat:

| Tabel | Kolom utama |
|---|---|
| `profiles` | `id` (= auth.users.id), `email`, `nama_toko`, `alamat_toko`, `created_at` |
| `products` | `id`, `user_id`, `nama_barang`, `kategori`, `stok_awal`, `stok`, `harga_beli`, `margin_persen`, `harga_jual`, `expired_date` (nullable), `image_url`, `created_at` |
| `transactions` | `id`, `user_id`, `product_id`, `nama_produk`, `quantity`, `harga_jual_satuan`, `harga_beli_satuan`, `total_harga`, `profit`, `metode_pembayaran`, `customer_id`, `batch_id`, `jumlah_retur`, `status_retur`, `created_at` |
| `customers` | `id`, `user_id`, `nama`, `telepon`, `total_piutang`, `created_at` |
| `receivables` (piutang) | `id`, `user_id`, `transaction_id`, `customer_id`, `nama_pelanggan`, `telepon`, `total_hutang`, `sisa_hutang`, `jatuh_tempo`, `status`, `cicilan` (jsonb), `catatan`, `created_at` |
| `expenses` (pengeluaran) | `id`, `user_id`, `kategori`, `jumlah`, `bulan`, `tahun`, `keterangan`, `tanggal` |
| `returns` (retur) | `id`, `user_id`, `transaction_id`, `batch_id`, `product_id`, `nama_produk`, `jumlah_retur`, `refund_amount`, `created_at` |

> Saya perluas skema yang Anda berikan agar tetap mendukung fitur eksisting (margin, retur, batch, cicilan, kategori, gambar produk, dll) — tanpa itu fitur Kasir/Stok/Piutang/Retur yang sudah ada akan rusak.

**RLS** diaktifkan di semua tabel dengan pola standar:

```sql
alter table public.products enable row level security;

create policy "users select own products"
  on public.products for select
  using (auth.uid() = user_id);

create policy "users insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "users update own products"
  on public.products for update
  using (auth.uid() = user_id);

create policy "users delete own products"
  on public.products for delete
  using (auth.uid() = user_id);
```

Pola yang sama diterapkan ke `customers`, `transactions`, `receivables`, `expenses`, `returns`. `profiles` pakai `auth.uid() = id`.

**Trigger auto-create profile** saat user signup:

```sql
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 3. Authentication

- Halaman baru: `/login` (login + register dalam satu page bertab) — email/password + Google OAuth.
- Pathless layout `_authenticated.tsx` untuk proteksi seluruh halaman app (Dashboard, Kasir, Stok, Piutang, Laporan).
- Listener `onAuthStateChange` di `__root.tsx` untuk invalidate router & React Query saat login/logout.
- Tombol Logout + nama toko di `Layout.tsx` (perubahan minimal, tidak mengubah tampilan utama).

## 4. Refaktor Data Layer

`src/lib/storage.ts` → diubah menjadi **wrapper async ke Supabase** dengan signature yang kompatibel sebisa mungkin. Karena banyak halaman pakai `useEffect(() => setItems(getBarang()), [])` secara sinkron, file ini akan saya rewrite menjadi:

- `src/lib/api/products.ts`, `api/transactions.ts`, `api/receivables.ts`, `api/expenses.ts`, `api/returns.ts`, `api/customers.ts` — semua async, otomatis pakai `auth.uid()` (lewat RLS, jadi `user_id` di-set dari `(await supabase.auth.getUser()).data.user.id`).
- Mapper row DB ↔ tipe TS lama (`Barang`, `Transaksi`, `Piutang`, `Pengeluaran`, `ReturLog`) supaya komponen UI tidak perlu banyak diubah.
- Helpers murni (`formatRupiah`, `hitungHargaJual`, `hariSampaiExpired`, `persenStok`, `statusStok`, `statusExpired`) tetap di `storage.ts`.

Tiap halaman diupdate untuk:
- `useEffect` async + state `loading` & `error`.
- Toast error jelas: `toast.error(error.message)`.
- Hapus seed dummy localStorage; ganti dengan empty state.
- Event `sembako-update` digantikan oleh re-fetch setelah mutasi (atau realtime channel sederhana — opsional).

## 5. File yang dibuat / diubah

**Baru:**
- `src/routes/login.tsx`
- `src/routes/_authenticated.tsx`
- `src/routes/_authenticated/index.tsx`, `kasir.tsx`, `stok.tsx`, `piutang.tsx`, `laporan.tsx` (pindah dari root)
- `src/lib/api/*.ts` (6 modul)
- Migration SQL (tabel + RLS + trigger)

**Diubah:**
- `src/routes/__root.tsx` — auth listener + invalidate
- `src/components/Layout.tsx` — tombol logout
- `src/lib/storage.ts` — disisakan helper pure, sisanya re-export dari `api/*`
- `package.json` — `@supabase/supabase-js` otomatis ditambahkan oleh Cloud

**Dihapus:**
- Route lama di root yang dipindah ke `_authenticated/`
- `seedDummyJikaKosong` (tidak relevan untuk multi-user)

## 6. Loading & Error Handling

- Halaman menampilkan skeleton/`"Memuat..."` saat fetch awal.
- Error fetch ditampilkan via `toast.error` + banner inline kecil.
- Auth gate: jika `getUser()` gagal, redirect `/login`.

## 7. Data Lama di localStorage

Tidak dimigrasikan otomatis (multi-user — data lama tidak punya pemilik). Setelah login pertama, app mulai dari kosong. Saya bisa tambahkan tombol opsional "Import data lokal lama" di Pengaturan nanti jika diperlukan — di luar scope task ini.

---

## Catatan teknis

- Akan pakai **Lovable Cloud** (bukan koneksi Supabase manual) → client otomatis di `src/integrations/supabase/client.ts`, env vars auto-set. Tidak butuh `.env.example`.
- Anda **tidak perlu** menjalankan SQL manual — migration dijalankan otomatis oleh tool migration.
- Google OAuth via Lovable broker (`lovable.auth.signInWithOAuth("google", ...)`).

Setujui plan ini untuk saya mulai eksekusi?
