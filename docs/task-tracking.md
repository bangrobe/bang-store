# Bang Store — Task Tracking

> File tracking LOCAL — **không đẩy lên GitHub** (`.gitignore` loại trừ `*.md`)

## 📊 Tổng quan dự án
- **Repo GitHub**: https://github.com/bangrobe/bang-store
- **Supabase ref**: `tkkrivlemnwcdgaioyio`
- **Tech stack**: Next.js 16, Supabase, Tailwind CSS
- **Region**: Vietnam (Singapore recommended for Vercel deploy)

## ✅ Đã HOÀN THÀNH

### Supabase — Schema & Data
| Task | Mô tả | Trạng thái | Ngày |
|------|-------|-----------|------|
| Create bang-store schema migration | 9 bảng: products, customers, suppliers, orders, order_lines, purchase_orders, purchase_order_lines, business_transactions, inventory_log + enums | ✅ Applied | 2026-08-02 |
| Create sync bridge migration | business_transactions → personal-finance-app | ✅ Applied | 2026-08-02 |
| Apply RLS policies | is_authorized_user() — boss + AI manager only (2 UIDs) | ✅ Applied | 2026-08-02 |
| Finance RLS fix migration | | ✅ Applied | 2026-08-02 |
| Seed sample data | 20 products, 5 suppliers, 5 customers, 5 orders, 9 order_lines | ✅ Applied | 2026-08-02 |
| Add order_number column | Serial auto-tăng → format #ORD-0001 | ✅ Applied | 2026-08-02 |

### Frontend → Supabase
| Task | Mô tả | Trạng thái | Ngày |
|------|-------|-----------|------|
| Install @supabase/supabase-js + @supabase/ssr | | ✅ | 2026-08-02 |
| Create src/lib/supabase.ts | Browser client | ✅ | 2026-08-02 |
| Create src/types/database.ts | TS types | ✅ | 2026-08-02 |
| Create src/app/auth-guard.tsx | Client-side route guard | ✅ | 2026-08-02 |
| Create src/app/login/page.tsx | Supabase auth email/password | ✅ | 2026-08-02 |
| Update src/app/layout.tsx | Auth guard + redirect | ✅ | 2026-08-02 |
| Update dashboard/page.tsx | Fetch from Supabase, show #ORD-XXXX | ✅ | 2026-08-02 |
| Update orders/page.tsx | Fetch from Supabase | ✅ | 2026-08-02 |
| Update products/page.tsx | Fetch from Supabase + image type fix | ✅ | 2026-08-02 |
| Create products/[id]/page.tsx | Product detail (tránh lỗi "Không tìm thấy") | ✅ | 2026-08-02 |
| Update pos/page.tsx | Fetch products + cart scroll (200-350px) | ✅ | 2026-08-02 |
| Update customers/page.tsx | Fetch from Supabase + order history modal | ✅ | 2026-08-02 |

### UI / Bug Fixes
| Task | Mô tả | Trạng thái | Ngày |
|------|-------|-----------|------|
| Fix dashboard UUID → #ORD-XXXX | Thay vì hiện UUID, đã có order_number | ✅ | 2026-08-02 |
| Fix POS cart height | min-height 200px, max-height 350px, scroll khi overflow | ✅ | 2026-08-02 |
| Fix sidebar mobile luôn hiện | → hamburger toggle + overlay, chỉ ẩn trên mobile (md:block) | ✅ Done | 2026-08-03 |
| Sidebar full 100vh height | h-screen + overflow-y-auto | ✅ | 2026-08-02 |

### GitHub
| Task | Mô tả | Trạng thái | Ngày |
|------|-------|-----------|------|
| Create remote repo bangrobe/bang-store | | ✅ | 2026-08-02 |
| Initial push | Commit schema + frontend + migrations | ✅ | 2026-08-02 |
| Remove README.md + AGENTS.md + CLAUDE.md | Tất cả .md phải local-only | ✅ | 2026-08-03 |
| .gitignore updated | Exclude *.md + .env* | ✅ | 2026-08-03 |

### Verification
| Task | Mô tả | Trạng thái | Ngày |
|------|-------|-----------|------|
| tsc --noEmit | 0 lỗi | ✅ | 2026-08-02 |
| npm run build | PASS | ✅ | 2026-08-02 |
| Browser test (AI Manager login) | Dashboard, POS, Customers, Orders, Products | ✅ All pass | 2026-08-02 |
| GitHub API verify | 0 .md file trên remote | ✅ | 2026-08-03 |

## 🚧 ĐANG LÀM (nếu có)

> Trống — chờ Boss giao việc tiếp theo

## 📋 Pending / TODO

### Execution (ưu tiên cao)
- [x] Deploy Bang Store lên Vercel (region sin1) — ✅ Deployed 2026-08-03: https://bang-store.vercel.app
- [ ] Tích hợp realtime subscription (Supabase realtime) cho POS
- [x] Dashboard "Sản phẩm đã bán hôm nay" trả về 0 — ✅ Fixed 2026-08-03: aggregate SUM(qty) từ order_lines join orders (filter ngày hôm nay)

### Sync bridge (Bang Store → Finance App)
- [x] Trigger tự động tạo transaction khi insert bang_store_sync (personal-finance-app) — ✅ 2026-08-03: trigger `trg_auto_sync_to_tx` (BEFORE INSERT) → tạo `transactions` + cập nhật `balance_current`
- [ ] FDW connection sang personal-finance-app project
- [x] Test data flow thực tế — ✅ E2E verified 2026-08-03: transfer $500k → BIDV HKD +500k, cash unchanged

### Chọn khách hàng (hoàn thành)
- [x] POS: dropdown chọn khách hàng + modal thêm nhanh (name/phone/note) — ✅ 2026-08-03
- [x] POS: gán customer_id vào orders khi checkout — ✅ 2026-08-03
- [x] POS: set account_name='BIDV HKD' cho transfer payment method — ✅ 2026-08-03
- [x] Orders: hiển thị khách hàng trong bảng + chi tiết đơn + filter theo khách hàng — ✅ 2026-08-03

### UI/UX cải thiện
- [ ] Mobile view testing chi tiết (hamburger toggle, overlay click-outside)
- [ ] Add loading skeleton cho các trang fetch

## 🔐 Credentials (REDACTED)
- .env.local: NEXT_PUBLIC_SUPABASE_URL=/ANON_KEY (gitignored)
- AI Manager: bangdigitech121@gmail.com / Hermes@2026
- Boss UID: b2096e3e-447d-45b9-8c9c-d17f577a97fa
- AI Manager UID: 2182cffb-112b-4d72-a407-20abdf5f4875

## 📅 Lịch sử commit
| Commit | Nội dung | Ngày |
|--------|---------|------|
| 01072af | Remove AGENTS.md + CLAUDE.md templates | 2026-08-03 |
| 7c8674f | Remove README.md from repository | 2026-08-03 |
| e2da3ef | Connect Bang Store frontend to Supabase + fix UI bugs | 2026-08-02 |
| 5201dc1 | Initial commit from Create Next App | 2026-08-02 |
