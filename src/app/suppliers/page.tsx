"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];

export default function SuppliersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", tax_code: "", address: "", note: "" });
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");

    if (error) {
      console.error("fetch suppliers:", error);
    } else {
      setSuppliers((data as SupplierRow[]) || []);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", tax_code: "", address: "", note: "" });
    setShowModal(true);
  };

  const openEdit = (s: SupplierRow) => {
    setEditing(s);
    setForm({
      name: s.name,
      phone: s.phone,
      tax_code: s.tax_code || "",
      address: s.address || "",
      note: s.note || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const supabase = createClient();
    if (editing) {
      const { error } = await supabase
        .from("suppliers")
        .update({
          name: form.name,
          phone: form.phone,
          tax_code: form.tax_code || null,
          address: form.address || null,
          note: form.note || "",
        })
        .eq("id", editing.id);
      if (error) {
        console.error("update supplier:", error);
        alert("Lỗi: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("suppliers").insert({
        name: form.name,
        phone: form.phone,
        tax_code: form.tax_code || null,
        address: form.address || null,
        note: form.note || "",
      });
      if (error) {
        console.error("add supplier:", error);
        alert("Lỗi: " + error.message);
        return;
      }
    }
    setShowModal(false);
    setEditing(null);
    setForm({ name: "", phone: "", tax_code: "", address: "", note: "" });
    fetchSuppliers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Nhà cung cấp
        </h1>
        <Button onClick={openAdd}>
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
                  Mã số thuế
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Điện thoại
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Địa chỉ
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Ghi chú
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
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    Chưa có nhà cung cấp
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums whitespace-nowrap">
                      {s.tax_code || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums whitespace-nowrap">
                      {s.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[320px] truncate">
                      {s.address || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                      {s.note || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                      >
                        ✏️ Sửa
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Supplier Modal */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        title={editing ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
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
              Mã số thuế
            </label>
            <Input
              value={form.tax_code}
              onChange={(e) =>
                setForm({ ...form, tax_code: e.target.value })
              }
              placeholder="VD: 0111314971"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Điện thoại
            </label>
            <Input
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              placeholder="VD: 028 3845 1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Địa chỉ
            </label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
              placeholder="VD: Số 2, Ngõ 48 Phố Ngọc Trì, Long Biên, Hà Nội"
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
              onClick={() => {
                setShowModal(false);
                setEditing(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit">{editing ? "Lưu" : "Thêm"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
