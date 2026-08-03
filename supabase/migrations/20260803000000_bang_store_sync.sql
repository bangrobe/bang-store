-- Migration: Add bang_store_sync table for Finance App sync bridge
-- Date: 2026-08-03
-- ============================================================

-- ============================================================
-- 1. Sync bridge table: receives transactions from Bang Store
--    to be pushed to Personal Finance App
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bang_store_sync (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bang_store_order_id uuid NOT NULL,
  bang_store_line_id  uuid NOT NULL,
  transaction_type    text NOT NULL,
  amount              numeric(14, 0) NOT NULL,
  transaction_date    date NOT NULL,
  category_id         uuid,
  category_name       text,
  account_id          uuid,
  account_name        text,
  scope_id            uuid NOT NULL,
  merchant_name       text,
  note                text,
  sync_status         text NOT NULL DEFAULT 'pending',
  synced_at           timestamptz,
  sync_error          text,
  synced_by           text,
  user_id             text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bss_order_idx ON public.bang_store_sync (bang_store_order_id);
CREATE INDEX IF NOT EXISTS bss_sync_idx ON public.bang_store_sync (sync_status);
CREATE INDEX IF NOT EXISTS bss_date_idx ON public.bang_store_sync (transaction_date);
CREATE INDEX IF NOT EXISTS bss_scope_idx ON public.bang_store_sync (scope_id);
CREATE INDEX IF NOT EXISTS bss_category_idx ON public.bang_store_sync (category_id);
CREATE INDEX IF NOT EXISTS bss_account_idx ON public.bang_store_sync (account_id);
CREATE INDEX IF NOT EXISTS bss_user_idx ON public.bang_store_sync (user_id);

-- ============================================================
-- 2. View: pending sync queue
-- ============================================================
CREATE OR REPLACE VIEW public.bang_store_sync_queue AS
SELECT
  bss.id AS sync_id,
  bss.bang_store_order_id,
  bss.bang_store_line_id,
  bss.transaction_type,
  bss.amount,
  bss.transaction_date,
  bss.category_name,
  bss.account_name,
  bss.merchant_name,
  bss.note,
  bss.sync_status,
  bss.created_at AS synced_at_source
FROM public.bang_store_sync bss
WHERE bss.sync_status = 'pending'
ORDER BY bss.created_at ASC;

-- ============================================================
-- 3. Trigger: auto updated_at for bang_store_sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bang_store_sync_updated ON public.bang_store_sync;
CREATE TRIGGER trg_bang_store_sync_updated
  BEFORE UPDATE ON public.bang_store_sync
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. RPC: create a sync record from Bang Store order line
--    Called by Bang Store frontend after checkout
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_bang_store_order_line(
  p_order_id uuid,
  p_line_id uuid,
  p_user_id text,
  p_transaction_type text,
  p_amount numeric,
  p_transaction_date date,
  p_merchant_name text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_scope_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sync_id uuid;
  v_scope_id uuid;
BEGIN
  -- Resolve scope_id to business scope if not provided
  IF p_scope_id IS NULL THEN
    SELECT id INTO v_scope_id FROM public.financial_scopes WHERE code = 'business' LIMIT 1;
  ELSE
    v_scope_id := p_scope_id;
  END IF;

  INSERT INTO public.bang_store_sync (
    bang_store_order_id,
    bang_store_line_id,
    transaction_type,
    amount,
    transaction_date,
    merchant_name,
    note,
    scope_id,
    sync_status,
    synced_by,
    user_id
  )
  VALUES (
    p_order_id,
    p_line_id,
    p_transaction_type,
    p_amount,
    p_transaction_date,
    p_merchant_name,
    p_note,
    v_scope_id,
    'pending',
    p_user_id,
    p_user_id
  )
  RETURNING id INTO v_sync_id;

  RETURN v_sync_id;
END;
$$;

-- ============================================================
-- 5. RLS for new table
-- ============================================================
ALTER TABLE public.bang_store_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sync records" ON public.bang_store_sync
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own sync records" ON public.bang_store_sync
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own sync records" ON public.bang_store_sync
  FOR UPDATE USING (user_id = auth.uid()::text);