"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";

/* =========================
   ICONS
========================= */

function ArrowLeft({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRight({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7-7" />
    </svg>
  );
}

function MapPinIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ShoppingBagIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

/* =========================
   HELPERS
========================= */

function formatPrice(price) {
  const number = Number(price);

  if (!Number.isFinite(number)) {
    return "0đ";
  }

  return `${number.toLocaleString("vi-VN")}đ`;
}

/* =========================
   PAGE
========================= */

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    items: cartItems,
    loading: cartLoading,
    totalPrice: cartTotal,
    isGuest,
  } = useCart();

  const [buyNowItem, setBuyNowItem] = useState(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState(true);

  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  const isBuyNow = searchParams.get("buyNow") === "1";

  /* =========================
     LOAD BUY NOW ITEM
  ========================= */

  useEffect(() => {
    if (!isBuyNow) {
      setLoadingBuyNow(false);
      return;
    }

    try {
      const saved = sessionStorage.getItem("checkoutItem");

      if (saved) {
        setBuyNowItem(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Không đọc được sản phẩm mua ngay:", error);
    } finally {
      setLoadingBuyNow(false);
    }
  }, [isBuyNow]);

  /* =========================
     ITEMS TO CHECKOUT
  ========================= */

  const checkoutItems = useMemo(() => {
    if (isBuyNow) {
      return buyNowItem ? [buyNowItem] : [];
    }

    return cartItems || [];
  }, [isBuyNow, buyNowItem, cartItems]);

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [checkoutItems]);

  const shippingFee = subtotal > 500000 ? 0 : 30000;

  const total = subtotal + shippingFee;

  /* =========================
     FORM
  ========================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (checkoutItems.length === 0) {
      return;
    }

    if (!customer.fullName.trim()) {
      alert("Vui lòng nhập họ và tên.");
      return;
    }

    if (!customer.phone.trim()) {
      alert("Vui lòng nhập số điện thoại.");
      return;
    }

    if (!customer.address.trim()) {
      alert("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }

    setSubmitting(true);

    try {
      /*
       * Hiện tại tạo mã đơn để hoàn thiện luồng giao diện.
       * Khi kết nối API orders, phần này sẽ gửi dữ liệu
       * customer + checkoutItems lên server.
       */

      const code = `LDM${Date.now().toString().slice(-8)}`;

      setOrderCode(code);

      sessionStorage.removeItem("checkoutItem");

      setSuccess(true);
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert("Không thể đặt hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (cartLoading || loadingBuyNow) {
    return (
      <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
        <Header />

        <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
          <div className="animate-pulse">
            <div className="h-10 w-72 rounded bg-[#e8e1d2]" />

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="h-[500px] rounded bg-[#e8e1d2]" />
              <div className="h-[500px] rounded bg-[#e8e1d2]" />
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  /* =========================
     SUCCESS
  ========================= */

  if (success) {
    return (
      <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
        <Header />

        <section className="flex min-h-[65vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl border border-[#ded6c5] bg-[#fbf8ef] px-8 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8efdf] text-[#344723]">
              <CheckIcon className="h-9 w-9" />
            </div>

            <div className="mt-7 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
              Đặt hàng thành công
            </div>

            <h1 className="mt-3 font-serif text-4xl font-semibold text-[#344723]">
              Cảm ơn bạn đã đặt hàng
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#6f715f]">
              Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ với bạn
              để xác nhận thông tin giao hàng.
            </p>

            <div className="mt-7 border-y border-[#e1daca] py-5">
              <div className="text-xs text-[#858878]">
                Mã đơn hàng
              </div>

              <div className="mt-2 font-serif text-2xl font-semibold text-[#9b7130]">
                {orderCode}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="flex h-12 flex-1 items-center justify-center border border-[#344723] text-sm font-semibold text-[#344723] transition hover:bg-[#344723] hover:text-white"
              >
                Tiếp tục mua sắm
              </Link>

              <Link
                href="/"
                className="flex h-12 flex-1 items-center justify-center bg-[#344723] text-sm font-semibold text-white transition hover:bg-[#263719]"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  /* =========================
     EMPTY
  ========================= */

  if (checkoutItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
        <Header />

        <section className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#ebe4d5] text-[#53633c]">
              <ShoppingBagIcon className="h-9 w-9" />
            </div>

            <h1 className="mt-6 font-serif text-3xl font-semibold text-[#344723]">
              Chưa có sản phẩm để đặt hàng
            </h1>

            <p className="mt-3 text-sm text-[#737665]">
              Hãy thêm sản phẩm vào giỏ hàng trước khi tiến hành đặt hàng.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex h-12 items-center gap-2 bg-[#344723] px-7 text-sm font-semibold text-white transition hover:bg-[#263719]"
            >
              Xem sản phẩm
              <ArrowRight />
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  /* =========================
     MAIN
  ========================= */

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header />

      {/* BREADCRUMB */}
      <div className="border-b border-[#e7e0d1] bg-[#f8f5ec]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-5 text-[12px] lg:px-10">
          <Link
            href="/"
            className="text-[#7a7d6b] transition hover:text-[#344723]"
          >
            Trang chủ
          </Link>

          <span className="text-[#b4ad9b]">/</span>

          <Link
            href="/cart"
            className="text-[#7a7d6b] transition hover:text-[#344723]"
          >
            Giỏ hàng
          </Link>

          <span className="text-[#b4ad9b]">/</span>

          <span className="font-medium text-[#344723]">
            Đặt hàng
          </span>
        </div>
      </div>

      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#b08b43]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
              Hoàn tất đơn hàng
            </span>
          </div>

          <h1 className="mt-3 font-serif text-4xl font-semibold text-[#344723] md:text-5xl">
            Đặt hàng
          </h1>

          <p className="mt-3 text-sm text-[#737665]">
            Điền thông tin nhận hàng để chúng tôi chuẩn bị đơn hàng cho bạn.
          </p>
        </div>

        {isGuest && (
          <div className="mb-8 border border-[#e1daca] bg-[#f1eadb] px-5 py-4 text-sm text-[#6b551f]">
            Bạn đang đặt hàng với tư cách khách.
            {" "}
            <Link
              href="/login"
              className="font-semibold underline underline-offset-4"
            >
              Đăng nhập
            </Link>
            {" "}
            để lưu lại lịch sử đơn hàng vào tài khoản.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.75fr]">
            {/* LEFT */}
            <div className="space-y-7">
              {/* CUSTOMER */}
              <div className="border border-[#ded6c5] bg-[#fbf8ef] p-6 md:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8efdf] text-[#344723]">
                    1
                  </div>

                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-[#344723]">
                      Thông tin nhận hàng
                    </h2>

                    <p className="mt-1 text-xs text-[#858878]">
                      Thông tin dùng để liên hệ và giao hàng
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#344723]">
                      Họ và tên *
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      value={customer.fullName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="h-12 w-full border border-[#d9d1bf] bg-[#fffdf7] px-4 text-sm outline-none transition focus:border-[#53633c]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#344723]">
                      Số điện thoại *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={customer.phone}
                      onChange={handleChange}
                      placeholder="09xx xxx xxx"
                      className="h-12 w-full border border-[#d9d1bf] bg-[#fffdf7] px-4 text-sm outline-none transition focus:border-[#53633c]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#344723]">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={customer.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="h-12 w-full border border-[#d9d1bf] bg-[#fffdf7] px-4 text-sm outline-none transition focus:border-[#53633c]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#344723]">
                      Địa chỉ nhận hàng *
                    </label>

                    <div className="relative">
                      <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c7040]" />

                      <input
                        type="text"
                        name="address"
                        value={customer.address}
                        onChange={handleChange}
                        placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                        className="h-12 w-full border border-[#d9d1bf] bg-[#fffdf7] pl-11 pr-4 text-sm outline-none transition focus:border-[#53633c]"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#344723]">
                      Ghi chú đơn hàng
                    </label>

                    <textarea
                      name="note"
                      value={customer.note}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                      className="w-full resize-none border border-[#d9d1bf] bg-[#fffdf7] px-4 py-3 text-sm outline-none transition focus:border-[#53633c]"
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT */}
              <div className="border border-[#ded6c5] bg-[#fbf8ef] p-6 md:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8efdf] text-[#344723]">
                    2
                  </div>

                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-[#344723]">
                      Phương thức thanh toán
                    </h2>

                    <p className="mt-1 text-xs text-[#858878]">
                      Chọn phương thức thanh toán khi nhận hàng
                    </p>
                  </div>
                </div>

                <label
                  className={`flex cursor-pointer items-start gap-4 border p-5 transition ${
                    paymentMethod === "cod"
                      ? "border-[#344723] bg-[#f0f3e9]"
                      : "border-[#ddd5c4] bg-[#fffdf7]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 accent-[#344723]"
                  />

                  <div>
                    <div className="text-sm font-semibold text-[#344723]">
                      Thanh toán khi nhận hàng
                    </div>

                    <p className="mt-1 text-xs leading-6 text-[#777968]">
                      Bạn thanh toán trực tiếp cho nhân viên giao hàng khi
                      nhận sản phẩm.
                    </p>
                  </div>
                </label>

                <label
                  className={`mt-3 flex cursor-pointer items-start gap-4 border p-5 transition ${
                    paymentMethod === "bank"
                      ? "border-[#344723] bg-[#f0f3e9]"
                      : "border-[#ddd5c4] bg-[#fffdf7]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === "bank"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 accent-[#344723]"
                  />

                  <div>
                    <div className="text-sm font-semibold text-[#344723]">
                      Chuyển khoản ngân hàng
                    </div>

                    <p className="mt-1 text-xs leading-6 text-[#777968]">
                      Thông tin tài khoản thanh toán sẽ được hiển thị sau khi
                      xác nhận đơn hàng.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="sticky top-24 border border-[#ded6c5] bg-[#fbf8ef] p-6 md:p-7">
                <div className="flex items-center justify-between border-b border-[#ded6c5] pb-5">
                  <h2 className="font-serif text-2xl font-semibold text-[#344723]">
                    Đơn hàng
                  </h2>

                  <span className="text-xs text-[#858878]">
                    {checkoutItems.length} sản phẩm
                  </span>
                </div>

                <div className="divide-y divide-[#e6dfd0]">
                  {checkoutItems.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.variantId}-${index}`}
                      className="flex gap-4 py-5"
                    >
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden bg-[#eee8da]">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#8c8d7d]">
                            <ShoppingBagIcon className="h-6 w-6" />
                          </div>
                        )}

                        <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#344723] px-1 text-[10px] font-semibold text-white">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-serif text-base font-semibold text-[#344723] hover:text-[#8c7040]"
                        >
                          {item.name}
                        </Link>

                        {item.variantName && (
                          <p className="mt-1 text-xs text-[#7a7c6c]">
                            Quy cách: {item.variantName}
                          </p>
                        )}

                        <div className="mt-2 text-sm font-semibold text-[#9b7130]">
                          {formatPrice(
                            Number(item.price) * Number(item.quantity)
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-[#ded6c5] pt-5 text-sm">
                  <div className="flex justify-between text-[#737665]">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-[#737665]">
                    <span>Phí vận chuyển</span>

                    <span>
                      {shippingFee === 0
                        ? "Miễn phí"
                        : formatPrice(shippingFee)}
                    </span>
                  </div>

                  {subtotal < 500000 && (
                    <p className="text-xs leading-5 text-[#8b8068]">
                      Miễn phí vận chuyển cho đơn từ 500.000đ.
                    </p>
                  )}

                  <div className="flex items-end justify-between border-t border-[#ded6c5] pt-5">
                    <span className="font-serif text-lg font-semibold text-[#344723]">
                      Tổng cộng
                    </span>

                    <span className="font-serif text-2xl font-semibold text-[#9b7130]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-7 flex h-14 w-full items-center justify-center gap-3 bg-[#344723] px-6 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      Đặt hàng
                      <ArrowRight />
                    </>
                  )}
                </button>

                <Link
                  href={isBuyNow ? "/products" : "/cart"}
                  className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-[#68705b] transition hover:text-[#344723]"
                >
                  <ArrowLeft />
                  {isBuyNow ? "Quay lại sản phẩm" : "Quay lại giỏ hàng"}
                </Link>
              </div>
            </div>
          </div>
        </form>
      </section>

      <Footer />
    </main>
  );
}