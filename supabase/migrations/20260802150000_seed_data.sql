-- ============================================================
-- Seed data for Bang Store (matching mock.ts)
-- Inserts in dependency order: suppliers → customers → products
-- then orders → order_lines → business_transactions
-- ============================================================

-- ============================================================
-- Suppliers
-- ============================================================
INSERT INTO public.suppliers (id, name, phone, note) VALUES
  ('6144876d-0001-4000-a000-000000000001', 'Công ty TNHH CaseMate Việt Nam', '028 3845 1234', 'Nhà cung cấp ốp lưng chính hãng'),
  ('6144876d-0001-4000-a000-000000000002', 'Anker Việt Nam', '028 3856 5678', 'Cáp, củ sạc, pin dự phòng'),
  ('6144876d-0001-4000-a000-000000000003', 'Cửa hàng phụ kiện TPHCM', '0908 123 456', 'Kính cường lực, ốp lưng giá sỉ'),
  ('6144876d-0001-4000-a000-000000000004', 'Sony Audio Việt Nam', '028 3920 7890', 'Tai nghe chính hãng Sony'),
  ('6144876d-0001-4000-a000-000000000005', 'Xiaomi Official Store', '028 3710 1111', 'Sản phẩm Xiaomi chính hãng')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Customers
-- ============================================================
INSERT INTO public.customers (id, name, phone, note, created_at) VALUES
  ('6144876d-0002-4000-a000-000000000001', 'Nguyễn Văn An', '0908 123 456', 'Khách quen, mua hàng thường xuyên', '2026-06-15'),
  ('6144876d-0002-4000-a000-000000000002', 'Trần Thị Bình', '0912 345 678', '', '2026-06-20'),
  ('6144876d-0002-4000-a000-000000000003', 'Lê Minh Cường', '0934 567 890', 'Mua sỉ, cần báo giá riêng', '2026-07-01'),
  ('6144876d-0002-4000-a000-000000000004', 'Phạm Thị Diệu', '0945 678 901', '', '2026-07-10'),
  ('6144876d-0002-4000-a000-000000000005', 'Hoàng Văn Eo', '0956 789 012', 'Khách doanh nghiệp', '2026-07-22')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Products (20 items matching mock.ts)
-- ============================================================
INSERT INTO public.products (id, name, category, sku, barcode, brand, compatible_devices, color, images, supplier_id, date_import, price_in, price_out, stock_qty, min_stock, status, vat, note) VALUES
  ('6144876d-0003-4000-a000-000000000001', 'Ốp lưng Silicon iPhone 15 Pro Max', 'Ốp lưng', 'CASE-IP15PM-001', '8901234567890', 'CaseMate', ARRAY['iPhone 15 Pro Max'], 'Đen', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Mặt trước"},{"url":"https://placehold.co/400x400/fef3c7/f59e0b?text=View2","alt":"Mặt sau"}]'::jsonb, '6144876d-0001-4000-a000-000000000001', '2026-07-15', 25000, 49000, 120, 20, 'active', true, 'Silicone mềm, chống sốc'),
  ('6144876d-0003-4000-a000-000000000002', 'Ốp lưng Leather Samsung S24 Ultra', 'Ốp lưng', 'CASE-S24U-002', '8901234567891', 'Nillkin', ARRAY['Samsung Galaxy S24 Ultra'], 'Nâu', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Ốp lưng Leather Samsung S24 Ultra"}]'::jsonb, '6144876d-0001-4000-a000-000000000001', '2026-07-18', 45000, 89000, 8, 15, 'active', true, 'Da thật cao cấp'),
  ('6144876d-0003-4000-a000-000000000003', 'Ốp lưng Trong suốt Xiaomi 14', 'Ốp lưng', 'CASE-X14-003', '8901234567892', 'Baseus', ARRAY['Xiaomi 14'], 'Trong suốt', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Ốp lưng Trong suốt Xiaomi 14"}]'::jsonb, '6144876d-0001-4000-a000-000000000003', '2026-07-20', 15000, 35000, 200, 30, 'active', false, NULL),
  ('6144876d-0003-4000-a000-000000000004', 'Cáp USB-C 2m tốc độ cao', 'Cáp', 'CBL-USBC-001', '8901234567893', 'Anker', ARRAY['Universal USB-C'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Cáp USB-C 2m"},{"url":"https://placehold.co/400x400/d1fae5/10b981?text=View3","alt":"Cáp USB-C 2m - Cận cảnh"}]'::jsonb, '6144876d-0001-4000-a000-000000000002', '2026-07-10', 18000, 45000, 55, 10, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000005', 'Cáp Lightning 1m chính hãng', 'Cáp', 'CBL-LIGHT-001', '8901234567894', 'Apple', ARRAY['iPhone 13/14/15'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Cáp Lightning 1m"}]'::jsonb, '6144876d-0001-4000-a000-000000000002', '2026-07-12', 35000, 79000, 3, 10, 'active', true, 'Hàng chính hãng Apple'),
  ('6144876d-0003-4000-a000-000000000006', 'Cáp Micro-USB 1.5m', 'Cáp', 'CBL-MICRO-001', '8901234567895', 'Baseus', ARRAY['Android cũ'], 'Đen', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Cáp Micro-USB 1.5m"}]'::jsonb, '6144876d-0001-4000-a000-000000000003', '2026-07-14', 8000, 22000, 180, 20, 'active', false, NULL),
  ('6144876d-0003-4000-a000-000000000007', 'Củ sạc nhanh 65W GaN', 'Củ sạc', 'CHG-65W-001', '8901234567896', 'Anker', ARRAY['Universal PD'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Củ sạc 65W GaN"},{"url":"https://placehold.co/400x400/fef3c7/f59e0b?text=View2","alt":"Củ sạc 65W GaN - Cận cảnh"}]'::jsonb, '6144876d-0001-4000-a000-000000000002', '2026-07-08', 180000, 350000, 40, 10, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000008', 'Củ sạc dự phòng 10000mAh', 'Củ sạc', 'CHG-PB10K-001', '8901234567897', 'Xiaomi', ARRAY['Universal'], 'Đen', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Pin dự phòng 10000mAh"}]'::jsonb, '6144876d-0001-4000-a000-000000000005', '2026-07-09', 120000, 249000, 25, 10, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000009', 'Củ sạc nhanh 30W USB-C', 'Củ sạc', 'CHG-30W-001', '8901234567898', 'Baseus', ARRAY['Universal PD'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Củ sạc 30W USB-C"}]'::jsonb, '6144876d-0001-4000-a000-000000000003', '2026-07-11', 95000, 189000, 60, 15, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000010', 'Tai nghe Bluetooth True Wireless TWS', 'Tai nghe', 'EAR-TWS-001', '8901234567899', 'Baseus', ARRAY['Universal Bluetooth'], 'Đen', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Tai nghe TWS"},{"url":"https://placehold.co/400x400/fef3c7/f59e0b?text=View2","alt":"Tai nghe TWS - Hộp"}]'::jsonb, '6144876d-0001-4000-a000-000000000003', '2026-07-22', 85000, 179000, 35, 10, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000011', 'Tai nghe Bluetooth cao cấp Sony WF-C700N', 'Tai nghe', 'EAR-SONY-001', '8901234567900', 'Sony', ARRAY['Universal Bluetooth'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Tai nghe Sony WF-C700N"}]'::jsonb, '6144876d-0001-4000-a000-000000000004', '2026-07-25', 450000, 899000, 5, 5, 'active', true, 'Hàng nhập khẩu chính hãng'),
  ('6144876d-0003-4000-a000-000000000012', 'Tai nghe có dây Lightning Apple', 'Tai nghe', 'EAR-LIGHT-001', '8901234567901', 'Apple', ARRAY['iPhone 15 trở lên'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Tai nghe có dây Lightning"}]'::jsonb, '6144876d-0001-4000-a000-000000000002', '2026-07-26', 300000, 599000, 18, 5, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000013', 'Kính cường lực Samsung S24 Ultra 2 lớp', 'Kính cường lực', 'GLASS-S24U-001', '8901234567902', 'ZAGG', ARRAY['Samsung Galaxy S24 Ultra'], 'Trong suốt', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Kính cường lực Samsung S24 Ultra"}]'::jsonb, '6144876d-0001-4000-a000-000000000003', '2026-07-16', 35000, 69000, 90, 15, 'active', false, NULL),
  ('6144876d-0003-4000-a000-000000000014', 'Kính cường lực iPhone 15 Pro Max', 'Kính cường lực', 'GLASS-IP15PM-001', '8901234567903', 'Spigen', ARRAY['iPhone 15 Pro Max'], 'Trong suốt', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Kính cường lực iPhone 15 Pro Max"}]'::jsonb, '6144876d-0001-4000-a000-000000000001', '2026-07-17', 28000, 55000, 2, 10, 'active', false, NULL),
  ('6144876d-0003-4000-a000-000000000015', 'Kính cường lực Xiaomi 14 Pro', 'Kính cường lực', 'GLASS-X14P-001', '8901234567904', 'Baseus', ARRAY['Xiaomi 14 Pro'], 'Trong suốt', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Kính cường lực Xiaomi 14 Pro"}]'::jsonb, '6144876d-0001-4000-a000-000000000003', '2026-07-19', 22000, 45000, 65, 10, 'active', false, NULL),
  ('6144876d-0003-4000-a000-000000000016', 'Pin dự phòng 20000mAh sạc nhanh', 'Pin dự phòng', 'PB-20K-001', '8901234567905', 'Anker', ARRAY['Universal PD'], 'Đen', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Pin dự phòng 20000mAh"},{"url":"https://placehold.co/400x400/d1fae5/10b981?text=View3","alt":"Pin dự phòng - Cổng sạc"}]'::jsonb, '6144876d-0001-4000-a000-000000000002', '2026-07-21', 280000, 549000, 15, 8, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000017', 'Pin dự phòng 10000mAh slim', 'Pin dự phòng', 'PB-10K-002', '8901234567906', 'Xiaomi', ARRAY['Universal'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Pin dự phòng 10000mAh slim"}]'::jsonb, '6144876d-0001-4000-a000-000000000005', '2026-07-23', 95000, 189000, 0, 10, 'discontinued', true, NULL),
  ('6144876d-0003-4000-a000-000000000018', 'Ốp lưng MagSafe iPhone 16', 'Ốp lưng', 'CASE-IP16-001', '8901234567907', 'Apple', ARRAY['iPhone 16'], 'Đen', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Ốp lưng MagSafe iPhone 16"}]'::jsonb, '6144876d-0001-4000-a000-000000000002', '2026-07-28', 85000, 169000, 50, 10, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000019', 'Cáp USB-C sang Lightning 2m', 'Cáp', 'CBL-CTR-001', '8901234567908', 'Anker', ARRAY['iPhone 13/14/15/16'], 'Trắng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Cáp USB-C sang Lightning"}]'::jsonb, '6144876d-0001-4000-a000-000000000002', '2026-07-29', 25000, 59000, 80, 15, 'active', true, NULL),
  ('6144876d-0003-4000-a000-000000000020', 'Củ sạc nhanh 45W GaN siêu nhỏ', 'Củ sạc', 'CHG-45W-002', '8901234567909', 'Baseus', ARRAY['Universal PD'], 'Hồng', '[{"url":"https://placehold.co/400x400/e0e7ff/6366f1?text=Product","alt":"Củ sạc 45W GaN"}]'::jsonb, '6144876d-0001-4000-a000-000000000003', '2026-07-30', 130000, 269000, 30, 10, 'active', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Orders (5 orders matching mockRecentOrders)
-- ============================================================
INSERT INTO public.orders (id, order_time, total, actual_total, payment_method, customer_id, source) VALUES
  ('6144876d-0004-4000-a000-000000000001', '2026-08-02T14:32:00+07:00', 143000, 143000, 'cash', '6144876d-0002-4000-a000-000000000001', 'pos'),
  ('6144876d-0004-4000-a000-000000000002', '2026-08-02T13:15:00+07:00', 350000, 350000, 'transfer', '6144876d-0002-4000-a000-000000000003', 'pos'),
  ('6144876d-0004-4000-a000-000000000003', '2026-08-02T11:48:00+07:00', 386000, 386000, 'cash', '6144876d-0002-4000-a000-000000000002', 'pos'),
  ('6144876d-0004-4000-a000-000000000004', '2026-08-02T10:20:00+07:00', 179000, 180000, 'both', '6144876d-0002-4000-a000-000000000004', 'pos'),
  ('6144876d-0004-4000-a000-000000000005', '2026-08-02T09:05:00+07:00', 287000, 287000, 'cash', '6144876d-0002-4000-a000-000000000005', 'pos')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Order Lines (matching mockRecentOrders items)
-- ============================================================
INSERT INTO public.order_lines (id, order_id, product_id, product_name, qty, unit_price, line_total) VALUES
  ('6144876d-0005-4000-a000-000000000001', '6144876d-0004-4000-a000-000000000001', '6144876d-0003-4000-a000-000000000001', 'Ốp lưng Silicon iPhone 15 Pro Max', 2, 49000, 98000),
  ('6144876d-0005-4000-a000-000000000002', '6144876d-0004-4000-a000-000000000001', '6144876d-0003-4000-a000-000000000004', 'Cáp USB-C 2m tốc độ cao', 1, 45000, 45000),
  ('6144876d-0005-4000-a000-000000000003', '6144876d-0004-4000-a000-000000000002', '6144876d-0003-4000-a000-000000000007', 'Củ sạc nhanh 65W GaN', 1, 350000, 350000),
  ('6144876d-0005-4000-a000-000000000004', '6144876d-0004-4000-a000-000000000003', '6144876d-0003-4000-a000-000000000013', 'Kính cường lực Samsung S24 Ultra 2 lớp', 3, 69000, 207000),
  ('6144876d-0005-4000-a000-000000000005', '6144876d-0004-4000-a000-000000000003', '6144876d-0003-4000-a000-000000000010', 'Tai nghe Bluetooth True Wireless TWS', 1, 179000, 179000),
  ('6144876d-0005-4000-a000-000000000006', '6144876d-0004-4000-a000-000000000004', '6144876d-0003-4000-a000-000000000002', 'Ốp lưng Leather Samsung S24 Ultra', 1, 89000, 89000),
  ('6144876d-0005-4000-a000-000000000007', '6144876d-0004-4000-a000-000000000004', '6144876d-0003-4000-a000-000000000015', 'Kính cường lực Xiaomi 14 Pro', 2, 45000, 90000),
  ('6144876d-0005-4000-a000-000000000008', '6144876d-0004-4000-a000-000000000005', '6144876d-0003-4000-a000-000000000018', 'Ốp lưng MagSafe iPhone 16', 1, 169000, 169000),
  ('6144876d-0005-4000-a000-000000000009', '6144876d-0004-4000-a000-000000000005', '6144876d-0003-4000-a000-000000000019', 'Cáp USB-C sang Lightning 2m', 2, 59000, 118000)
ON CONFLICT (id) DO NOTHING;
