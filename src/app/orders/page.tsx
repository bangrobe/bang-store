"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderLineRow = Database["public"]["Tables"]["order_lines"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

// Sync bridge: push completed orders to Finance App
// Uses a type assertion to avoid TS errors from the not-yet-deployed table.
async function pushOrderToFinanceApp(
  orderId: string,
  lineId: string,
  transactionType: string,
  amount: number,
  transactionDate: string,
  merchantName: string | null,
  note: string | null,
  categoryName?: string | null,
  accountName?: string | null,
  paymentMethod?: string
) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? '';

    const { data, error } = await (supabase as any)
      .from('bang_store_sync')
      .insert({
        bang_store_order_id: orderId,
        bang_store_line_id: lineId,
        transaction_type: transactionType,
        amount,
        transaction_date: transactionDate,
        merchant_name: merchantName,
        note,
        category_name: categoryName || null,
        scope_id: null,
        sync_status: 'pending',
        synced_by: userId,
        user_id: userId,
        account_name: accountName || null,
      });
    if (error) console.error('pushOrderToFinanceApp error:', error.message);
    else console.log('pushOrderToFinanceApp success:', data);
  } catch (err) {
    console.error('pushOrderToFinanceApp exception:', err);
  }
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<(OrderRow & { lines: OrderLineRow[]; customer: CustomerRow | null }) | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [ordersRes, customersRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("order_number", { ascending: false })
          .limit(100),
        supabase.from("customers").select("*").order("name"),
      ]);
      if (ordersRes.error) console.error("fetch orders:", ordersRes.error);
      if (customersRes.error) console.error("fetch customers:", customersRes.error);
      setOrders((ordersRes.data as OrderRow[]) || []);
      setCustomers((customersRes.data as CustomerRow[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = orders;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.order_number).includes(q) ||
          (o.note && o.note.toLowerCase().includes(q))
      );
    }

    if (paymentFilter !== "all") {
      result = result.filter(
        (o) => o.payment_method === paymentFilter
      );
    }

    if (dateFrom) {
      result = result.filter((o) => o.order_time >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((o) => o.order_time <= dateTo + "T23:59:59");
    }

    if (customerFilter) {
      result = result.filter((o) => o.customer_id === customerFilter);
    }

    return result;
  }, [search, paymentFilter, dateFrom, dateTo, customerFilter, orders]);

  const loadOrderDetail = async (order: OrderRow) => {
    const supabase = createClient();
    const [linesRes, customerRes] = await Promise.all([
      supabase
        .from("order_lines")
        .select("*")
        .eq("order_id", order.id)
        .order("id"),
      order.customer_id
        ? supabase
            .from("customers")
            .select("*")
            .eq("id", order.customer_id)
            .single()
        : { data: null, error: null },
    ]);

    // Attach product category to each line for accurate sync mapping
    const lineRows = (linesRes.data as OrderLineRow[]) || [];
    const products = lineRows.length
      ? await supabase.from("products").select("id, category").in("id", lineRows.map((l) => l.product_id))
      : { data: [] };
    const catMap = new Map<string, string | null>(
      ((products.data as { id: string; category: string }[]) || []).map((p) => [p.id, p.category])
    );
    const linesWithCategory = lineRows.map((l) => ({ ...l, category: catMap.get(l.product_id) ?? null }));

    setSelectedOrder({
      ...order,
      lines: linesWithCategory,
      customer: customerRes.data as CustomerRow | null,
    });
    setShowDetail(true);
  };

  const resolveAccountName = (method: string): string | null => {
    if (method === "transfer") return "BIDV HKD";
    return null;
  };

  const paymentLabel = (method: string) =>
    method === "cash"
      ? "Tiền mặt"
      : method === "transfer"
      ? "Chuyển khoản"
      : "Cả hai";

  const paymentVariant = (method: string) =>
    method === "cash"
      ? ("default" as const)
      : method === "transfer"
      ? ("success" as const)
      : ("accent" as const);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Đơn hàng đã bán
        </h1>
        <span className="text-sm text-slate-500">
          {filtered.length} đơn
        </span>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Tìm kiếm mã đơn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-72"
        />
        <Select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="sm:w-40"
        >
          <option value="all">Tất cả thanh toán</option>
          <option value="cash">Tiền mặt</option>
          <option value="transfer">Chuyển khoản</option>
          <option value="both">Cả hai</option>
        </Select>
        <Select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="sm:w-48"
        >
          <option value="">Tất cả khách hàng</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone})
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="sm:w-40"
          placeholder="Từ ngày"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="sm:w-40"
          placeholder="Đến ngày"
        />
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Mã đơn
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Thời gian
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">
                  Tổng
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">
                  Thanh toán
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Khách hàng
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Ghi chú
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    Không tìm thấy đơn hàng
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const customer = order.customer_id
                    ? customers.find((c) => c.id === order.customer_id)
                    : null;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => loadOrderDetail(order)}
                    >
                      <td className="px-4 py-3 font-medium text-indigo-600 tabular-nums">
                        #ORD-{String(order.order_number).padStart(4, "0")}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatDateTimeVN(order.order_time)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatVND(Number(order.total))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={paymentVariant(order.payment_method)}>
                          {paymentLabel(order.payment_method)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer ? (
                          <span className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-slate-400">{customer.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">— Không có —</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                        {order.note || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm">
                          👁 Xem
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedOrder(null);
        }}
        title={
          selectedOrder
            ? `Chi tiết đơn #ORD-${String(selectedOrder.order_number).padStart(4, "0")}`
            : ""
        }
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            {/* Manual Sync Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  for (const line of selectedOrder.lines) {
                    await pushOrderToFinanceApp(
                      selectedOrder.id,
                      line.id,
                      'income',
                      Number(line.line_total),
                      selectedOrder.order_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                      null,
                      `${line.product_name} x ${line.qty}`,
                      (line as any).category || null,
                      resolveAccountName(selectedOrder.payment_method),
                      selectedOrder.payment_method
                    );
                  }
                  alert('Đã đồng bộ đơn hàng!');
                }}
              >
                🔄 Đồng bộ
              </Button>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Thời gian</p>
                <p className="font-medium">
                  {formatDateTimeVN(selectedOrder.order_time)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Thanh toán</p>
                <Badge variant={paymentVariant(selectedOrder.payment_method)}>
                  {paymentLabel(selectedOrder.payment_method)}
                </Badge>
              </div>
              <div>
                <p className="text-slate-500">Khách hàng</p>
                <p className="font-medium">
                  {selectedOrder.customer
                    ? `${selectedOrder.customer.name} (${selectedOrder.customer.phone})`
                    : <span className="text-slate-400 italic">Không có</span>}
                </p>
              </div>
              {selectedOrder.note && (
                <div className="col-span-2">
                  <p className="text-slate-500">Ghi chú</p>
                  <p className="text-sm">{selectedOrder.note}</p>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="border-t border-slate-100 pt-3">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Chi tiết sản phẩm
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedOrder.lines.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.qty} × {formatVND(Number(item.unit_price))}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatVND(Number(item.line_total))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tổng</span>
                <span className="font-medium tabular-nums">
                  {formatVND(Number(selectedOrder.total))}
                </span>
              </div>
              {selectedOrder.actual_total &&
                Number(selectedOrder.actual_total) !== Number(selectedOrder.total) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Thực tế</span>
                    <span className="font-medium tabular-nums text-indigo-600">
                      {formatVND(Number(selectedOrder.actual_total))}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
