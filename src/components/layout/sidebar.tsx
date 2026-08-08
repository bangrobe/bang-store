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
  {
    href: "https://bangdigi-finance.vercel.app",
    label: "Tài chính",
    icon: "💸",
    external: true,
  },
];

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const SidebarNav = () => (
    <>
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img
            src="/icon.svg"
            alt="Bang Store logo"
            className="w-9 h-9 rounded-xl shadow-md shrink-0"
          />
          <div>
            <h1 className="font-bold text-lg leading-tight">Bang Store</h1>
            <p className="text-xs text-slate-400 mt-0.5">Phụ kiện điện thoại</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.external && pathname.startsWith(item.href);
          const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive
              ? "bg-indigo-600 text-white font-medium shadow-sm"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`;
          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </a>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={className}
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
    </>
  );

  return (
    <div className="flex h-screen">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, fixed when open */}
      <aside
        className={`
          fixed md:relative z-50
          w-56 shrink-0 bg-slate-900 text-white flex flex-col h-screen
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-bg h-screen flex flex-col">
        {/* Mobile header with hamburger */}
        <header className="md:hidden bg-white border-b border-slate-100 flex items-center justify-between p-4 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Mở menu"
          >
            ☰
          </button>
          <span className="font-medium text-slate-900">Bang Store</span>
          <div className="w-10" />
        </header>

        <div className="p-6 w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
