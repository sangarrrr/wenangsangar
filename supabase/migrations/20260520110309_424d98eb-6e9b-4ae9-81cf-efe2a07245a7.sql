
-- 1. Tambah kolom role ke profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner'
  CHECK (role IN ('owner', 'karyawan'));

-- 2. Security definer function (hindari recursive RLS)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'owner'
  );
$$;

-- 3. Tambahkan policy: owner bisa SELECT semua profiles (untuk manajemen user)
DROP POLICY IF EXISTS "owners can view all profiles" ON public.profiles;
CREATE POLICY "owners can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_owner(auth.uid()));

-- 4. Owner boleh update role user lain
DROP POLICY IF EXISTS "owners can update any profile role" ON public.profiles;
CREATE POLICY "owners can update any profile role"
  ON public.profiles FOR UPDATE
  USING (public.is_owner(auth.uid()));
