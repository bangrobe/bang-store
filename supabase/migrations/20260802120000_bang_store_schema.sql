-- ============================================================
-- Bang Store — Supabase Schema (migration)
-- Generated from frontend types (src/lib/types.ts) and mock data
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE public.product_status AS ENUM ('active', 'discontinued');
CREATE TYPE public.payment_method AS ENUM ('cash', 'transfer', 'both');
CREATE TYPE public.sync_status AS ENUM ('pending', 'synced', 'failed', 'skipped');
CREATE TYPE public.order_source AS ENUM ('pos', 'online', 'whatsapp', 'zalo');

-- ============================================================
-- Tables
-- ============================================================

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  category         text NOT NULL,
  sku              text NOT NULL UNIQUE,
  barcode          text NOT NULL UNIQUE,
  brand            text NOT NULL,
  compatible_devices text[] NOT NULL DEFAULT '{}',
  color            text,
  images           jsonb NOT NULL DEFAULT '[]'::jsonb,
  date_import      date NOT NULL,
  price_in         numeric(12, 0) NOT NULL,
  price_out        numeric(12, 0) NOT NULL,
  stock_qty        integer NOT NULL DEFAULT 0,
  min_stock        integer NOT NULL DEFAULT 0,
  status           product_status NOT NULL DEFAULT 'active',
  vat              boolean NOT NULL DEFAULT false,
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON public.products (stock_qty, min_stock) WHERE stock_qty < min_stock;

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  phone      text NOT NULL,
  note       text,
  created_at date NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  phone      text NOT NULL,
  note       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders (POS sales)
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_time       timestamptz NOT NULL DEFAULT now(),
  total            numeric(12, 0) NOT NULL DEFAULT 0,
  actual_total     numeric(12, 0),
  payment_method   payment_method NOT NULL DEFAULT 'cash',
  note             text,
  customer_id      uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  source           order_source NOT NULL DEFAULT 'pos',
  sync_status      sync_status NOT NULL DEFAULT 'pending',
  synced_at        timestamptz,
  sync_error       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_time ON public.orders (order_time);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders (payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_sync ON public.orders (sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders (source);

-- Order Lines
CREATE TABLE IF NOT EXISTS public.order_lines (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES public.products (id),
  product_name   text NOT NULL,
  qty            integer NOT NULL CHECK (qty > 0),
  unit_price     numeric(12, 0) NOT NULL,
  line_total     numeric(12, 0) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_lines_order ON public.order_lines (order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_product ON public.order_lines (product_id);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_date          date NOT NULL DEFAULT CURRENT_DATE,
  supplier_id      uuid NOT NULL REFERENCES public.suppliers (id),
  total            numeric(12, 0) NOT NULL DEFAULT 0,
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON public.purchase_orders (po_date);

-- Purchase Order Lines
CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id    uuid NOT NULL REFERENCES public.purchase_orders (id) ON DELETE CASCADE,
  product_id           uuid NOT NULL REFERENCES public.products (id),
  product_name         text NOT NULL,
  qty                  integer NOT NULL CHECK (qty > 0),
  unit_price           numeric(12, 0) NOT NULL,
  line_total           numeric(12, 0) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_po_lines_po ON public.purchase_order_lines (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_lines_product ON public.purchase_order_lines (product_id);

-- ============================================================
-- Business Transactions (sync bridge to Finance App)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES public.orders (id),
  order_line_id       uuid NOT NULL REFERENCES public.order_lines (id),
  transaction_type    text NOT NULL,
  amount              numeric(14, 0) NOT NULL,
  transaction_date    date NOT NULL,
  category_id         uuid,
  category_name       text,
  account_id          uuid,
  account_name        text,
  scope_id            uuid,
  merchant_name       text,
  note                text,
  sync_status         sync_status NOT NULL DEFAULT 'pending',
  synced_at           timestamptz,
  sync_error          text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bt_order ON public.business_transactions (order_id);
CREATE INDEX IF NOT EXISTS bt_sync ON public.business_transactions (sync_status);
CREATE INDEX IF NOT EXISTS bt_date ON public.business_transactions (transaction_date);

-- ============================================================
-- Inventory Log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products (id),
  change_qty    integer NOT NULL,
  reason        text NOT NULL,
  reference_id  uuid,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS il_product ON public.inventory_log (product_id);
CREATE INDEX IF NOT EXISTS il_reason ON public.inventory_log (reason);
CREATE INDEX IF NOT EXISTS il_reference ON public.inventory_log (reference_id);

-- ============================================================
-- Triggers — auto updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_business_transactions_updated_at
  BEFORE UPDATE ON public.business_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Views
-- ============================================================
CREATE OR REPLACE VIEW public.daily_revenue AS
SELECT
  o.order_time::date AS date,
  COALESCE(SUM(o.total), 0) AS revenue,
  COUNT(o.id) AS orders
FROM public.orders o
GROUP BY o.order_time::date;

CREATE OR REPLACE VIEW public.stock_alerts AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.stock_qty,
  p.min_stock,
  (p.min_stock - p.stock_qty) AS deficit,
  p.category,
  p.status
FROM public.products p
WHERE p.stock_qty < p.min_stock AND p.status = 'active';

CREATE OR REPLACE VIEW public.sync_queue AS
SELECT
  bt.id AS bt_id,
  bt.order_id,
  bt.order_line_id,
  bt.transaction_type,
  bt.amount,
  bt.transaction_date,
  bt.category_name,
  bt.account_name,
  bt.merchant_name,
  bt.note,
  o.order_time,
  o.payment_method,
  c.name AS customer_name,
  c.phone AS customer_phone
FROM public.business_transactions bt
JOIN public.orders o ON o.id = bt.order_id
LEFT JOIN public.customers c ON c.id = o.customer_id
WHERE bt.sync_status = 'pending'
ORDER BY o.order_time ASC;