"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateVN } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [product, setProduct] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*, suppliers(name)")
        .eq("id", id)
        .single();
      if (error) {
        console.error("fetch product detail:", error);
      }
      setProduct(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy sản phẩm</h1>
        <p className="text-sm text-slate-500">ID: {id}</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const images: { url: string; alt: string }[] = Array.isArray(product.images)
    ? product.images
    : typeof product.images === "string"
    ? JSON.parse(product.images)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Chi tiết sản phẩm</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images */}
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3">
            {images.map((img: any, i: number) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt}
                className="w-full rounded-xl border border-slate-100 object-cover"
                style={{ aspectRatio: "1/1" }}
              />
            ))}
            {images.length === 0 && (
              <p className="text-slate-400 text-center py-8">Không có ảnh</p>
            )}
          </div>
        </Card>

        {/* Info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            {product.name}
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">SKU</p>
              <p className="font-medium tabular-nums">{product.sku}</p>
            </div>
            <div>
              <p className="text-slate-500">Mã vạch</p>
              <p className="font-medium tabular-nums">{product.barcode}</p>
            </div>
            <div>
              <p className="text-slate-500">Danh mục</p>
              <p>{product.category}</p>
            </div>
            <div>
              <p className="text-slate-500">Thương hiệu</p>
              <p>{product.brand}</p>
            </div>
            <div>
              <p className="text-slate-500">Nhà cung cấp</p>
              <p>{product.suppliers?.name || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Màu sắc</p>
              <p>{product.color || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Ngày nhập</p>
              <p>{formatDateVN(product.date_import)}</p>
            </div>
            <div>
              <p className="text-slate-500">Giá nhập</p>
              <p className="font-medium tabular-nums">{formatVND(product.price_in, { unit: false })}</p>
            </div>
            <div>
              <p className="text-slate-500">Giá bán</p>
              <p className="font-medium tabular-nums text-indigo-600">
                {formatVND(product.price_out, { unit: false })}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Tồn kho</p>
              <Badge variant={product.stock_qty < product.min_stock ? "critical" : "success"}>
                {product.stock_qty}
              </Badge>
            </div>
            <div>
              <p className="text-slate-500">Tồn kho tối thiểu</p>
              <p>{product.min_stock}</p>
            </div>
            <div>
              <p className="text-slate-500">VAT</p>
              <Badge variant={product.vat ? "accent" : "default"}>
                  {product.vat ? "Nhập có VAT" : "Không VAT"}
                </Badge>
            </div>
            <div>
              <p className="text-slate-500">Trạng thái</p>
              <Badge variant={product.status === "active" ? "success" : "default"}>
                {product.status === "active" ? "Hoạt động" : "Ngừng bán"}
              </Badge>
            </div>
          </div>

          {product.compatible_devices && product.compatible_devices.length > 0 && (
            <div>
              <p className="text-slate-500 text-sm">Thiết bị tương thích</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {product.compatible_devices.map((d: string) => (
                  <Badge key={d} variant="accent">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {product.note && (
            <div>
              <p className="text-slate-500 text-sm">Ghi chú</p>
              <p className="text-sm">{product.note}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
