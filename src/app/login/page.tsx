"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email hoặc mật khẩu không đúng");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center min-h-full bg-bg p-4">
      <Card className="w-full max-w-md p-8 animate-slide-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/icon.svg"
            alt="Bang Store logo"
            className="w-16 h-16 rounded-2xl shadow-md mb-4"
          />
          <h1 className="text-xl font-bold text-slate-900">Bang Store</h1>
          <p className="text-sm text-slate-400">Cửa hàng phụ kiện điện thoại</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="admin@bangstore.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Đăng nhập
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo: bangdigi.net@gmail.com / mật khẩu Supabase
        </p>
      </Card>
    </div>
  );
}