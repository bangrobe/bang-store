"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatDateVN } from "@/lib/utils";
import { mockSuppliers, type Supplier } from "@/lib/mock";

export default function SuppliersPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });

  const handleSubmit = () => {
    console.log("Adding supplier:", form);
    setShowModal(false);
    setForm({ name: "", phone: "", note: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Nhà cung cấp
        </h1>
        <Button onClick={() => setShowModal(true)}>
          Thêm nhà cung cấp
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Tên
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Điện thoại
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {mockSuppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">
                    {s.phone}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Thêm nhà cung cấp"
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
              Tên nhà cung cấp *
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
              Điện thoại *
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
    </div>
  );
}
