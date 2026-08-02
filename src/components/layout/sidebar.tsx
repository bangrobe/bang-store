"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Sản phẩm", icon: "📦" },
  { href: "/orders", label: "Đơn hàng", icon: "📋" },
  { href: "/pos", label: "Bán hàng", icon: "🛒" },
  { href: "/customers", label: "Khách hàng", icon: "👥" },
  { href: "/suppliers", label: "Nhà cung cấp", icon: "🚚" },
  { href: "/purchases", label: "Nhập hàng", icon: "📥" },
  { href: "/reports", label: "Báo cáo", icon: "📈" },
];

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  // Hide sidebar on login page
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-slate-900 text-white flex flex-col h-screen">
        <div className="p-5 border-b border-slate-700">
          <h1 className="font-bold text-lg">Bang Store</h1>
          <p className="text-xs text-slate-400 mt-0.5">Phụ kiện điện thoại</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
          >
            <span className="text-lg">🚪</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-bg h-screen">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
