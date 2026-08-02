"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

function Chip({ active, onClick, children, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 whitespace-nowrap",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
        className
      )}
    >
      {children}
    </button>
  );
}

export { Chip };
