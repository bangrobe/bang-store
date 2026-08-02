"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

/**
 * Client-side auth guard.
 * Checks session on mount; redirects to /login if not authenticated.
 * Login page is excluded from the guard (no redirect loop).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (pathname === "/") {
        // Login page — no guard needed
        setChecking(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
      } else {
        setAuthenticated(true);
      }
      setChecking(false);
    };

    check();
  }, [pathname, router]);

  if (pathname === "/") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-full bg-bg">
        <p className="text-sm text-slate-400">Đang xác thực...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
