# Sync Bridge: Bang Store → Personal Finance App

## Luồng hoạt động

Bang Store (POS bán lẻ) và Personal Finance App (quản lý tài chính) dùng chung Supabase project: `tkkrivlemnwcdgaioyio`.

### 1. Tự động: DB Trigger (ưu tiên)

```
Bang Store checkout (POS)
  → insert order + order_lines (bảng Bang Store)
  → insert bang_store_sync (sync_status = 'pending', kèm category_name)
    → [DB Trigger] trg_auto_sync_to_tx
      → tự động tạo transaction trong bảng transactions (Finance App scope)
      → update bang_store_sync: sync_status = 'synced'
```

**Thời gian**: milliseconds — realtime, không cần app online.

### 2. Thủ công: Nút manual buttons

| App | Vị trí | Tác vụ |
|---|---|---|
| **Bang Store** | Đơn hàng → Chi tiết → nút "🔄 Đồng bộ" | Push lại order lines lên queue |
| **Finance App** | Dashboard → nút "🔄 Đồng bộ Bang Store" | Kiểm tra queue còn record pending không |

---

## Chi tiết kỹ thuật

### Bảng `bang_store_sync`

```sql
CREATE TABLE public.bang_store_sync (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bang_store_order_id uuid NOT NULL,
  bang_store_line_id  uuid NOT NULL,
  transaction_type    text NOT NULL,         -- 'income' | 'expense'
  amount              numeric NOT NULL,
  transaction_date    date NOT NULL,
  category_id         uuid REFERENCES categories(id),    -- tự map sau khi sync
  category_name       text,                  -- danh mục sản phẩm gốc từ Bang Store
  account_id          uuid REFERENCES accounts(id),      -- tự map sau khi sync
  account_name        text,
  scope_id            uuid REFERENCES financial_scopes(id), -- NULL → trigger tự resolve
  merchant_name       text,
  note                text,
  sync_status         text DEFAULT 'pending', -- 'pending' | 'synced' | 'failed'
  synced_at           timestamptz,
  sync_error          text,
  synced_by           text,
  user_id             text NOT NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

### View `bang_store_sync_queue`

```sql
CREATE VIEW public.bang_store_sync_queue AS
SELECT
  id AS sync_id,
  bang_store_order_id,
  bang_store_line_id,
  transaction_type,
  amount,
  transaction_date,
  category_name,
  account_name,
  merchant_name,
  note,
  sync_status,
  created_at AS synced_at_source
FROM public.bang_store_sync
WHERE sync_status = 'pending';
```

### Trigger `trg_auto_sync_to_tx`

Khi insert dòng mới với `sync_status = 'pending'`, trigger tự động:

1. **Resolve scope**: tìm scope 'business' theo user_id
2. **Map category**: dùng `category_name` → tìm trong `categories` (scope business, income)
   - Nếu chưa có → **tự động tạo category mới** trong group "Thu nhập cửa hàng"
3. **Map account**: dùng `account_id` nếu có, fallback tài khoản cash đầu tiên
4. **Tạo transaction** trong bảng `transactions`
5. **Update** `bang_store_sync`: set `sync_status = 'synced'`, `category_id`, `account_id`

### Code push (Bang Store)

**Trang POS** (`src/app/pos/page.tsx`):
- `handleCheckout` trở thành async, insert order thật + order_lines + bang_store_sync
- Gửi `category_name: item.product.category` để map danh mục

**Trang Orders** (`src/app/orders/page.tsx`):
- `pushOrderToFinanceApp()` — insert sync record với tất cả thông tin
- `loadOrderDetail` — load thêm product category từ bảng `products`
- Nút "🔄 Đồng bộ" — thủ công push từng line

### Category mapping: Bang Store → Finance App

Category sản phẩm Bang Store trùng tên với các category income trong group **"Thu nhập cửa hàng"**:

| Bang Store (products.category) | Finance App (categories.name) |
|---|---|
| Cáp | Cáp |
| Củ sạc | Củ sạc |
| Kính cường lực | Kính cường lực |
| Ốp lưng | Ốp lưng |
| Pin dự phòng | Pin dự phòng |
| Tai nghe | Tai nghe |

---


