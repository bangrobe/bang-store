-- ============================================================
-- Bang Store — Auto sync trigger: bang_store_sync → business_transactions
-- Date: 2026-08-03
--
-- Khi insert bang_store_sync với sync_status = 'pending', trigger tự động:
-- 1. Resolve scope_id → financial_scopes (code = 'business')
-- 2. Map category_name → categories (scope business, type income)
--    - nếu chưa có → tự động tạo category trong group "Thu nhập cửa hàng"
-- 3. Map account:
--    - transfer → BIDV HKD (tìm account theo tên hoặc currency = 'HKD')
--    - cash / both → tài khoản cash đầu tiên
-- 4. Tạo business_transactions record
-- 5. Update bang_store_sync: sync_status = 'synced', set category_id + account_id
-- ============================================================

-- ============================================================
-- 1. Helper: resolve scope_id (business scope by user_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_business_scope(p_user_id text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_scope_id uuid;
BEGIN
  SELECT id INTO v_scope_id
  FROM public.financial_scopes
  WHERE user_id = p_user_id
    AND code = 'business'
  LIMIT 1;
  RETURN v_scope_id;
END;
$$;

-- ============================================================
-- 2. Helper: resolve / auto-create category
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_bang_store_category(
  p_scope_id uuid,
  p_category_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_id uuid;
  v_group_id uuid;
BEGIN
  -- Try existing category in scope
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE scope_id = p_scope_id
    AND name = p_category_name
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    RETURN v_category_id;
  END IF;

  -- Auto-create: find or create "Thu nhập cửa hàng" group
  SELECT id INTO v_group_id
  FROM public.category_groups
  WHERE scope_id = p_scope_id
    AND name = 'Thu nhập cửa hàng'
  LIMIT 1;

  IF v_group_id IS NULL THEN
    INSERT INTO public.category_groups (scope_id, name, type, sort_order)
    VALUES (p_scope_id, 'Thu nhập cửa hàng', 'income', 0)
    RETURNING id INTO v_group_id;
  END IF;

  -- Create the missing category
  INSERT INTO public.categories (scope_id, group_id, name, type)
  VALUES (p_scope_id, v_group_id, p_category_name, 'income')
  RETURNING id INTO v_category_id;

  RETURN v_category_id;
END;
$$;

-- ============================================================
-- 3. Helper: resolve account based on payment method
--    transfer → BIDV HKD
--    cash / both → first cash account
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_bang_store_account(
  p_scope_id uuid,
  p_payment_method text
)
RETURNS TABLE (account_id uuid, account_name text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_account_id uuid;
  v_account_name text;
BEGIN
  IF p_payment_method = 'transfer' THEN
    -- Prefer exact name match, then fall back to HKD currency
    SELECT id, name INTO v_account_id, v_account_name
    FROM public.accounts
    WHERE scope_id = p_scope_id
      AND (LOWER(name) ILIKE '%bidv%hkd%' OR LOWER(currency) = 'hkd')
    LIMIT 1;

    IF v_account_id IS NULL THEN
      -- Fallback: first account with HKD currency
      SELECT id, name INTO v_account_id, v_account_name
      FROM public.accounts
      WHERE scope_id = p_scope_id
        AND LOWER(currency) = 'hkd'
      LIMIT 1;
    END IF;

    IF v_account_id IS NULL THEN
      -- Last resort: any account in scope
      SELECT id, name INTO v_account_id, v_account_name
      FROM public.accounts
      WHERE scope_id = p_scope_id
      LIMIT 1;
    END IF;
  ELSE
    -- cash / both → first cash-type account (or any account)
    SELECT id, name INTO v_account_id, v_account_name
    FROM public.accounts
    WHERE scope_id = p_scope_id
      AND LOWER(account_type) = 'cash'
    LIMIT 1;

    IF v_account_id IS NULL THEN
      SELECT id, name INTO v_account_id, v_account_name
      FROM public.accounts
      WHERE scope_id = p_scope_id
      LIMIT 1;
    END IF;
  END IF;

  RETURN QUERY SELECT v_account_id, v_account_name;
END;
$$;

-- ============================================================
-- 4. Trigger function: create business_transaction from sync insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_auto_sync_to_tx()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_scope_id uuid;
  v_category_id uuid;
  v_account_id uuid;
  v_account_name text;
  v_order_payment_method text;
BEGIN
  -- Only act on new pending records
  IF TG_OP != 'INSERT' OR NEW.sync_status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Resolve scope
  v_scope_id := public.resolve_business_scope(NEW.user_id);

  -- Resolve category (auto-create if needed)
  IF NEW.category_name IS NOT NULL AND v_scope_id IS NOT NULL THEN
    BEGIN
      v_category_id := public.resolve_bang_store_category(v_scope_id, NEW.category_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Category resolve failed for %: %', NEW.category_name, SQLERRM;
    END;
  END IF;

  -- Resolve account based on payment method recorded on the source order
  -- Look up payment_method from orders table via bang_store_order_id
  SELECT payment_method INTO v_order_payment_method
  FROM public.orders
  WHERE id = NEW.bang_store_order_id
  LIMIT 1;

  IF v_scope_id IS NOT NULL THEN
    SELECT account_id, account_name
    INTO v_account_id, v_account_name
    FROM public.resolve_bang_store_account(v_scope_id, v_order_payment_method);
  END IF;

  -- Insert business transaction
  INSERT INTO public.business_transactions (
    order_id,
    order_line_id,
    transaction_type,
    amount,
    transaction_date,
    category_id,
    category_name,
    account_id,
    account_name,
    scope_id,
    merchant_name,
    note,
    sync_status,
    synced_at
  ) VALUES (
    NEW.bang_store_order_id,
    NEW.bang_store_line_id,
    NEW.transaction_type,
    NEW.amount,
    NEW.transaction_date,
    v_category_id,
    NEW.category_name,
    v_account_id,
    v_account_name,
    v_scope_id,
    NEW.merchant_name,
    NEW.note,
    'synced',
    now()
  );

  -- Mark sync record as synced
  NEW.sync_status := 'synced';
  NEW.category_id := v_category_id;
  NEW.account_id := v_account_id;
  NEW.synced_at := now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Record error but don't block the insert
    NEW.sync_status := 'failed';
    NEW.sync_error := SQLERRM;
    -- Still try to update the bss row (can't modify NEW after exception in AFTER trigger,
    -- so we do a separate UPDATE)
    UPDATE public.bang_store_sync
    SET sync_status = 'failed',
        sync_error = SQLERRM,
        updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 5. Attach trigger to bang_store_sync
-- ============================================================
DROP TRIGGER IF EXISTS trg_auto_sync_to_tx ON public.bang_store_sync;
CREATE TRIGGER trg_auto_sync_to_tx
  AFTER INSERT ON public.bang_store_sync
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_auto_sync_to_tx();
