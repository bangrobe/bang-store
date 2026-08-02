// ============================================================
// Bang Store — Supabase Types
// Generated from supabase/schema.sql (sync-ready)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          sku: string;
          barcode: string;
          brand: string;
          compatible_devices: string[];
          color: string | null;
          images: Json;
          date_import: string;
          price_in: number;
          price_out: number;
          stock_qty: number;
          min_stock: number;
          status: "active" | "discontinued";
          vat: boolean;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          sku: string;
          barcode: string;
          brand?: string;
          compatible_devices?: string[];
          color?: string | null;
          images?: Json;
          date_import: string;
          price_in: number;
          price_out: number;
          stock_qty?: number;
          min_stock?: number;
          status?: "active" | "discontinued";
          vat?: boolean;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          sku?: string;
          barcode?: string;
          brand?: string;
          compatible_devices?: string[];
          color?: string | null;
          images?: Json;
          date_import?: string;
          price_in?: number;
          price_out?: number;
          stock_qty?: number;
          min_stock?: number;
          status?: "active" | "discontinued";
          vat?: boolean;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          order_time: string;
          total: number;
          actual_total: number | null;
          payment_method: "cash" | "transfer" | "both";
          note: string | null;
          customer_id: string | null;
          source: "pos" | "online" | "whatsapp" | "zalo";
          sync_status: "pending" | "synced" | "failed" | "skipped";
          synced_at: string | null;
          sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: number;
          order_time?: string;
          total?: number;
          actual_total?: number | null;
          payment_method?: "cash" | "transfer" | "both";
          note?: string | null;
          customer_id?: string | null;
          source?: "pos" | "online" | "whatsapp" | "zalo";
          sync_status?: "pending" | "synced" | "failed" | "skipped";
          synced_at?: string | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: number;
          order_time?: string;
          total?: number;
          actual_total?: number | null;
          payment_method?: "cash" | "transfer" | "both";
          note?: string | null;
          customer_id?: string | null;
          source?: "pos" | "online" | "whatsapp" | "zalo";
          sync_status?: "pending" | "synced" | "failed" | "skipped";
          synced_at?: string | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_lines: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          qty: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          qty: number;
          unit_price: number;
          line_total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          qty?: number;
          unit_price?: number;
          line_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_lines_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_orders: {
        Row: {
          id: string;
          po_date: string;
          supplier_id: string;
          total: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_date?: string;
          supplier_id: string;
          total?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          po_date?: string;
          supplier_id?: string;
          total?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_order_lines: {
        Row: {
          id: string;
          purchase_order_id: string;
          product_id: string;
          product_name: string;
          qty: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          product_id: string;
          product_name: string;
          qty: number;
          unit_price: number;
          line_total: number;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          product_id?: string;
          product_name?: string;
          qty?: number;
          unit_price?: number;
          line_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_purchase_order_id_fkey";
            columns: ["purchase_order_id"];
            isOneToOne: false;
            referencedRelation: "purchase_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      business_transactions: {
        Row: {
          id: string;
          order_id: string;
          order_line_id: string;
          transaction_type: string;
          amount: number;
          transaction_date: string;
          category_id: string | null;
          category_name: string | null;
          account_id: string | null;
          account_name: string | null;
          scope_id: string | null;
          merchant_name: string | null;
          note: string | null;
          sync_status: "pending" | "synced" | "failed" | "skipped";
          synced_at: string | null;
          sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          order_line_id: string;
          transaction_type: string;
          amount: number;
          transaction_date: string;
          category_id?: string | null;
          category_name?: string | null;
          account_id?: string | null;
          account_name?: string | null;
          scope_id?: string | null;
          merchant_name?: string | null;
          note?: string | null;
          sync_status?: "pending" | "synced" | "failed" | "skipped";
          synced_at?: string | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          order_line_id?: string;
          transaction_type?: string;
          amount?: number;
          transaction_date?: string;
          category_id?: string | null;
          category_name?: string | null;
          account_id?: string | null;
          account_name?: string | null;
          scope_id?: string | null;
          merchant_name?: string | null;
          note?: string | null;
          sync_status?: "pending" | "synced" | "failed" | "skipped";
          synced_at?: string | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_transactions_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_transactions_order_line_id_fkey";
            columns: ["order_line_id"];
            isOneToOne: false;
            referencedRelation: "order_lines";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_log: {
        Row: {
          id: string;
          product_id: string;
          change_qty: number;
          reason: string;
          reference_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          change_qty: number;
          reason: string;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          change_qty?: number;
          reason?: string;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_log_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      daily_revenue: {
        Row: {
          date: string;
          revenue: number;
          orders: number;
        };
        Insert: {};
        Update: {};
        Relationships: [];
      };
      stock_alerts: {
        Row: {
          product_id: string;
          product_name: string;
          sku: string;
          stock_qty: number;
          min_stock: number;
          deficit: number;
          category: string;
          status: "active" | "discontinued";
        };
        Insert: {};
        Update: {};
        Relationships: [];
      };
      sync_queue: {
        Row: {
          bt_id: string;
          order_id: string;
          order_line_id: string;
          transaction_type: string;
          amount: number;
          transaction_date: string;
          category_name: string | null;
          account_name: string | null;
          merchant_name: string | null;
          note: string | null;
          order_time: string;
          payment_method: "cash" | "transfer" | "both";
          customer_name: string | null;
          customer_phone: string | null;
        };
        Insert: {};
        Update: {};
        Relationships: [];
      };
    };
    Functions: {};
    Enums: {
      order_source: "pos" | "online" | "whatsapp" | "zalo";
      payment_method: "cash" | "transfer" | "both";
      product_status: "active" | "discontinued";
      sync_status: "pending" | "synced" | "failed" | "skipped";
    };
  };
};

// Named row aliases
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderLine = Database["public"]["Tables"]["order_lines"]["Row"];
export type PurchaseOrder = Database["public"]["Tables"]["purchase_orders"]["Row"];
export type PurchaseOrderLine = Database["public"]["Tables"]["purchase_order_lines"]["Row"];
export type BusinessTransaction = Database["public"]["Tables"]["business_transactions"]["Row"];
export type InventoryLogRow = Database["public"]["Tables"]["inventory_log"]["Row"];

export type DailyRevenue = Database["public"]["Views"]["daily_revenue"]["Row"];
export type StockAlertView = Database["public"]["Views"]["stock_alerts"]["Row"];
export type SyncQueueRow = Database["public"]["Views"]["sync_queue"]["Row"];
