"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatVND, formatDateVN, formatDateTimeVN } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderLineRow = Database["public"]["Tables"]["order_lines"]["Row"];

type CustomerWithCount = CustomerRow & { order_count: number };

export default function CustomersPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [customers, setCustomers] = useState<CustomerWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer detail modal
  const [detailCustomer, setDetailCustomer] = useState<CustomerRow | null>(null);
  const [customerOrders, setCustomerOrders] = useState<(OrderRow & { lines: OrderLineRow[] })[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const supabase = createClient();

    // Fetch customers
    const { data: custData, error: custError } = await supabase
      .from("customers")
      .select("*")
      .order("name");

    if (custError) {
      console.error("fetch customers:", custError);
      setLoading(false);
      return;
    }

    // Fetch order counts per customer via raw SQL join
    const { data: orderCounts, error: ocError } = await supabase
      .from("orders")
      .select("customer_id, id")
      .not("customer_id", "is", null);

    const custList = (custData as CustomerRow[]) || [];

    // Build order count map
    const countMap: Record<string, number> = {};
    if (!ocError && orderCounts) {
      (orderCounts as Array<{ customer_id: string | null; id: string }>).forEach(
        (row) => {
          if (row.customer_id) {
            countMap[row.customer_id] = (countMap[row.customer_id] || 0) + 1;
          }
        }
      );
    }

    setCustomers(
      custList.map((c) => ({ ...c, order_count: countMap[c.id] || 0 }))
    );
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [search, customers]);

  const handleSubmit = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("customers").insert({
      name: form.name,
      phone: form.phone,
      note: form.note || null,
    });
    if (error) {
      console.error("add customer:", error);
      return;
    }
    setShowModal(false);
    setForm({ name: "", phone: "", note: "" });
    fetchCustomers();
  };

  const loadCustomerOrders = async (customer: CustomerRow) => {
    setDetailCustomer(customer);
    setDetailLoading(true);

    const supabase = createClient();
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customer.id)
      .order("order_time", { ascending: false })
      .limit(20);

    const orderRows = (orders as OrderRow[]) || [];
    const ordersWithLines: (OrderRow & { lines: OrderLineRow[] })[] = [];

    for (const order of orderRows) {
      const { data: lines } = await supabase
        .from("order_lines")
        .select("*")
        .eq("order_id", order.id)
        .order("id");
      ordersWithLines.push({ ...order, lines: (lines as OrderLineRow[]) || [] });
    }

    setCustomerOrders(ordersWithLines);
    setDetailLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Quản lý khách hàng
        </h1>
        <Button onClick={() => setShowModal(true)}>
          Thêm khách hàng
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:w-80"
      />

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Tên
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Số điện thoại
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Số đơn
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Ghi chú
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Ngày thêm
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Chưa có khách hàng
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => loadCustomerOrders(customer)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-medium">
                        📦 {customer.order_count || 0} đơn
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {customer.note || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDateVN(customer.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadCustomerOrders(customer);
                        }}
                      >
                        📋 Xem đơn
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Thêm khách hàng"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên khách hàng *
            </label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số điện thoại *
            </label>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú
            </label>
            <Input
              value={form.note}
              onChange={(e) =>
                setForm({ ...form, note: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Hủy
            </Button>
            <Button type="submit">Thêm</Button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        open={detailCustomer !== null}
        onClose={() => {
          setDetailCustomer(null);
          setCustomerOrders([]);
        }}
        title={
          detailCustomer
            ? `${detailCustomer.name} — ${detailCustomer.phone}`
            : ""
        }
        size="lg"
      >
        {detailLoading ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : customerOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Khách hàng này chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {customerOrders.map((order) => (
              <div
                key={order.id}
                className="border border-slate-100 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-slate-900">
                    #ORD-{String(order.order_number).padStart(4, "0")}
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
                <p className="text-xs text-slate-400">
                  {formatDateTimeVN(order.order_time)}
                </p>
                <div className="text-xs text-slate-600 space-y-1">
                  {order.lines.map((line) => (
                    <div key={line.id} className="flex justify-between">
                      <span>
                        {line.product_name} × {line.qty}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatVND(Number(line.line_total))}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-50">
                  <span className="text-sm font-bold text-slate-900">Tổng</span>
                  <span className="text-sm font-bold text-indigo-600 tabular-nums">
                    {formatVND(Number(order.total))}
                  </span>
                </div>
                {order.note && (
                  <p className="text-xs text-slate-400 italic">
                    {order.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
