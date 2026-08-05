-- ============================================================
-- Add supplier_id to products (FK → suppliers)
-- Date: 2026-08-05
-- ============================================================

-- 1. Add nullable FK column
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers (id) ON DELETE SET NULL;

-- 2. Index for joins/filtering
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products (supplier_id);

-- 3. Backfill from verified purchase history + brand-based mapping
--    THD Trading (441312cb-0fa1-41ec-97f1-28a8211aaf53): Remax products (verified PO)
--    HKD Phụ Kiện Bền (f4e7c92a-dac6-4589-87ab-b562f5b42659): hoco. (verified PO) + OG glass
UPDATE public.products SET supplier_id = '441312cb-0fa1-41ec-97f1-28a8211aaf53'
WHERE supplier_id IS NULL AND (brand = 'Remax' OR sku LIKE 'RC-%');

UPDATE public.products SET supplier_id = 'f4e7c92a-dac6-4589-87ab-b562f5b42659'
WHERE supplier_id IS NULL AND (brand = 'hoco.' OR brand = 'OG' OR sku = 'HOCO-X88');
