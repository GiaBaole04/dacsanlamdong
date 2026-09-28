"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartCount } from "@/hooks/useCartCount";
import UserMenu from "@/components/UserMenu";

/* =========================
   ICONS (dùng lại đúng bộ icon các trang khác đang dùng)
========================= */

function ArrowLeft({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRight({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function ShoppingBagIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function LeafIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MinusIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}

/* =========================
   HELPERS
========================= */

function formatPrice(price) {
  const number = Number(price);
  if (!Number.isFinite(number)) return "0đ";
  return `${number.toLocaleString("vi-VN")}đ`;
}

function readCart() {
  try {
    const saved = localStorage.getItem("cart");
    const cart = saved ? JSON.parse(saved) : [];
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  // Báo cho header và mọi component khác biết giỏ hàng vừa đổi
  window.dispatchEvent(new Event("cartUpdated"));
}

/* =========================
   PAGE
========================= */

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const cartCount = useCartCount();

  useEffect(() => {
    setCart(readCart());
    setLoaded(true);
  }, []);

  function updateQuantity(index, nextQuantity) {
    setCart((current) => {
      const updated = [...current];
      const maxStock = Number(updated[index]?.stock);
      let qty = Math.max(1, nextQuantity);

      if (Number.isFinite(maxStock) && maxStock > 0) {
        qty = Math.min(qty, maxStock);
      }

      updated[index] = { ...updated[index], quantity: qty };
      writeCart(updated);
      return updated;
    });
  }

  function removeItem(index) {
    setCart((current) => {
      const updated = current.filter((_, i) => i !== index);
      writeCart(updated);
      return updated;
    });
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#e4dfd2] bg-[#fbf8ef]/95 backdrop-blur">
        <div className="mx-auto flex h-[82px] max-w-[1400px] items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c8b98d] text-[#53633c]">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[17px] font-semibold tracking-[0.13em] text-[#344723]">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#8c7040]">LÂM ĐỒNG</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <Link href="/" className="text-[13px] font-medium text-[#626653] transition hover:text-[#344723]">Trang chủ</Link>
            <Link href="/products" className="text-[13px] font-medium text-[#626653] transition hover:text-[#344723]">Sản phẩm</Link>
            <Link href="/stories" className="text-[13px] font-medium text-[#626653] transition hover:text-[#344723]">Câu chuyện đặc sản</Link>
            <Link href="/about" className="text-[13px] font-medium text-[#626653] transition hover:text-[#344723]">Giới thiệu</Link>
          </nav>

          <div className="flex items-center gap-2">
            <UserMenu variant="icon" />
            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#eee8d9] text-[#344723]" aria-label="Giỏ hàng">
              <ShoppingBagIcon />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#b08b43] px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="border-b border-[#e7e0d1] bg-[#f8f5ec]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-5 text-[12px] lg:px-10">
          <Link href="/" className="text-[#7a7d6b] transition hover:text-[#344723]">Trang chủ</Link>
          <span className="text-[#b4ad9b]">/</span>
          <span className="font-medium text-[#344723]">Giỏ hàng</span>
        </div>
      </div>

      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
        <h1 className="font-serif text-3xl font-semibold text-[#344723] md:text-4xl">Giỏ hàng của bạn</h1>

        {!loaded ? null : cart.length === 0 ? (
          /* EMPTY STATE */
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ebe4d5] text-[#53633c]">
              <ShoppingBagIcon className="h-9 w-9" />
            </div>
            <p className="text-lg font-medium text-[#344723]">Giỏ hàng đang trống</p>
            <p className="mt-2 max-w-sm text-sm text-[#6f715f]">
              Hãy khám phá các đặc sản Lâm Đồng và thêm sản phẩm bạn thích vào giỏ hàng.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-3 bg-[#344723] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#263719]"
            >
              <ArrowLeft className="h-4 w-4" />
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            {/* DANH SÁCH SẢN PHẨM TRONG GIỎ */}
            <div className="flex flex-col gap-4">
              {cart.map((item, index) => (
                <div
                  key={`${item.productId}-${item.variantId}-${index}`}
                  className="flex gap-4 border border-[#e4dfd2] bg-[#fbf8ef] p-4"
                >
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden bg-[#eee8da]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#8c8d7d]">
                        <LeafIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-serif text-base font-semibold text-[#344723] hover:text-[#8c7040]"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <p className="mt-1 text-xs text-[#7a7c6c]">Quy cách: {item.variantName}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="flex h-8 w-8 items-center justify-center text-[#a3a58f] transition hover:text-[#b3442f]"
                        aria-label="Xóa sản phẩm"
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, Number(item.quantity) - 1)}
                          className="flex h-8 w-8 items-center justify-center border border-[#d8d0bd] bg-white text-[#53633c] transition hover:bg-[#eee8d9]"
                          aria-label="Giảm số lượng"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex h-8 w-10 items-center justify-center border-y border-[#d8d0bd] bg-white text-sm">
                          {item.quantity}
                        </div>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, Number(item.quantity) + 1)}
                          className="flex h-8 w-8 items-center justify-center border border-[#d8d0bd] bg-white text-[#53633c] transition hover:bg-[#eee8d9]"
                          aria-label="Tăng số lượng"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-sm font-semibold text-[#9b7130]">
                        {formatPrice(Number(item.price) * Number(item.quantity))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/products"
                className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#53633c] transition hover:text-[#344723]"
              >
                <ArrowLeft className="h-4 w-4" />
                Tiếp tục mua sắm
              </Link>
            </div>

            {/* TỔNG TIỀN */}
            <div className="h-fit border border-[#e1daca] bg-[#fbf8ef] p-6">
              <h2 className="font-serif text-lg font-semibold text-[#344723]">Tóm tắt đơn hàng</h2>

              <div className="mt-4 flex items-center justify-between border-t border-[#e1daca] pt-4 text-sm">
                <span className="text-[#6f715f]">Tạm tính ({cartCount} sản phẩm)</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#6f715f]">Phí vận chuyển</span>
                <span className="text-[#6f715f]">Tính khi đặt hàng</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#e1daca] pt-4">
                <span className="font-serif text-base font-semibold text-[#344723]">Tổng cộng</span>
                <span className="font-serif text-xl font-semibold text-[#9b7130]">{formatPrice(total)}</span>
              </div>

              <button
                type="button"
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 bg-[#344723] text-sm font-semibold text-white transition hover:bg-[#263719]"
              >
                Tiến hành đặt hàng
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-3 text-center text-[11px] text-[#a3a58f]">
                Chức năng đặt hàng sẽ hoàn thiện sau khi có đăng nhập tài khoản.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}