"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";
import { useRouter } from "next/navigation";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type Category = string;

// Map category -> emoji icon (fallback when product has no image)
const CATEGORY_ICON: Record<string, string> = {
  "Ốp lưng": "📱",
  "Cáp": "🔌",
  "Củ sạc": "🔋",
  "Tai nghe": "🎧",
  "Kính cường lực": "🛡️",
  "Pin dự phòng": "🔋",
  "Khác": "📦",
};

const getProductImageUrl = (images: unknown): string | null => {
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0] as { url?: string } | null;
    if (first && typeof first.url === "string" && first.url) {
      // Ignore placeholder seed data — treat as no image
      if (first.url.includes("placehold.co")) return null;
      return first.url;
    }
  }
  return null;
};

const getCategoryIcon = (category: string): string =>
  CATEGORY_ICON[category] || "📦";

const CATEGORIES = [
  "Tất cả",
  "Ốp lưng",
  "Cáp",
  "Củ sạc",
  "Tai nghe",
  "Kính cường lực",
  "Pin dự phòng",
  "Khác",
];

export default function POSPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("Tất cả");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ product: ProductRow; qty: number }[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [note, setNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [changeAmount, setChangeAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [cashInput, setCashInput] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer selection
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", note: "" });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [prodRes, custRes] = await Promise.all([
        supabase.from("products").select("*").order("name"),
        supabase.from("customers").select("*").order("name"),
      ]);
      if (prodRes.error) console.error("fetch products:", prodRes.error);
      if (custRes.error) console.error("fetch customers:", custRes.error);
      setProducts((prodRes.data as ProductRow[]) || []);
      setCustomers((custRes.data as CustomerRow[]) || []);
      setLoading(false);
    })();
  }, []);

  // Filter products
  const filtered = useMemo(() => {
    let result = products;
    if (category !== "Tất cả") {
      result = result.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    return result;
  }, [category, search, products]);

  // Cart calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.product.price_out) * item.qty, 0),
    [cart]
  );
  const discountAmount = useMemo(() => {
    if (discount <= 0) return 0;
    if (discount >= 100) return subtotal;
    return Math.round(subtotal * (discount / 100));
  }, [subtotal, discount]);
  const total = subtotal - discountAmount;

  const handleAddToCart = useCallback((product: ProductRow) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const handleUpdateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, qty } : item
      )
    );
  }, []);

  // Resolve account_name for sync based on payment method
  const resolveAccountName = (method: string): string | null => {
    if (method === "transfer") return "BIDV HKD";
    return null;
  };

  const createCustomerQuick = async () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: customerForm.name,
        phone: customerForm.phone,
        note: customerForm.note || null,
      })
      .select("id, name, phone, note, created_at")
      .single();
    if (error) {
      console.error("create customer:", error);
      alert("Lỗi tạo khách hàng: " + error.message);
      return;
    }
    const newCustomer = data as CustomerRow;
    setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedCustomerId(newCustomer.id);
    setShowCustomerModal(false);
    setCustomerForm({ name: "", phone: "", note: "" });
  };

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;
    const finalTotal = paidAmount > 0 ? paidAmount : total;
    if (paymentMethod === "cash") {
      const amount = parseFloat(cashInput);
      if (amount < finalTotal) return;
      setChangeAmount(amount - finalTotal);
    }

    // Save order to database + push sync to Finance App
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? "";

      const accountName = resolveAccountName(paymentMethod);

      // 1) Insert order (with customer_id if selected)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          total,
          actual_total: paidAmount > 0 ? paidAmount : null,
          payment_method: paymentMethod as any,
          note: note || null,
          customer_id: selectedCustomerId || null,
        })
        .select("id")
        .single();
      if (orderError) throw new Error("Insert order: " + orderError.message);

      // 2) Insert order lines + push sync
      // Theo yêu cầu của Boss: toàn bộ chiết khấu (discount) được trừ vào MỘT món hàng
      // duy nhất — món CUỐI CÙNG trong giỏ hàng. Các món còn lại sync giá gốc.
      // Tổng các lineNet phải bằng số tiền khách thực sự trả (finalTotal).
      const finalTotal = paidAmount > 0 ? paidAmount : total;
      const discountTotal = subtotal - finalTotal; // = discountAmount + (paidAmount - total) nếu override

      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const isLast = i === cart.length - 1;
        const lineBase = Number(item.product.price_out) * item.qty;
        // Trừ toàn bộ chiết khấu + override vào món cuối
        const lineNet = isLast ? (lineBase - discountTotal) : lineBase;

        const { data: lineData, error: lineError } = await supabase
          .from("order_lines")
          .insert({
            order_id: orderData.id,
            product_id: item.product.id,
            product_name: item.product.name,
            qty: item.qty,
            unit_price: Number(item.product.price_out),
            line_total: lineBase, // gross price for POS reporting
          })
          .select("id")
          .single();
        if (lineError) throw new Error("Insert order line: " + lineError.message);

        // 3) Push sync record for each line — sync SỐ TIỀN THỰC TẾ (lineNet)
        //    account_name chỉ set khi transfer → trigger resolve về BIDV HKD;
        //    cash (account_name=null) → trigger resolve về Tiền cửa hàng.
        await (supabase as any)
          .from("bang_store_sync")
          .insert({
            bang_store_order_id: orderData.id,
            bang_store_line_id: lineData.id,
            transaction_type: "income",
            amount: lineNet, // ✅ sync net, không phải gross
            transaction_date: new Date().toISOString().slice(0, 10),
            merchant_name: null,
            note: `${item.product.name} x ${item.qty}`,
            category_name: item.product.category,
            scope_id: null,
            sync_status: "pending",
            synced_by: userId,
            user_id: userId,
            account_name: accountName,
          });
      }

      // 4) Also log inventory changes
      for (const item of cart) {
        await supabase
          .from("inventory_log")
          .insert({
            product_id: item.product.id,
            change_qty: -item.qty,
            reason: "sale",
            reference_id: orderData.id,
            note: `Bán hàng #ORD-...`,
          });
      }

      setShowSuccess(true);
      // Reset form for next sale
      setCart([]);
      setDiscount(0);
      setNote("");
      setCashInput("");
      setPaidAmount(0);
      setChangeAmount(0);
      setPaymentMethod("cash");
      setSelectedCustomerId("");
    } catch (err: any) {
      console.error("Checkout error:", err.message);
      alert("Lỗi thanh toán: " + err.message);
    }
  }, [cart, paymentMethod, cashInput, total, paidAmount, note, selectedCustomerId]);

  const handleNewSale = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setNote("");
    setCashInput("");
    setPaidAmount(0);
    setChangeAmount(0);
    setShowSuccess(false);
    setSelectedCustomerId("");
    setCustomerForm({ name: "", phone: "", note: "" });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Đang tải sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Bán hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Chip>
            ))}
          </div>

          {/* Search */}
          <Input
            placeholder="Tìm kiếm theo tên hoặc SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAddToCart(product)}
              >
                <div className="flex items-start justify-between mb-2">
                  {(() => {
                    const imgUrl = getProductImageUrl(product.images);
                    if (imgUrl) {
                      return (
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-100"
                        />
                      );
                    }
                    return (
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">
                        {getCategoryIcon(product.category)}
                      </div>
                    );
                  })()}
                  <Badge
                    variant={
                      product.stock_qty < product.min_stock
                        ? "critical"
                        : product.stock_qty < product.min_stock * 2
                        ? "warning"
                        : "success"
                    }
                  >
                    {product.stock_qty}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{product.sku}</p>
                <p className="text-sm font-bold text-indigo-600 mt-2 tabular-nums">
                  {formatVND(Number(product.price_out))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Cart */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-full flex flex-col">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 shrink-0">
              Giỏ hàng ({cart.reduce((s, i) => s + i.qty, 0)} sản phẩm)
            </h2>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <span className="text-4xl mb-3">🛒</span>
                <p className="text-sm">Chưa có sản phẩm</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1 min-h-0" style={{ minHeight: "200px", maxHeight: "350px" }}>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-50"
                    >
                      <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm overflow-hidden">
                        {(() => {
                          const imgUrl = getProductImageUrl(item.product.images);
                          if (imgUrl) {
                            return (
                              <img
                                src={imgUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            );
                          }
                          return <span>{getCategoryIcon(item.product.category)}</span>;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-400 tabular-nums">
                          {formatVND(Number(item.product.price_out))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                          onClick={() =>
                            handleUpdateQty(
                              item.product.id,
                              item.qty - 1
                            )
                          }
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                          onClick={() =>
                            handleUpdateQty(
                              item.product.id,
                              item.qty + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums w-20 text-right">
                        {formatVND(
                          Number(item.product.price_out) * item.qty
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Customer Selection */}
                <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
                  <label className="text-xs text-slate-500 mb-1 block">
                    Khách hàng
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="flex-1"
                    >
                      <option value="">Chọn khách hàng</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCustomerModal(true)}
                      title="Thêm khách hàng mới"
                    >
                      +
                    </Button>
                  </div>
                  {selectedCustomerId && (
                    <p className="text-xs text-slate-500 mt-1">
                      {customers.find((c) => c.id === selectedCustomerId)?.name}
                    </p>
                  )}
                </div>

                {/* Discount */}
                <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
                  <label className="text-xs text-slate-500 mb-1 block">
                    Giảm giá (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        Math.max(0, Math.min(100, Number(e.target.value)))
                      )
                    }
                    className="h-8"
                  />
                </div>

                {/* Order Total Override */}
                <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
                  <label className="text-xs text-slate-500 mb-1 block">
                    Tổng đơn hàng thực tế (để trống = tự tính)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={paidAmount || ""}
                    onChange={(e) =>
                      setPaidAmount(Number(e.target.value))
                    }
                    placeholder={formatVND(total)}
                    className="h-9"
                  />
                  {paidAmount > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Thực tế: {formatVND(paidAmount)}
                      {paidAmount !== total && (
                        <span className="text-red-500 ml-2">
                          (Chênh lệch:{" "}
                          {formatVND(
                            Math.abs(paidAmount - total)
                          )}{" "}
                          {paidAmount > total ? "thừa" : "thiếu"})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 shrink-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tạm tính</span>
                    <span className="font-medium tabular-nums">
                      {formatVND(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Giảm giá</span>
                      <span className="text-red-500 font-medium tabular-nums">
                        -{formatVND(discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-1 border-t border-slate-100">
                    <span>Tổng cộng</span>
                    <span className="text-indigo-600 tabular-nums">
                      {formatVND(paidAmount > 0 ? paidAmount : total)}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
                  <label className="text-xs text-slate-500 mb-2 block">
                    Phương thức thanh toán
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "cash", label: "Tiền mặt" },
                      { value: "transfer", label: "Chuyển khoản" },
                      { value: "both", label: "Cả hai" },
                    ].map((m) => (
                      <label
                        key={m.value}
                        className={`flex-1 text-center py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          paymentMethod === m.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={m.value}
                          checked={paymentMethod === m.value}
                          onChange={() =>
                            setPaymentMethod(m.value)
                          }
                          className="sr-only"
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cash input */}
                {paymentMethod === "cash" && (
                  <div className="mt-3 shrink-0">
                    <label className="text-xs text-slate-500 mb-1 block">
                      Số tiền khách đưa
                    </label>
                    <Input
                      type="number"
                      placeholder={formatVND(total)}
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      className="h-9"
                    />
                    {cashInput && Number(cashInput) >= total && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Tiền thừa:{" "}
                        <strong>
                          {formatVND(Number(cashInput) - total)}
                        </strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Note */}
                <Input
                  placeholder="Ghi chú đơn hàng..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-3 h-9 shrink-0"
                />

                {/* Checkout Button */}
                <Button
                  className="w-full mt-3 shrink-0"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Thanh toán
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Customer Modal — inline / quick-create */}
      <Modal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Thêm khách hàng mới"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCustomerQuick();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên khách hàng *
            </label>
            <Input
              value={customerForm.name}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số điện thoại *
            </label>
            <Input
              value={customerForm.phone}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, phone: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú
            </label>
            <Input
              value={customerForm.note}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, note: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCustomerModal(false)}
            >
              Hủy
            </Button>
            <Button type="submit">Thêm</Button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Thanh toán thành công!"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-sm text-slate-600 mb-4">
            Đơn hàng đã được lưu và đồng bộ sang Personal Finance App.
          </p>
          <Button onClick={() => { setShowSuccess(false); handleNewSale(); }}>
            Bán hàng mới
          </Button>
        </div>
      </Modal>
    </div>
  );
}
