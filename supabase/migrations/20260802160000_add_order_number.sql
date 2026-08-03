-- ============================================================
-- Bang Store — Add order_number (serial) to orders
-- Task: Đánh số đơn hàng tự tăng, format #ORD-0001
-- Date: 2026-08-02
-- NOTE: Migration này đã được apply trực tiếp lên DB trước đó;
-- file này tái tạo lại cho repo (idempotent — chạy lại không lỗi).
-- ============================================================

-- 1. Sequence cho order_number
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- 2. Cột order_number (nullable trước, backfill sau)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number integer;

-- 3. Default = nextval (serial behavior)
ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT nextval('public.order_number_seq'::regclass);

-- 4. Backfill các đơn cũ chưa có số
UPDATE public.orders
SET order_number = nextval('public.order_number_seq')
WHERE order_number IS NULL;

-- 5. Unique index (ngăn trùng số đơn)
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique
  ON public.orders (order_number);
