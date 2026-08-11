-- Doanh thu báo cáo phải theo giá THỰC TẾ thu được (actual_total),
-- không phải giá niêm yết (total). actual_total rỗng (đơn cũ) → fallback total.
CREATE OR REPLACE VIEW public.daily_revenue AS
SELECT
  o.order_time::date AS date,
  COALESCE(SUM(COALESCE(o.actual_total, o.total)), 0) AS revenue,
  COUNT(o.id) AS orders
FROM public.orders o
GROUP BY o.order_time::date;