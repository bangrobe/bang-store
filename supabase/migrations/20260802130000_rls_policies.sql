-- Migration: Enable RLS + policies for Bang Store tables
-- Policy: Boss and AI account are the only two users with access
-- AI account uses a fixed auth.uid() value; Boss uses his own auth.uid()
-- Both users can read/write all data in the Bang Store project
-- ============================================================

-- Helper: check if current user is an authorized user (Boss or AI)
CREATE OR REPLACE FUNCTION public.is_authorized_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid() IN (
    -- Replace these with the actual auth UIDs of Boss and the AI account
    -- Example: 'a1b2c3d4-...', 'e5f6g7h8-...'
    -- TODO: Update with real UIDs from Supabase Auth → Users
    'REPLACE_WITH_BOSS_UID',
    'REPLACE_WITH_AI_UID'
  );
END;
$$;

-- ============================================================
-- Products
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read products" ON public.products
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update products" ON public.products
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete products" ON public.products
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Customers
-- ============================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read customers" ON public.customers
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert customers" ON public.customers
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update customers" ON public.customers
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete customers" ON public.customers
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Suppliers
-- ============================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read suppliers" ON public.suppliers
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update suppliers" ON public.suppliers
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete suppliers" ON public.suppliers
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Orders
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read orders" ON public.orders
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update orders" ON public.orders
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete orders" ON public.orders
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Order Lines
-- ============================================================
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read order lines" ON public.order_lines
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert order lines" ON public.order_lines
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update order lines" ON public.order_lines
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete order lines" ON public.order_lines
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Purchase Orders
-- ============================================================
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read purchase orders" ON public.purchase_orders
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert purchase orders" ON public.purchase_orders
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update purchase orders" ON public.purchase_orders
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete purchase orders" ON public.purchase_orders
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Purchase Order Lines
-- ============================================================
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read PO lines" ON public.purchase_order_lines
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert PO lines" ON public.purchase_order_lines
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update PO lines" ON public.purchase_order_lines
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete PO lines" ON public.purchase_order_lines
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Business Transactions (sync bridge)
-- ============================================================
ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read business transactions" ON public.business_transactions
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert business transactions" ON public.business_transactions
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update business transactions" ON public.business_transactions
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete business transactions" ON public.business_transactions
  FOR DELETE USING (public.is_authorized_user());

-- ============================================================
-- Inventory Log
-- ============================================================
ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can read inventory log" ON public.inventory_log
  FOR SELECT USING (public.is_authorized_user());

CREATE POLICY "Authorized users can insert inventory log" ON public.inventory_log
  FOR INSERT WITH CHECK (public.is_authorized_user());

CREATE POLICY "Authorized users can update inventory log" ON public.inventory_log
  FOR UPDATE USING (public.is_authorized_user());

CREATE POLICY "Authorized users can delete inventory log" ON public.inventory_log
  FOR DELETE USING (public.is_authorized_user());