"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

const GUEST_KEY = "guest_cart";

function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cartUpdated"));
}

// Header và các trang đều gọi useCart(), nên có nhiều "bản sao" hook chạy cùng lúc.
// Biến này đảm bảo việc gộp giỏ hàng khách vào tài khoản chỉ diễn ra ĐÚNG 1 LẦN,
// tránh số lượng sản phẩm bị cộng dồn nhiều lần.
let mergeInFlight = null;

function mergeGuestCartOnce() {
  if (mergeInFlight) return mergeInFlight;

  const guestItems = readGuestCart();
  if (guestItems.length === 0) return Promise.resolve();

  // Xoá giỏ khách NGAY LẬP TỨC để các bản sao hook khác đọc vào sẽ thấy giỏ trống
  localStorage.removeItem(GUEST_KEY);

  mergeInFlight = fetch("/api/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: guestItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("merge failed");
    })
    .catch(() => {
      // Gộp thất bại: trả giỏ khách về chỗ cũ, không làm mất hàng của người dùng
      localStorage.setItem(GUEST_KEY, JSON.stringify(guestItems));
    })
    .finally(() => {
      mergeInFlight = null;
    });

  return mergeInFlight;
}

/**
 * Hook giỏ hàng dùng chung cho toàn bộ trang.
 *
 * - Chưa đăng nhập: lưu tạm trong localStorage (giỏ hàng "khách vãng lai"),
 *   riêng theo từng trình duyệt, không gắn với ai cả.
 * - Đã đăng nhập: đọc/ghi thẳng vào database qua API /api/cart, gắn với user_id
 *   -> mỗi tài khoản có giỏ hàng riêng, không còn bị lẫn giữa các tài khoản.
 * - Ngay khi vừa đăng nhập: nếu đang có giỏ hàng khách, tự động gộp vào giỏ
 *   của tài khoản đó rồi xoá giỏ khách đi.
 *
 * Cách dùng: const { items, loading, addItem, updateQuantity, removeItem,
 *                     totalCount, totalPrice, isGuest } = useCart();
 */
export function useCart() {
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadServerCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    }
  }, []);

  // Xử lý chính: chuyển đổi giữa giỏ khách và giỏ tài khoản, gộp giỏ khi vừa đăng nhập
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function run() {
      if (user) {
        await mergeGuestCartOnce();
        if (cancelled) return;
        await loadServerCart();
      } else {
        setItems(readGuestCart());
      }

      if (!cancelled) setLoading(false);
    }

    setLoading(true);
    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Lắng nghe khi giỏ hàng đổi từ nơi khác (tab khác, hoặc component khác trong cùng trang)
  useEffect(() => {
    function handleUpdate() {
      if (user) {
        loadServerCart();
      } else {
        setItems(readGuestCart());
      }
    }

    window.addEventListener("cartUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [user, loadServerCart]);

  const addItem = useCallback(
    async (product, variant, quantity = 1) => {
      if (user) {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: variant.id, quantity }),
        });
        await loadServerCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const current = readGuestCart();
        const idx = current.findIndex((i) => i.variantId === variant.id);

        if (idx >= 0) {
          current[idx].quantity += quantity;
        } else {
          current.push({
            variantId: variant.id,
            productId: product.id,
            name: product.name,
            image_url: product.image_url,
            region: product.region,
            variantName: variant.variant_name,
            price: Number(variant.price),
            stock: variant.stock,
            quantity,
          });
        }

        writeGuestCart(current);
        setItems(current);
      }
    },
    [user, loadServerCart]
  );

  const updateQuantity = useCallback(
    async (item, quantity) => {
      const qty = Math.max(1, quantity);

      if (user) {
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: item.variantId, quantity: qty }),
        });
        await loadServerCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const current = readGuestCart().map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: qty } : i
        );
        writeGuestCart(current);
        setItems(current);
      }
    },
    [user, loadServerCart]
  );

  const removeItem = useCallback(
    async (item) => {
      if (user) {
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: item.variantId }),
        });
        await loadServerCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const current = readGuestCart().filter((i) => i.variantId !== item.variantId);
        writeGuestCart(current);
        setItems(current);
      }
    },
    [user, loadServerCart]
  );

  const totalCount = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
    0
  );

  return {
    items,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    totalCount,
    totalPrice,
    isGuest: !user,
  };
}