
-- Add approval workflow columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('approved','pending_add','pending_delete')),
  ADD COLUMN IF NOT EXISTS requested_by UUID;

CREATE INDEX IF NOT EXISTS idx_products_approval_status
  ON public.products(approval_status);

-- Trigger: pada INSERT baru, owner langsung approved, karyawan jadi pending_add.
-- Tetap aman untuk upsert (update path) karena di-skip jika id sudah ada.
CREATE OR REPLACE FUNCTION public.set_product_approval_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Skip jika row dengan id tsb sudah ada (upsert/update path)
  IF NEW.id IS NOT NULL AND EXISTS (SELECT 1 FROM public.products WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();

  IF user_role IS NULL OR user_role = 'owner' THEN
    NEW.approval_status := 'approved';
  ELSE
    NEW.approval_status := 'pending_add';
  END IF;

  NEW.requested_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_product_status ON public.products;
CREATE TRIGGER trg_set_product_status
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_approval_status();
