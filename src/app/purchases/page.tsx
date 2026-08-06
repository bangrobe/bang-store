"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatVND, formatDateVN } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type PurchaseOrderLineRow = Database["public"]["Tables"]["purchase_order_lines"]["Row"];

type PurchaseWithMeta = PurchaseOrderRow & {
  supplier: SupplierRow | null;
  lines: PurchaseOrderLineRow[];
};

// Sync bridge: push purchase order to Finance App as inventory restock
async function pushPurchaseToFinanceApp(
  poId: string,
  lineId: string,
  productId: string,
  qty: number,
  purchaseDate: string,
  supplierName: string | null
) {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? "";

    const { data, error } = await supabase
      .from("bang_store_sync" as any)
      .insert({
        bang_store_order_id: poId,
        bang_store_line_id: lineId,
        transaction_type: "expense",
        amount: 0,
        transaction_date: purchaseDate,
        merchant_name: supplierName,
        note: `Restock: ${qty} units`,
        scope_id: null,
        sync_status: "pending",
        synced_by: userId,
        user_id: userId,
      });
    if (error) console.error("pushPurchaseToFinanceApp error:", error.message);
    else console.log("pushPurchaseToFinanceApp success:", data);
  } catch (err) {
    console.error("pushPurchaseToFinanceApp exception:", err);
  }
}

export default function PurchasesPage() {
  const [formSupplier, setFormSupplier] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formNote, setFormNote] = useState("");
  const [lines, setLines] = useState<
    { productId: string; qty: number; unitPrice: number }[]
  >([]);

  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [supplierRes, productRes, poRes] = await Promise.all([
        supabase.from("suppliers").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
        supabase
          .from("purchase_orders")
          .select("*, supplier:suppliers(name)")
          .order("po_date", { ascending: false }),
      ]);
      if (supplierRes.error) console.error("fetch suppliers:", supplierRes.error);
      if (productRes.error) console.error("fetch products:", productRes.error);
      if (poRes.error) console.error("fetch purchase orders:", poRes.error);

      const supplierRows = (supplierRes.data as SupplierRow[]) || [];
      setSuppliers(supplierRows);
      setProducts((productRes.data as ProductRow[]) || []);

      const poRows = (poRes.data as (PurchaseOrderRow & {
        supplier: { name: string } | null;
      })[]) || [];

      const withMeta: PurchaseWithMeta[] = [];
      for (const po of poRows) {
        const { data: lineData, error: lineError } = await supabase
          .from("purchase_order_lines")
          .select("*")
          .eq("purchase_order_id", po.id)
          .order("id");
        if (lineError) console.error("fetch po lines:", lineError);
        withMeta.push({
          ...po,
          supplier: po.supplier
            ? {
                id: po.supplier_id,
                name: po.supplier.name,
                phone: "",
                tax_code: null,
                address: null,
                note: "",
                created_at: "",
                updated_at: "",
              }
            : null,
          lines: (lineData as PurchaseOrderLineRow[]) || [],
        });
      }
      setPurchases(withMeta);
      setLoading(false);
    })();
  }, []);

  const handleAddLine = () => {
    setLines([
      ...lines,
      { productId: "", qty: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setLines(
      lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  };

  const purchaseTotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + l.qty * l.unitPrice,
        0
      ),
    [lines]
  );

  const handleSubmit = async () => {
    if (!formSupplier || lines.length === 0) {
      alert("Vui lòng chọn nhà cung cấp và thêm ít nhất một dòng sản phẩm");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data: poData, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        supplier_id: formSupplier,
        po_date: formDate,
        total: purchaseTotal,
        note: formNote || null,
      })
      .select("id")
      .single();
    if (poError) {
      console.error("insert purchase order:", poError);
      alert("Lỗi: " + poError.message);
      setSubmitting(false);
      return;
    }

    const poId = (poData as { id: string }).id;
    const supplierName =
      suppliers.find((s) => s.id === formSupplier)?.name ?? null;

    const payload = lines
      .filter((l) => l.productId && l.qty > 0)
      .map((l) => {
        const product = products.find((p) => p.id === l.productId);
        return {
          purchase_order_id: poId,
          product_id: l.productId,
          product_name: product?.name ?? "Sản phẩm",
          qty: l.qty,
          unit_price: l.unitPrice,
          line_total: l.qty * l.unitPrice,
        };
      });

    const { error: lineError } = await supabase
      .from("purchase_order_lines")
      .insert(payload);
    if (lineError) {
      console.error("insert po lines:", lineError);
      alert("Đã lưu phiếu nhập nhưng lỗi chi tiết: " + lineError.message);
    }

    // Push sync bridge (fire-and-forget)
    if (!lineError) {
      for (const pl of payload) {
        await pushPurchaseToFinanceApp(
          poId,
          pl.purchase_order_id,
          pl.product_id,
          pl.qty,
          formDate,
          supplierName
        );
      }
    }

    setLines([]);
    setFormSupplier("");
    setFormNote("");
    setSubmitting(false);

    // Refresh history
    const { data: newPoRes } = await supabase
      .from("purchase_orders")
      .select("*, supplier:suppliers(name)")
      .eq("id", poId)
      .single();
    if (newPoRes) {
      const poRow = newPoRes as PurchaseOrderRow & {
        supplier: { name: string } | null;
      };
      setPurchases((prev) => [
        {
          ...poRow,
          supplier: poRow.supplier
            ? {
                id: poRow.supplier_id,
                name: poRow.supplier.name,
                phone: "",
                tax_code: null,
                address: null,
                note: "",
                created_at: "",
                updated_at: "",
              }
            : null,
          lines: payload as PurchaseOrderLineRow[],
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Nhập hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase History */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Ngày
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Nhà cung cấp
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    Số mặt hàng
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                      Đang tải...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                      Chưa có phiếu nhập hàng
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateVN(po.po_date)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {po.supplier?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {po.lines.length > 0
                          ? po.lines.reduce((s, l) => s + l.qty, 0)
                          : 1}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatVND(Number(po.total))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Purchase Form Card */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Tạo phiếu nhập mới
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nhà cung cấp *
                </label>
                <Select
                  value={formSupplier}
                  onChange={(e) =>
                    setFormSupplier(e.target.value)
                  }
                  required
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngày nhập *
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chi tiết sản phẩm
              </label>
              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                  >
                    <select
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                      value={line.productId}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          "productId",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatVND(Number(p.price_in))}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          "qty",
                          Number(e.target.value)
                        )
                      }
                      className="w-20"
                      placeholder="SL"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) =>
                        handleLineChange(
                          index,
                          "unitPrice",
                          Number(e.target.value)
                        )
                      }
                      className="w-28"
                      placeholder="Đơn giá"
                    />
                    <span className="text-sm text-slate-600 w-20 text-right tabular-nums">
                      {formatVND(line.qty * line.unitPrice)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLine(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={handleAddLine}
              >
                + Thêm dòng
              </Button>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-slate-100 flex justify-between">
              <span className="font-semibold text-slate-700">
                Tổng tiền
              </span>
              <span className="text-xl font-bold text-indigo-600 tabular-nums">
                {formatVND(purchaseTotal)}
              </span>
            </div>

            {/* Note */}
            <Input
              placeholder="Ghi chú..."
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Xác nhận nhập hàng"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
