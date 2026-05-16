
-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nama_toko text,
  alamat_toko text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ PRODUCTS ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama_barang text not null,
  kategori text not null default 'Lainnya',
  stok_awal integer not null default 0,
  stok integer not null default 0,
  harga_beli numeric not null default 0,
  margin_persen numeric not null default 0,
  harga_jual numeric not null default 0,
  expired_date date,
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "own products select" on public.products for select using (auth.uid() = user_id);
create policy "own products insert" on public.products for insert with check (auth.uid() = user_id);
create policy "own products update" on public.products for update using (auth.uid() = user_id);
create policy "own products delete" on public.products for delete using (auth.uid() = user_id);

-- ============ CUSTOMERS ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  telepon text,
  total_piutang numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.customers enable row level security;
create policy "own customers select" on public.customers for select using (auth.uid() = user_id);
create policy "own customers insert" on public.customers for insert with check (auth.uid() = user_id);
create policy "own customers update" on public.customers for update using (auth.uid() = user_id);
create policy "own customers delete" on public.customers for delete using (auth.uid() = user_id);

-- ============ TRANSACTIONS ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  nama_produk text not null,
  quantity integer not null,
  harga_jual_satuan numeric not null,
  harga_beli_satuan numeric not null,
  total_harga numeric not null,
  profit numeric not null,
  metode_pembayaran text not null check (metode_pembayaran in ('Cash','Piutang')),
  customer_id uuid references public.customers(id) on delete set null,
  batch_id text,
  jumlah_retur integer not null default 0,
  status_retur text default 'Lunas',
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "own trx select" on public.transactions for select using (auth.uid() = user_id);
create policy "own trx insert" on public.transactions for insert with check (auth.uid() = user_id);
create policy "own trx update" on public.transactions for update using (auth.uid() = user_id);
create policy "own trx delete" on public.transactions for delete using (auth.uid() = user_id);

-- ============ RECEIVABLES (piutang) ============
create table public.receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  nama_pelanggan text not null,
  telepon text,
  total_hutang numeric not null,
  sisa_hutang numeric not null,
  jatuh_tempo date not null,
  status text not null default 'Belum Lunas' check (status in ('Belum Lunas','Cicilan','Lunas')),
  cicilan jsonb not null default '[]'::jsonb,
  catatan text,
  created_at timestamptz not null default now()
);
alter table public.receivables enable row level security;
create policy "own rec select" on public.receivables for select using (auth.uid() = user_id);
create policy "own rec insert" on public.receivables for insert with check (auth.uid() = user_id);
create policy "own rec update" on public.receivables for update using (auth.uid() = user_id);
create policy "own rec delete" on public.receivables for delete using (auth.uid() = user_id);

-- ============ EXPENSES ============
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kategori text not null,
  jumlah numeric not null,
  bulan integer not null,
  tahun integer not null,
  keterangan text,
  tanggal timestamptz not null default now()
);
alter table public.expenses enable row level security;
create policy "own exp select" on public.expenses for select using (auth.uid() = user_id);
create policy "own exp insert" on public.expenses for insert with check (auth.uid() = user_id);
create policy "own exp update" on public.expenses for update using (auth.uid() = user_id);
create policy "own exp delete" on public.expenses for delete using (auth.uid() = user_id);

-- ============ RETURNS ============
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  batch_id text,
  product_id uuid references public.products(id) on delete set null,
  nama_produk text not null,
  jumlah_retur integer not null,
  refund_amount numeric not null,
  created_at timestamptz not null default now()
);
alter table public.returns enable row level security;
create policy "own ret select" on public.returns for select using (auth.uid() = user_id);
create policy "own ret insert" on public.returns for insert with check (auth.uid() = user_id);
create policy "own ret update" on public.returns for update using (auth.uid() = user_id);
create policy "own ret delete" on public.returns for delete using (auth.uid() = user_id);

-- Indexes
create index idx_products_user on public.products(user_id);
create index idx_trx_user_date on public.transactions(user_id, created_at desc);
create index idx_rec_user on public.receivables(user_id);
create index idx_exp_user_period on public.expenses(user_id, tahun, bulan);
create index idx_ret_user on public.returns(user_id);
create index idx_customers_user on public.customers(user_id);
