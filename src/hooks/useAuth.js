"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook dùng chung để biết ai đang đăng nhập.
 * Cách dùng:  const { user, loading } = useAuth();
 *   - user = null            -> chưa đăng nhập
 *   - user = {id,name,role}  -> đã đăng nhập
 *
 * Tự cập nhật khi có sự kiện "authUpdated"
 * (trang đăng nhập và nút đăng xuất đều bắn sự kiện này).
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    window.addEventListener("authUpdated", refresh);
    return () => window.removeEventListener("authUpdated", refresh);
  }, [refresh]);

  return { user, loading, refresh };
}
