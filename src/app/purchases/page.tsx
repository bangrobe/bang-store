"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatVND, formatDateVN } from "@/lib/utils";
import { mockProducts, mockSuppliers, type Supplier } from "@/lib/mock";

export default function PurchasesPage() {
  const [showForm, setShowForm] = useState(false);
  const [formSupplier, setFormSupplier] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formNote, setFormNote] = useState("");
  const [lines, setLines] = useState<
    { productId: string; qty: number; unitPrice: number }[]
  >([]);

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

  const handleSubmit = () => {
    console.log("Submitting purchase:", {
      supplier: formSupplier,
      date: formDate,
      note: formNote,
      lines,
      total: purchaseTotal,
    });
    setShowForm(false);
    setLines([]);
    setFormSupplier("");
    setFormNote("");
  };

  // Mock purchase history
  const purchaseHistory = [
    {
      id: "PO-001",
      date: "2026-07-30",
      supplier: "Công ty TNHH CaseMate Việt Nam",
      itemCount: 3,
      total: 1450000,
    },
    {
      id: "PO-002",
      date: "2026-07-28",
      supplier: "Anker Việt Nam",
      itemCount: 5,
      total: 3200000,
    },
    {
      id: "PO-003",
      date: "2026-07-25",
      supplier: "Cửa hàng phụ kiện TPHCM",
      itemCount: 2,
      total: 890000,
    },
    {
      id: "PO-004",
      date: "2026-07-20",
      supplier: "Sony Audio Việt Nam",
      itemCount: 1,
      total: 450000,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Nhập hàng</h1>
        <Button onClick={() => setShowForm(true)}>
          Tạo phiếu nhập
        </Button>
      </div>

      {/* Purchase Form */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Tạo phiếu nhập"
        size="lg"
      >
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
                {mockSuppliers.map((s) => (
                  <option key={s.id} value={s.name}>
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
                    {mockProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatVND(p.priceIn)}
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Hủy
            </Button>
            <Button type="submit">Xác nhận nhập hàng</Button>
          </div>
        </form>
      </Modal>

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
              {purchaseHistory.map((po) => (
                <tr
                  key={po.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-600">
                    {formatDateVN(po.date)}
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {po.supplier}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {po.itemCount}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                    {formatVND(po.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
