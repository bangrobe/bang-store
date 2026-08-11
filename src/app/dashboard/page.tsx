"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND, formatVNDCompact, formatDateTimeVN } from "@/lib/utils";
import { getStockAlerts, type StockAlert } from "@/lib/mock";
import { createClient } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price_in: number;
  price_out: number;
  stock_qty: number;
  min_stock: number;
  status: string;
};

type OrderRow = {
  id: string;
  order_number: number;
  order_time: string;
  total: number;
  actual_total: number | null;
  payment_method: string;
};

// Kết quả fetch order_lines join orders!inner (filter theo ngày)
type TodaySoldRow = {
  qty: number;
  orders: { order_time: string };
};

export default function DashboardPage() {
  const router = useRouter();
  const [date] = useState(new Date().toISOString().split("T")[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [todaySold, setTodaySold] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }

      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date();
      dayEnd.setHours(23, 59, 59, 999);

      const [prodRes, orderRes, soldRes] = await Promise.all([
        supabase.from("products").select("*").order("name").limit(100),
        supabase
          .from("orders")
          .select("id, order_number, order_time, total, actual_total, payment_method")
          .order("order_number", { ascending: false })
          .limit(8),
        supabase
          .from("order_lines")
          .select("qty, orders!inner(order_time)")
          .gte("orders.order_time", dayStart.toISOString())
          .lte("orders.order_time", dayEnd.toISOString()),
      ]);

      if (prodRes.error) console.error("fetch products:", prodRes.error);
      if (orderRes.error) console.error("fetch orders:", orderRes.error);
      if (soldRes.error) console.error("fetch order_lines:", soldRes.error);

      // "Sản phẩm đã bán hôm nay" = SUM(qty) của các order trong hôm nay
      const lines = (soldRes.data as TodaySoldRow[]) || [];
      setTodaySold(lines.reduce((sum, l) => sum + Number(l.qty || 0), 0));

      setProducts((prodRes.data as Product[]) || []);
      setOrders((orderRes.data as OrderRow[]) || []);
      setRecentOrders((orderRes.data as OrderRow[]) || []);
      setLoading(false);
    })();
  }, [router]);

  const todayRevenue = useMemo(() => {
    const todayStr = date;
    return orders
      .filter((o) => o.order_time?.startsWith(todayStr))
      .reduce(
        (sum, o) => sum + Number(o.actual_total ?? o.total ?? 0),
        0
      );
  }, [orders, date]);

  const todayOrders = useMemo(
    () => orders.filter((o) => o.order_time?.startsWith(date)).length,
    [orders, date]
  );

  const alerts: StockAlert[] = useMemo(
    () =>
      getStockAlerts(
        products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category as any,
          sku: p.sku,
          barcode: "",
          brand: "",
          compatibleDevices: [],
          images: [],
          dateImport: "",
          priceIn: Number(p.price_in),
          priceOut: Number(p.price_out),
          stockQty: p.stock_qty,
          minStock: p.min_stock,
          status: p.status as any,
          vat: false,
        }))
      ),
    [products]
  );

  const maxRevenue = 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {loading ? (
        <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Doanh thu hôm nay"
              value={formatVND(todayRevenue)}
              icon="💰"
              color="indigo"
            />
            <StatCard
              label="Đơn hôm nay"
              value={todayOrders.toString()}
              icon="📋"
              color="emerald"
            />
            <StatCard
              label="Sản phẩm đã bán"
              value={todaySold.toString()}
              icon="📦"
              color="amber"
            />
            <StatCard
              label="Hàng sắp hết"
              value={alerts.length.toString()}
              icon="⚠️"
              color="red"
            />
          </div>

          {/* Recent Orders + Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Đơn gần đây
              </h2>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-400">Chưa có đơn hàng nào</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          #ORD-{String(order.order_number).padStart(4, "0")}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDateTimeVN(order.order_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatVND(Number(order.actual_total ?? order.total))}
                        </p>
                        <Badge
                          variant={
                            order.payment_method === "cash"
                              ? "default"
                              : order.payment_method === "transfer"
                              ? "success"
                              : "accent"
                          }
                        >
                          {order.payment_method === "cash"
                            ? "Tiền mặt"
                            : order.payment_method === "transfer"
                            ? "Chuyển khoản"
                            : "Cả hai"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Stock Alerts */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Cảnh báo tồn kho
              </h2>
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-400">Không có cảnh báo</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.product.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {alert.product.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          SKU: {alert.product.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="critical">
                          Còn {alert.product.stockQty} (cần ≥
                          {alert.product.minStock})
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: "indigo" | "emerald" | "amber" | "red";
}) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
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

function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(" ");
}