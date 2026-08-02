# Bang Store — Quản lý cửa hàng phụ kiện

> Hệ thống POS phụ kiện điện thoại, tích hợp Supabase thời gian thực.

## Quick Start

```bash
# Cài đặt
npm install

# Chạy dev server
npm run dev
# → http://localhost:3000

# Build production
npm run build
```

## Tài khoản mẫu (test)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| **AI Manager** | bangdigitech121@gmail.com | `Hermes@2026` |
| **Boss** | bangdigi.net@gmail.com | [mật khẩu Supabase của Boss] |

## Kiến trúc

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   └── login/          # Trang đăng nhập (Supabase auth)
│   ├── dashboard/          # Thống kê doanh thu, đơn gần đây, cảnh báo tồn kho
│   ├── products/           # Danh sách + chi tiết sản phẩm
│   ├── orders/             # Danh sách đơn hàng (tìa-ko, lọc, chi tiết modal)
│   ├── pos/                # Máy bán hàng (POS) — giỏ hàng realtime
│   ├── customers/          # Quản lý khách hàng — lịch sử đơn hàng modal
│   ├── auth-guard.tsx      # Bảo vệ route (redirect về / nếu chưa login)
│   └── layout.tsx          # Root layout — sidebar full-viewport
├── components/
│   ├── layout/sidebar.tsx  # Sidebar điều hướng (full 100vh)
│   └── ui/                 # Các component UI cơ bản (Card, Button, Badge, Modal...)
├── lib/
│   ├── supabase.ts         # Supabase browser client (@supabase/ssr)
│   ├── utils.ts            # Helpers (formatVND, formatDateVN...)
│   └── mock.ts             # Legacy mock data (giữ lại để tham khảo)
└── types/
    └── database.ts         # TypeScript types từ Supabase schema
supabase/
└── migrations/           # Migration SQL (schema + RLS + sample data)
```

## Cấu hình môi trường

File `.env.local` (được gitignore):

```ini
NEXT_PUBLIC_SUPABASE_URL=https://tkkrivlemnwcdgaioyio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-public-key]
```

## RLS (Row-Level Security)

Mọi bảng đều bật RLS với hàm `is_authorized_user()`:

```sql
-- Chỉ 2 user được phép
auth.uid() IN (
  'b2096e3e-447d-45b9-8c9c-d17f577a97fa',  -- Boss (bangdigi.net@gmail.com)
  '2182cffb-112b-4d72-a407-20abdf5f4875'   -- AI Manager (bangdigitech121@gmail.com)
)
```

## Sync với Personal Finance App

Bang Store đồng bộ dữ liệu sang `personal-finance-app` qua bảng
`business_transactions`. Khi tạo đơn hàng mới, trigger tự động chèn bản ghi
vào `business_transactions` để app tài chính ghi nhận giao dịch.

- Supabase Bang Store: `tkkrivlemnwcdgaioyio`
- Supabase Finance App: dự án riêng (liên kết qua foreign data wrapper)

## Các trang chính

| Route | Mô tả |
|-------|-------|
| `/` | Login |
| `/dashboard` | Thống kê nhanh: doanh thưa hôm nay, đơn, hàng sắp hết, đơn gần đây (#ORD-XXXX) |
| `/products` | Danh sách sản phẩm — tìa-ko, lọc theo danh mục |
| `/products/[id]` | Chi tiết sản phẩm — fetch từ Supabase |
| `/orders` | Danh sách đơn hàng — tìa-ko theo mã đơn, lọc theo thanh toán/ngày |
| `/pos` | Máy bán hàng — thêm sản phẩm vào giỏ, tính tổng, thanh toán |
| `/customers` | Khách hàng — click mở modal lịch sử đơn hàng + chi tiết từng mặt hàng |

## Migration files

| File | Nội dụng |
|------|----------|
| `20260802120000_bang_store_schema.sql` | Tạo 9 bảng + enums + views + triggers |
| `20260802130000_rls_policies.sql` | RLS policies + `is_authorized_user()` function |
| `20260802150000_seed_data.sql` | Dữ liệu mẫu 20 products, 5 suppliers, 5 customers, 5 orders |
| `20260802160000_add_order_number.sql` | Thêm cột `order_number` (serial) cho bảng orders |

## Known Issues / TODO

- Tích hợp sync trigger thực tế (currently seeded manually)
- Tích hợp realtime subscription (Supabase realtime) cho giỏ hàng POS
- Dashboard "Sản phẩm đã bán hôm nay" currently trả về 0 — cần aggregate từ order_lines
