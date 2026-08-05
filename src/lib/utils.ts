import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number, opts?: { unit?: boolean }): string {
  const showUnit = opts?.unit ?? true;
  const num = new Intl.NumberFormat("vi-VN").format(amount);
  return showUnit ? num + " ₫" : num;
}

export function formatVNDCompact(amount: number): string {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + " triệu ₫";
  return formatVND(amount);
}

export function formatDateVN(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTimeVN(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTimeVN(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
