"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import {
  FREE_SHIPPING_THRESHOLD,
  calcShippingFee,
  formatPrice,
  validateShipping,
} from "@/lib/orderUtils";

/* =========================
   ICONS
========================= */

function ArrowLeft({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
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

function ShoppingBagIcon({ className = "h-9 w-9" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CashIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.5 9.5v.01M17.5 14.5v.01" />
    </svg>
  );
}

function AlertIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/* =========================
   Ô NHẬP LIỆU
========================= */

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[12px] text-[#a04a2e]">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full border bg-[#fbf8ef] px-4 text-sm text-[#292c18] outline-none transition placeholder:text-[#a3a58f] focus:border-[#344723]";

/* =========================
   PAGE
========================= */

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("buyNow") === "1";

  const { user, loading: authLoading } = useAuth();
  const { items: cartItems, loading: cartLoading } = useCart();

  // "Mua ngay": sản phẩm được trang chi tiết lưu tạm trong sessionStorage
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState(isBuyNow);

  const [receiverName, setReceiverName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [placed, setPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (!isBuyNow) {
      setLoadingBuyNow(false);
      return;
    }

    try {
      const saved = sessionStorage.getItem("checkoutItem");
      setBuyNowItem(saved ? JSON.parse(saved) : null);
    } catch {
      setBuyNowItem(null);
    } finally {
      setLoadingBuyNow(false);
    }
  }, [isBuyNow]);

  // Danh sách sẽ đặt: sản phẩm "Mua ngay", hoặc toàn bộ giỏ hàng
  const items = useMemo(() => {
    if (isBuyNow) return buyNowItem ? [buyNowItem] : [];
    return cartItems || [];
  }, [isBuyNow, buyNowItem, cartItems]);

  const totalCount = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
    0
  );
  const shippingFee = calcShippingFee(subtotal);
  const totalPrice = subtotal + shippingFee;

  /* Chưa đăng nhập thì chuyển sang đăng nhập, xong quay lại đúng trang này */
  useEffect(() => {
    if (!authLoading && !user) {
      const back = isBuyNow ? "/checkout?buyNow=1" : "/checkout";
      router.replace(`/login?next=${encodeURIComponent(back)}`);
    }
  }, [authLoading, user, router, isBuyNow]);

  /* Điền sẵn tên người nhận bằng tên tài khoản */
  useEffect(() => {
    if (user?.name) {
      setReceiverName((current) => current || user.name);
    }
  }, [user]);

  /* Nhấn Esc để đóng hộp xác nhận (khi không đang gửi) */
  useEffect(() => {
    if (!confirmOpen) return;

    function handleKey(e) {
      if (e.key === "Escape" && !submitting) setConfirmOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [confirmOpen, submitting]);

  const overStock = items.filter(
    (i) => Number.isFinite(Number(i.stock)) && Number(i.quantity) > Number(i.stock)
  );

  function handleReview(e) {
    e.preventDefault();
    setServerError("");

    const result = validateShipping({ receiverName, phone, shippingAddress, note });
    setErrors(result.errors);

    if (Object.keys(result.errors).length > 0) return;

    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (submitting) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverName,
          phone,
          shippingAddress,
          note,
          paymentMethod,
          // "Mua ngay": chỉ gửi mã quy cách + số lượng, giá do máy chủ tự lấy từ database
          ...(isBuyNow
            ? { items: [{ variantId: buyNowItem?.variantId, quantity: buyNowItem?.quantity }] }
            : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không đặt được hàng, vui lòng thử lại.");
      }

      setPlaced(true);
      if (isBuyNow) sessionStorage.removeItem("checkoutItem");
      window.dispatchEvent(new Event("cartUpdated"));
      router.push(`/orders/${data.orderId}?placed=1`);
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  }

  const ready = !authLoading && !loadingBuyNow && (isBuyNow || !cartLoading) && user;

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header />

      {/* BREADCRUMB */}
      <div className="border-b border-[#e7e0d1] bg-[#f8f5ec]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-5 text-[12px] lg:px-10">
          <Link href="/" className="text-[#7a7d6b] transition hover:text-[#344723]">Trang chủ</Link>
          <span className="text-[#b4ad9b]">/</span>
          <Link href="/cart" className="text-[#7a7d6b] transition hover:text-[#344723]">Giỏ hàng</Link>
          <span className="text-[#b4ad9b]">/</span>
          <span className="font-medium text-[#344723]">Đặt hàng</span>
        </div>
      </div>

      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[#b08b43]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
            Hoàn tất đơn hàng
          </span>
        </div>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-[#344723] md:text-5xl">Đặt hàng</h1>
        <p className="mt-3 text-sm text-[#737665]">
          Điền thông tin nhận hàng để chúng tôi chuẩn bị đơn hàng cho bạn.
        </p>

        {!ready || placed ? (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="h-96 animate-pulse border border-[#e4dfd2] bg-[#efe9da]" />
            <div className="h-72 animate-pulse border border-[#e4dfd2] bg-[#efe9da]" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ebe4d5] text-[#53633c]">
              <ShoppingBagIcon />
            </div>
            <p className="text-lg font-medium text-[#344723]">Giỏ hàng đang trống</p>
            <p className="mt-2 max-w-sm text-sm text-[#6f715f]">
              {isBuyNow
                ? "Không tìm thấy sản phẩm bạn vừa chọn. Vui lòng chọn lại sản phẩm."
                : "Hãy thêm sản phẩm vào giỏ hàng trước khi đặt hàng."}
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-3 bg-[#344723] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#263719]"
            >
              <ArrowLeft />
              Xem sản phẩm
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReview} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            {/* ===== CỘT TRÁI: THÔNG TIN GIAO HÀNG ===== */}
            <div className="flex flex-col gap-8">
              <div className="border border-[#e4dfd2] bg-[#fbf8ef] p-6 lg:p-8">
                <h2 className="font-serif text-xl font-semibold text-[#344723]">Thông tin giao hàng</h2>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field id="receiverName" label="Họ tên người nhận" error={errors.receiverName}>
                    <input
                      id="receiverName"
                      type="text"
                      autoComplete="name"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className={`${inputClass} h-12 ${errors.receiverName ? "border-[#d9a08b]" : "border-[#d9d1bf]"}`}
                    />
                  </Field>

                  <Field id="phone" label="Số điện thoại" error={errors.phone}>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className={`${inputClass} h-12 ${errors.phone ? "border-[#d9a08b]" : "border-[#d9d1bf]"}`}
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field id="shippingAddress" label="Địa chỉ nhận hàng" error={errors.shippingAddress}>
                    <input
                      id="shippingAddress"
                      type="text"
                      autoComplete="street-address"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                      className={`${inputClass} h-12 ${errors.shippingAddress ? "border-[#d9a08b]" : "border-[#d9d1bf]"}`}
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field id="note" label="Ghi chú (không bắt buộc)" error={errors.note}>
                    <textarea
                      id="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao…"
                      className={`${inputClass} resize-none py-3 ${errors.note ? "border-[#d9a08b]" : "border-[#d9d1bf]"}`}
                    />
                  </Field>
                </div>
              </div>

              <div className="border border-[#e4dfd2] bg-[#fbf8ef] p-6 lg:p-8">
                <h2 className="font-serif text-xl font-semibold text-[#344723]">Phương thức thanh toán</h2>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      value: "cod",
                      title: "Thanh toán khi nhận hàng (COD)",
                      desc: "Bạn kiểm tra hàng và thanh toán bằng tiền mặt cho nhân viên giao hàng.",
                    },
                    {
                      value: "bank",
                      title: "Chuyển khoản ngân hàng",
                      desc: "Sau khi đặt hàng, bạn nhận mã QR đã điền sẵn số tiền và nội dung, quét được bằng MoMo hoặc ứng dụng ngân hàng. Đơn được xử lý sau khi cửa hàng nhận được tiền.",
                    },
                  ].map((option) => {
                    const selected = paymentMethod === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-4 border p-4 transition ${
                          selected ? "border-[#344723] bg-[#f3f6ee]" : "border-[#d9d1bf] bg-white hover:border-[#53633c]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={option.value}
                          checked={selected}
                          onChange={() => setPaymentMethod(option.value)}
                          className="mt-1 h-4 w-4 accent-[#344723]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#344723]">
                            <CashIcon className="h-5 w-5" />
                            {option.title}
                          </div>
                          <p className="mt-1 text-[13px] leading-5 text-[#6f715f]">{option.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ===== CỘT PHẢI: TÓM TẮT ĐƠN ===== */}
            <div className="h-fit border border-[#e1daca] bg-[#fbf8ef] p-6">
              <h2 className="font-serif text-lg font-semibold text-[#344723]">
                Đơn hàng của bạn ({totalCount} sản phẩm)
              </h2>

              <ul className="mt-4 divide-y divide-[#e9e3d4] border-y border-[#e9e3d4]">
                {items.map((item) => (
                  <li key={item.itemId ?? item.variantId} className="flex gap-3 py-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-[#eee8da]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#8c8d7d]">
                          <LeafIcon />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-serif text-[15px] font-semibold text-[#344723]">
                        {item.name}
                      </div>
                      <div className="mt-0.5 text-xs text-[#7a7c6c]">
                        {item.variantName} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-[#9b7130]">
                      {formatPrice(Number(item.price) * Number(item.quantity))}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-[#6f715f]">Tạm tính</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#6f715f]">Phí vận chuyển</span>
                <span className={`font-medium ${shippingFee === 0 ? "text-[#3b6a2a]" : ""}`}>
                  {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-[#a3a58f]">
                Miễn phí vận chuyển cho đơn trên {formatPrice(FREE_SHIPPING_THRESHOLD)}.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-[#e1daca] pt-4">
                <span className="font-serif text-base font-semibold text-[#344723]">Tổng cộng</span>
                <span className="font-serif text-xl font-semibold text-[#9b7130]">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              {overStock.length > 0 && (
                <div className="mt-5 flex items-start gap-3 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]">
                  <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    {overStock.map((i) => `${i.name} (${i.variantName}) chỉ còn ${i.stock}`).join("; ")}.{" "}
                    <Link href="/cart" className="font-semibold underline underline-offset-4">
                      Chỉnh lại giỏ hàng
                    </Link>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={overStock.length > 0}
                className="mt-6 flex h-14 w-full items-center justify-center bg-[#344723] text-sm font-semibold text-white transition hover:bg-[#263719] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đặt hàng
              </button>

              <Link
                href="/cart"
                className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-[#53633c] transition hover:text-[#344723]"
              >
                <ArrowLeft />
                Quay lại giỏ hàng
              </Link>
            </div>
          </form>
        )}
      </section>

      {/* ===== HỘP XÁC NHẬN ĐẶT HÀNG ===== */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c2412]/55 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-[480px] border border-[#e4dfd2] bg-[#fbf8ef] p-7 shadow-[0_24px_60px_rgba(28,36,18,0.3)]">
            <h2 id="confirm-title" className="font-serif text-2xl font-semibold text-[#344723]">
              Xác nhận đặt hàng
            </h2>
            <p className="mt-2 text-sm text-[#6f715f]">
              Vui lòng kiểm tra lại thông tin trước khi đặt.
            </p>

            <dl className="mt-5 space-y-3 border-y border-[#e9e3d4] py-5 text-sm">
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-[#7a7c6c]">Người nhận</dt>
                <dd className="font-medium">{receiverName.trim()}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-[#7a7c6c]">Điện thoại</dt>
                <dd className="font-medium">{phone.trim()}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-[#7a7c6c]">Địa chỉ</dt>
                <dd className="font-medium">{shippingAddress.trim()}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-[#7a7c6c]">Thanh toán</dt>
                <dd className="font-medium">
                  {paymentMethod === "bank" ? "Chuyển khoản ngân hàng" : "Khi nhận hàng (COD)"}
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-[#7a7c6c]">Số sản phẩm</dt>
                <dd className="font-medium">{totalCount}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-[#7a7c6c]">Phí vận chuyển</dt>
                <dd className="font-medium">{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-serif text-base font-semibold text-[#344723]">Tổng thanh toán</span>
              <span className="font-serif text-2xl font-semibold text-[#9b7130]">{formatPrice(totalPrice)}</span>
            </div>

            {serverError && (
              <div className="mt-5 flex items-start gap-3 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]" role="alert">
                <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>{serverError}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="h-12 flex-1 border border-[#d9d1bf] bg-white text-sm font-semibold text-[#4d513e] transition hover:border-[#344723] disabled:opacity-50"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="h-12 flex-1 bg-[#344723] text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60"
              >
                {submitting ? "Đang đặt hàng…" : "Xác nhận đặt hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}