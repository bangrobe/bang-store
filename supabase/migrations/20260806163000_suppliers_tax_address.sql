-- ============================================================
-- Bang Store — add supplier tax/address fields (from THD invoice)
-- ============================================================
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS tax_code text,
  ADD COLUMN IF NOT EXISTS address  text;

-- Backfill THD Trading from the vendor invoice attachment
UPDATE public.suppliers
SET
  name    = 'Công ty TNHH Kinh doanh Thương mại THD Việt Nam',
  tax_code = '0111314971',
  address  = 'Số 2, Ngõ 48 Phố Ngọc Trì, Phường Long Biên, Thành phố Hà Nội, Việt Nam',
  note     = 'Nhà cung cấp chính – hóa đơn VAT'
WHERE id = '441312cb-0fa1-41ec-97f1-28a8211aaf53';