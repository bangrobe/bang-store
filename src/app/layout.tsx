import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarLayout from "@/components/layout/sidebar";
import { AuthGuard } from "./auth-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bang Store - Quản lý cửa hàng phụ kiện",
  description: "Hệ thống quản lý cửa hàng phụ kiện điện thoại",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full flex flex-col">
        <AuthGuard>
          <SidebarLayout>{children}</SidebarLayout>
        </AuthGuard>
      </body>
    </html>
  );
}
