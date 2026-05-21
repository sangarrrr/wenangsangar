
-- 1) Tambah kolom audit created_by (nullable agar data lama tetap valid)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.receivables ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_by uuid;

-- 2) Helper: hindari recursion - reuse is_owner sudah ada

-- 3) PRODUCTS
DROP POLICY IF EXISTS "own products select" ON public.products;
DROP POLICY IF EXISTS "own products insert" ON public.products;
DROP POLICY IF EXISTS "own products update" ON public.products;
DROP POLICY IF EXISTS "own products delete" ON public.products;

CREATE POLICY "auth view products" ON public.products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update products" ON public.products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "owner delete products" ON public.products
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- 4) TRANSACTIONS
DROP POLICY IF EXISTS "own trx select" ON public.transactions;
DROP POLICY IF EXISTS "own trx insert" ON public.transactions;
DROP POLICY IF EXISTS "own trx update" ON public.transactions;
DROP POLICY IF EXISTS "own trx delete" ON public.transactions;

CREATE POLICY "auth view trx" ON public.transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert trx" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update trx" ON public.transactions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "owner delete trx" ON public.transactions
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- 5) RECEIVABLES
DROP POLICY IF EXISTS "own rec select" ON public.receivables;
DROP POLICY IF EXISTS "own rec insert" ON public.receivables;
DROP POLICY IF EXISTS "own rec update" ON public.receivables;
DROP POLICY IF EXISTS "own rec delete" ON public.receivables;

CREATE POLICY "auth view rec" ON public.receivables
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert rec" ON public.receivables
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update rec" ON public.receivables
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "owner delete rec" ON public.receivables
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- 6) EXPENSES
DROP POLICY IF EXISTS "own exp select" ON public.expenses;
DROP POLICY IF EXISTS "own exp insert" ON public.expenses;
DROP POLICY IF EXISTS "own exp update" ON public.expenses;
DROP POLICY IF EXISTS "own exp delete" ON public.expenses;

CREATE POLICY "auth view exp" ON public.expenses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert exp" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update exp" ON public.expenses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "owner delete exp" ON public.expenses
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- 7) RETURNS
DROP POLICY IF EXISTS "own ret select" ON public.returns;
DROP POLICY IF EXISTS "own ret insert" ON public.returns;
DROP POLICY IF EXISTS "own ret update" ON public.returns;
DROP POLICY IF EXISTS "own ret delete" ON public.returns;

CREATE POLICY "auth view ret" ON public.returns
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert ret" ON public.returns
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update ret" ON public.returns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "owner delete ret" ON public.returns
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- 8) CUSTOMERS
DROP POLICY IF EXISTS "own customers select" ON public.customers;
DROP POLICY IF EXISTS "own customers insert" ON public.customers;
DROP POLICY IF EXISTS "own customers update" ON public.customers;
DROP POLICY IF EXISTS "own customers delete" ON public.customers;

CREATE POLICY "auth view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update customers" ON public.customers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "owner delete customers" ON public.customers
  FOR DELETE TO authenticated USING (public.is_owner(auth.uid()));

-- 9) PROFILES: izinkan semua auth user melihat email + nama_toko (untuk label "dicatat oleh")
CREATE POLICY "auth view profiles basic" ON public.profiles
  FOR SELECT TO authenticated USING (true);
