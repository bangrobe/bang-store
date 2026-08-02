export type Category =
  | "Tất cả"
  | "Ốp lưng"
  | "Cáp"
  | "Củ sạc"
  | "Tai nghe"
  | "Kính cường lực"
  | "Pin dự phòng";

export type PaymentMethod = "cash" | "transfer" | "both";
export type ProductStatus = "active" | "discontinued";

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  sku: string;
  barcode: string;
  brand: string;
  compatibleDevices: string[];
  color?: string;
  images: ProductImage[];
  dateImport: string; // YYYY-MM-DD
  priceIn: number;
  priceOut: number;
  stockQty: number;
  minStock: number;
  status: ProductStatus;
  vat: boolean;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  note?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface OrderLine {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number; // giá bán tại thời điểm bán (snapshot)
  lineTotal: number;
}

export interface Order {
  id: string;
  time: string;
  items: OrderLine[];
  total: number;
  actualTotal?: number; // thực tế khách trả
  paymentMethod: PaymentMethod;
  note?: string;
  customerId?: string;
}

export interface PurchaseLine {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  lines: PurchaseLine[];
  total: number;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  note: string;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface StockAlert {
  product: Product;
  deficit: number;
}
