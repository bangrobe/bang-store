"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatVND, formatVNDCompact } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

type DailyRevenueRow = {
  date: string;
  revenue: number;
  orders: number;
};

type SoldRow = {
  product_name: string;
  category: string;
  unit_price: number;
  total_qty: number;
  total_revenue: number;
};

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState("2026-08-01");
  const [dateTo, setDateTo] = useState("2026-08-07");
  const [revenueData, setRevenueData] = useState<DailyRevenueRow[]>([]);
  const [topProducts, setTopProducts] = useState<SoldRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [revRes, soldRes] = await Promise.all([
        supabase
          .from("daily_revenue" as any)
          .select("date, revenue, orders")
          .order("date"),
        supabase
          .from("order_lines")
          .select(
            "product_name, qty, unit_price, products!inner(category)"
          ),
      ]);
      if (revRes.error) console.error("fetch daily_revenue:", revRes.error);
      if (soldRes.error) console.error("fetch sold lines:", soldRes.error);

      setRevenueData(
        (revRes.data as unknown as DailyRevenueRow[]) || []
      );

      // Aggregate sold quantities per product (top selling)
      const rows = (soldRes.data as {
        product_name: string;
        qty: number;
        unit_price: number;
        products: { category: string };
      }[]) || [];
      const agg = new Map<
        string,
        SoldRow
      >();
      for (const r of rows) {
        const cur = agg.get(r.product_name) || {
          product_name: r.product_name,
          category: r.products?.category ?? "",
          unit_price: Number(r.unit_price),
          total_qty: 0,
          total_revenue: 0,
        };
        cur.total_qty += Number(r.qty || 0);
        cur.total_revenue += Number(r.qty || 0) * Number(r.unit_price || 0);
        agg.set(r.product_name, cur);
      }
      setTopProducts(
        [...agg.values()]
          .sort((a, b) => b.total_qty - a.total_qty)
          .slice(0, 5)
      );
      setLoading(false);
    })();
  }, []);

  // Filter revenue data by date range
  const filteredRevenue = useMemo(() => {
    return revenueData.filter(
      (d) => d.date >= dateFrom && d.date <= dateTo
    );
  }, [dateFrom, dateTo, revenueData]);

  const totalRevenue = useMemo(
    () => filteredRevenue.reduce((s, d) => s + Number(d.revenue), 0),
    [filteredRevenue]
  );

  const totalOrders = useMemo(
    () => filteredRevenue.reduce((s, d) => s + Number(d.orders), 0),
    [filteredRevenue]
  );

  // Estimated profit (assume ~40% margin)
  const estimatedProfit = useMemo(
    () => Math.round(totalRevenue * 0.4),
    [totalRevenue]
  );

  const maxRevenue = Math.max(
    ...filteredRevenue.map((d) => Number(d.revenue)),
    1
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Báo cáo
      </h1>

      {/* Date Range */}
      <Card className="p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">
          Từ ngày
        </label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-slate-400">đến</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Doanh thu"
          value={formatVND(totalRevenue)}
          icon="💰"
          color="indigo"
        />
        <SummaryCard
          label="Lợi nhuận (ước tính)"
          value={formatVND(estimatedProfit)}
          icon="📈"
          color="emerald"
        />
        <SummaryCard
          label="Số đơn"
          value={totalOrders.toString()}
          icon="📋"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Doanh thu theo ngày
          </h2>
          {loading ? (
            <p className="text-sm text-slate-400">Đang tải...</p>
          ) : filteredRevenue.length === 0 ? (
            <p className="text-sm text-slate-400">
              Không có dữ liệu trong khoảng thời gian này
            </p>
          ) : (
            <div className="relative h-48 flex items-end gap-1">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-400 tabular-nums">
                <span>{formatVNDCompact(maxRevenue)}</span>
                <span>{formatVNDCompact(maxRevenue / 2)}</span>
                <span>0 ₫</span>
              </div>
              <div className="ml-8 flex-1 flex items-end gap-1 h-full">
                {filteredRevenue.map((d) => {
                  const height = (Number(d.revenue) / maxRevenue) * 100;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-indigo-500 rounded-t-md transition-all duration-300 hover:bg-indigo-600 relative group cursor-pointer"
                        style={{ height: `${height}%`, minHeight: "4px" }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatVND(Number(d.revenue))} ({Number(d.orders)} đơn)
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(d.date).getDate()}/{new Date(d.date).getMonth() + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Top Selling Products */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Sản phẩm bán chạy
          </h2>
          {loading ? (
            <p className="text-sm text-slate-400">Đang tải...</p>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có sản phẩm bán ra</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.product_name}
                  className="flex items-center gap-4"
                >
                  <span className="w-6 text-center text-sm font-bold text-slate-400">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                      {product.total_qty} đã bán
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatVND(product.unit_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "indigo" | "emerald" | "amber";
}) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
