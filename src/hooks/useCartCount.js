"use client";

import { useEffect, useState } from "react";

/**
 * Đọc tổng số lượng sản phẩm trong giỏ hàng từ localStorage.
 * Dùng riêng khi chỉ cần lấy 1 lần, không cần tự cập nhật theo thời gian thực.
 */
export function getCartCount() {
  try {
    const saved = localStorage.getItem("cart");
    const cart = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(cart)) {
      return 0;
    }

    return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Hook dùng trong component: tự động cập nhật số lượng giỏ hàng
 * mỗi khi có thay đổi (thêm/xóa/sửa giỏ hàng ở bất kỳ trang nào).
 *
 * Cách dùng: const cartCount = useCartCount();
 */
export function useCartCount() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function update() {
      setCartCount(getCartCount());
    }

    update();

    // Khi giỏ hàng đổi ở tab/cửa sổ khác
    window.addEventListener("storage", update);
    // Khi giỏ hàng đổi ngay trong cùng 1 tab (dispatch thủ công, xem hàm addToCart bên dưới)
    window.addEventListener("cartUpdated", update);

    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cartUpdated", update);
    };
  }, []);

  return cartCount;
}

/**
 * Lưu ý quan trọng: mỗi khi có nơi nào sửa localStorage("cart")
 * (thêm sản phẩm, xóa sản phẩm, đổi số lượng...), PHẢI gọi dòng sau
 * ngay sau đó để mọi trang khác đang mở (header, icon giỏ hàng...)
 * biết mà cập nhật lại số liệu ngay lập tức, không cần load lại trang:
 *
 *   window.dispatchEvent(new Event("cartUpdated"));
 */