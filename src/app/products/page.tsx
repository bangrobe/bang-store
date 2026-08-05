"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { formatVND } from "@/lib/utils";
import { CATEGORIES } from "@/lib/mock";
import { createClient } from "@/lib/supabase";

const MAX_IMAGES = 5;
const BUCKET = "products-images";

type ProductImage = { url: string; alt: string };

type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  brand: string;
  compatible_devices: string[];
  color: string | null;
  images: ProductImage[] | any[] | null;
  date_import: string;
  price_in: number;
  price_out: number;
  stock_qty: number;
  min_stock: number;
  status: string;
  vat: boolean;
  note: string | null;
  supplier_id: string | null;
  created_at?: string;
};

type Category = string;

export default function ProductsPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("Tất cả");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"new" | "az">("new");
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    category: "Ốp lưng",
    sku: "",
    barcode: "",
    brand: "",
    compatible_devices: [],
    color: "",
    images: [],
    date_import: new Date().toISOString().split("T")[0],
    price_in: 0,
    price_out: 0,
    stock_qty: 0,
    min_stock: 10,
    status: "active",
    vat: false,
    note: "",
    supplier_id: null,
  });

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
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) console.error("fetch products:", error);
      setProducts((data as Product[]) || []);
      const { data: sup } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");
      setSuppliers((sup as { id: string; name: string }[]) || []);
      setLoading(false);
    })();
  }, [router]);

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
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      if (sortBy === "new") {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      }
      return a.name.localeCompare(b.name, "vi");
    });
    return result;
  }, [products, category, search]);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  // Compress + resize an image client-side using a canvas.
  // Max dimension 720px (keep aspect ratio), output JPEG q=0.8.
  const compressImage = (file: File, maxDim = 720, quality = 0.8): Promise<File> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read file failed"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("decode image failed"));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("no canvas context"));
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("compress failed"));
              const out = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
              });
              resolve(out);
            },
            "image/jpeg",
            quality
          );
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  // Upload a single image file to Supabase Storage and return its public URL
  const uploadImage = async (file: File): Promise<ProductImage | null> => {
    const supabase = createClient();
    let toUpload = file;
    try {
      toUpload = await compressImage(file);
    } catch (err) {
      console.warn("image compress skipped, upload original:", err);
    }
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, toUpload, { cacheControl: "3600", upsert: false, contentType: "image/jpeg" });
    if (error) {
      console.error("upload image:", error);
      alert("Không thể upload ảnh: " + error.message);
      return null;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, alt: file.name };
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current = (form.images as ProductImage[]) || [];
    if (current.length + files.length > MAX_IMAGES) {
      alert(`Chỉ được thêm tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    setUploading(true);
    const uploaded: ProductImage[] = [];
    for (const f of files) {
      const img = await uploadImage(f);
      if (img) uploaded.push(img);
    }
    setForm({ ...form, images: [...current, ...uploaded] });
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    const current = (form.images as ProductImage[]) || [];
    setForm({ ...form, images: current.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async () => {
    const supabase = createClient();
    const payload = {
      name: form.name ?? "",
      category: form.category ?? "Ốp lưng",
      sku: form.sku || `SKU-${Date.now()}`,
      barcode: form.barcode || `BAR-${Date.now()}`,
      brand: form.brand || "",
      compatible_devices: form.compatible_devices || [],
      color: form.color || null,
      images: form.images || [],
      date_import: form.date_import ?? "",
      price_in: form.price_in || 0,
      price_out: form.price_out || 0,
      stock_qty: form.stock_qty || 0,
      min_stock: form.min_stock || 10,
      status: form.status || "active",
      vat: form.vat || false,
      note: form.note || null,
      supplier_id: form.supplier_id || null,
    };
    const { error } = editingProduct
      ? await supabase.from("products").update(payload as never).eq("id", editingProduct.id)
      : await supabase.from("products").insert(payload as never);
    if (error) {
      console.error("save product:", error);
      alert("Không thể lưu sản phẩm: " + error.message);
      return;
    }
    setShowModal(false);
    setEditingProduct(null);
    refreshProducts();
  };

  const refreshProducts = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts((data as Product[]) || []);
  };

  const statusVariant = (status: string) =>
    status === "active" ? "success" : "default";
  const stockVariant = (product: Product) =>
    product.stock_qty < product.min_stock
      ? ("critical" as const)
      : ("default" as const);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Đang tải sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Sản phẩm</h1>
        <Button onClick={() => { setEditingProduct(null); setForm({ name: "", category: "Ốp lưng", sku: "", barcode: "", brand: "", compatible_devices: [], color: "", images: [], date_import: new Date().toISOString().split("T")[0], price_in: 0, price_out: 0, stock_qty: 0, min_stock: 10, status: "active", vat: false, note: "", supplier_id: null }); setShowModal(true); }}>Thêm sản phẩm</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <div className="flex items-center gap-3 sm:ml-auto">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "new" | "az")}
            className="w-44 shrink-0"
          >
            <option value="new">Mới nhất</option>
            <option value="az">Tên A → Z</option>
          </Select>
          <Input
            placeholder="Tìm kiếm tên, SKU, thương hiệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-72"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Ảnh</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Tên</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Danh mục</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Nhà cung cấp</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Giá nhập</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Giá bán</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Tồn kho</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">VAT</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    product.stock_qty < product.min_stock ? "bg-red-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    {product.images && product.images[0] && (
                      <img
                        src={(product.images[0] as any).url}
                        alt={(product.images[0] as any).alt}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
                        loading="lazy"
                        onClick={() => router.push(`/products/${product.id}`)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => router.push(`/products/${product.id}`)}>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-400">
                        {product.sku} · {product.brand}
                      </p>
                      {product.note && (
                        <p className="text-xs text-slate-400 italic truncate max-w-xs">
                          {product.note}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {suppliers.find((s) => s.id === product.supplier_id)?.name ?? (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatVND(product.price_in, { unit: false })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                    {formatVND(product.price_out, { unit: false })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant={stockVariant(product)}>{product.stock_qty}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={product.vat ? "accent" : "default"}>
                      {product.vat ? "Nhập có VAT" : "Không VAT"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.status === "active" ? "Hoạt động" : "Ngừng bán"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setEditingProduct(product);
                        setForm(product);
                        setShowModal(true);
                      }}
                      title="Sửa sản phẩm"
                    >
                      ✏️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Modal (Add / Edit) */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm *</label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục *</label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== "Tất cả").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
              <Input value={form.sku || ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thương hiệu</label>
              <Input value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp</label>
              <Select value={form.supplier_id || ""} onChange={(e) => setForm({ ...form, supplier_id: e.target.value || null })}>
                <option value="">— Chọn nhà cung cấp —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mã vạch (barcode)</label>
              <Input value={form.barcode || ""} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Màu sắc</label>
              <Input value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhập</label>
              <Input type="date" value={form.date_import || ""} onChange={(e) => setForm({ ...form, date_import: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
              <Input value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>

            {/* Product Images */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ảnh sản phẩm ({((form.images as ProductImage[]) || []).length}/{MAX_IMAGES})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {((form.images as ProductImage[]) || []).map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-20 object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow hover:bg-red-600"
                      title="Xoá ảnh"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {((form.images as ProductImage[]) || []).length < MAX_IMAGES && (
                  <label className="w-full h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-slate-400">
                    {uploading ? (
                      <span className="text-xs">Đang tải...</span>
                    ) : (
                      <>
                        <span className="text-2xl leading-none">+</span>
                        <span className="text-xs mt-1">Thêm ảnh</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">PNG/JPEG/WebP/GIF, tối đa 5MB mỗi ảnh.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.vat} onChange={(e) => setForm({ ...form, vat: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Sản phẩm nhập có VAT</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Thiết bị tương thích (mỗi dòng một thiết bị)</label>
              <Textarea
                value={(form.compatible_devices || []).join("\n")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    compatible_devices: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                  })
                }
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá nhập (₫) *</label>
              <Input type="number" value={form.price_in || ""} onChange={(e) => setForm({ ...form, price_in: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (₫) *</label>
              <Input type="number" value={form.price_out || ""} onChange={(e) => setForm({ ...form, price_out: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho *</label>
              <Input type="number" value={form.stock_qty || ""} onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho tối thiểu</label>
              <Input type="number" value={form.min_stock || 10} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.status === "active"} onChange={(e) => setForm({ ...form, status: e.target.checked ? "active" : "discontinued" })} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-700">Hoạt động (active)</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button type="submit">{editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}