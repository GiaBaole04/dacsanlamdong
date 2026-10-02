"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  BANK_INFO,
  ORDER_STATUS,
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  formatDateTime,
  formatOrderCode,
  formatPrice,
} from "@/lib/orderUtils";

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

function CheckIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 12 4 4L19 6" />
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

const STEPS = [
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipped", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
];

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.id;
  const justPlaced = searchParams.get("placed") === "1";

  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=/orders/${orderId}`);
    }
  }, [authLoading, user, router, orderId]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tải được đơn hàng.");

      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (authLoading || !user || !orderId) return;
    load();
  }, [authLoading, user, orderId, load]);

  async function handleCancel() {
    if (cancelling) return;

    setCancelling(true);
    setCancelError("");

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Không hủy được đơn hàng.");

      setCancelOpen(false);
      await load();
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const status = order ? ORDER_STATUS[order.status] || ORDER_STATUS.pending : null;
  const currentStep = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header />

      <div className="border-b border-[#e7e0d1] bg-[#f8f5ec]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-5 text-[12px] lg:px-10">
          <Link href="/" className="text-[#7a7d6b] transition hover:text-[#344723]">Trang chủ</Link>
          <span className="text-[#b4ad9b]">/</span>
          <Link href="/orders" className="text-[#7a7d6b] transition hover:text-[#344723]">Đơn hàng của tôi</Link>
          <span className="text-[#b4ad9b]">/</span>
          <span className="font-medium text-[#344723]">{order ? formatOrderCode(order.id) : "Chi tiết"}</span>
        </div>
      </div>

      <section className="mx-auto max-w-[1000px] px-6 py-10 lg:py-14">
        {loading || authLoading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse bg-[#efe9da]" />
            <div className="h-64 animate-pulse bg-[#efe9da]" />
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center py-16 text-center">
            <h1 className="font-serif text-3xl font-semibold text-[#344723]">Không tìm thấy đơn hàng</h1>
            <p className="mt-3 max-w-md text-sm text-[#6f715f]">
              Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn.
            </p>
            <Link
              href="/orders"
              className="mt-8 inline-flex items-center gap-3 bg-[#344723] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#263719]"
            >
              <ArrowLeft />
              Về danh sách đơn hàng
            </Link>
          </div>
        ) : error || !order ? (
          <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">
            {error || "Không tải được đơn hàng."}
          </p>
        ) : (
          <>
            {justPlaced && (
              <div className="mb-8 flex items-start gap-4 border border-[#cfe0c3] bg-[#edf5e6] px-5 py-5" role="status">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#3b6a2a] text-white">
                  <CheckIcon />
                </span>
                <div>
                  <div className="font-serif text-xl font-semibold text-[#2f5420]">Đặt hàng thành công!</div>
                  <p className="mt-1 text-sm leading-6 text-[#4b6a3c]">
                    Cảm ơn bạn đã đặt hàng. Mã đơn của bạn là{" "}
                    <strong>{formatOrderCode(order.id)}</strong>. Cửa hàng sẽ sớm xác nhận đơn.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-[#344723]">
                  Đơn hàng {formatOrderCode(order.id)}
                </h1>
                <p className="mt-1 text-sm text-[#7a7c6c]">Đặt lúc {formatDateTime(order.createdAt)}</p>
              </div>
              <span className={`px-4 py-1.5 text-sm font-semibold ${status.badge}`}>{status.label}</span>
            </div>

            {/* TIẾN TRÌNH ĐƠN */}
            <div className="mt-8 border border-[#e4dfd2] bg-[#fbf8ef] px-5 py-6">
              {order.status === "cancelled" ? (
                <div className="flex items-center gap-3 text-sm text-[#9a4528]">
                  <AlertIcon className="h-5 w-5" />
                  Đơn hàng đã được hủy. Số lượng sản phẩm đã được hoàn lại kho.
                </div>
              ) : (
                <ol className="grid grid-cols-4 gap-2">
                  {STEPS.map((step, index) => {
                    const done = index <= currentStep;
                    return (
                      <li key={step.key} className="flex flex-col items-center text-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            done ? "bg-[#344723] text-white" : "bg-[#e9e3d4] text-[#a3a58f]"
                          }`}
                        >
                          {done ? <CheckIcon className="h-4 w-4" /> : index + 1}
                        </span>
                        <span className={`mt-2 text-[12px] ${done ? "font-semibold text-[#344723]" : "text-[#a3a58f]"}`}>
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {order.paymentMethod === "bank" &&
              order.paymentStatus === "unpaid" &&
              order.status !== "cancelled" && (
                <div className="mt-6 border border-[#e8d9ae] bg-[#fbf4dd] px-5 py-5" data-testid="bank-box">
                  <h2 className="font-serif text-lg font-semibold text-[#6b551f]">
                    Hướng dẫn chuyển khoản
                  </h2>
                  <p className="mt-1 text-sm text-[#7d6a35]">
                    Vui lòng chuyển khoản đúng số tiền và nội dung bên dưới. Đơn hàng sẽ được xử lý sau khi cửa hàng
                    nhận được tiền.
                  </p>
                  <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-[#9a8650]">Ngân hàng</dt>
                      <dd className="font-medium">{BANK_INFO.bankName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#9a8650]">Số tài khoản</dt>
                      <dd className="font-medium">{BANK_INFO.accountNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#9a8650]">Chủ tài khoản</dt>
                      <dd className="font-medium">{BANK_INFO.accountName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#9a8650]">Số tiền</dt>
                      <dd className="font-semibold text-[#9b7130]">{formatPrice(order.totalAmount)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-[#9a8650]">Nội dung chuyển khoản</dt>
                      <dd className="font-semibold tracking-wide">{formatOrderCode(order.id)}</dd>
                    </div>
                  </dl>
                </div>
              )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              {/* SẢN PHẨM */}
              <div className="border border-[#e4dfd2] bg-[#fbf8ef]">
                <h2 className="border-b border-[#ece6d7] px-5 py-4 font-serif text-lg font-semibold text-[#344723]">
                  Sản phẩm đã đặt
                </h2>
                <ul className="divide-y divide-[#ece6d7]">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex gap-4 px-5 py-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden bg-[#eee8da]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#8c8d7d]">
                            <LeafIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="font-serif text-base font-semibold text-[#344723]">{item.productName}</div>
                          <div className="mt-0.5 text-xs text-[#7a7c6c]">Quy cách: {item.variantName}</div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#7a7c6c]">
                            {formatPrice(item.price)} × {item.quantity}
                          </span>
                          <span className="font-semibold text-[#9b7130]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* THÔNG TIN */}
              <div className="space-y-6">
                <div className="border border-[#e4dfd2] bg-[#fbf8ef] p-5">
                  <h2 className="font-serif text-lg font-semibold text-[#344723]">Thông tin nhận hàng</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-[#7a7c6c]">Người nhận</dt>
                      <dd className="font-medium">{order.receiverName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#7a7c6c]">Điện thoại</dt>
                      <dd className="font-medium">{order.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#7a7c6c]">Địa chỉ</dt>
                      <dd className="font-medium">{order.shippingAddress}</dd>
                    </div>
                    {order.note && (
                      <div>
                        <dt className="text-xs text-[#7a7c6c]">Ghi chú</dt>
                        <dd className="font-medium">{order.note}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-[#7a7c6c]">Thanh toán</dt>
                      <dd className="font-medium">
                        {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                        <span className="ml-2 text-xs font-normal text-[#7a7c6c]">
                          ({PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus})
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border border-[#e4dfd2] bg-[#fbf8ef] p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6f715f]">Tạm tính</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[#6f715f]">Phí vận chuyển</span>
                    <span className={order.shippingFee === 0 ? "text-[#3b6a2a]" : ""}>
                      {order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#e1daca] pt-4">
                    <span className="font-serif text-base font-semibold text-[#344723]">Tổng cộng</span>
                    <span className="font-serif text-xl font-semibold text-[#9b7130]">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {order.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError("");
                      setCancelOpen(true);
                    }}
                    className="h-12 w-full border border-[#d9a08b] bg-white text-sm font-semibold text-[#9a4528] transition hover:bg-[#faf0ea]"
                  >
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#53633c] transition hover:text-[#344723]"
              >
                <ArrowLeft />
                Tất cả đơn hàng
              </Link>
            </div>
          </>
        )}
      </section>

      {/* HỘP XÁC NHẬN HỦY ĐƠN */}
      {cancelOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c2412]/55 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <div className="w-full max-w-[420px] border border-[#e4dfd2] bg-[#fbf8ef] p-7 shadow-[0_24px_60px_rgba(28,36,18,0.3)]">
            <h2 id="cancel-title" className="font-serif text-2xl font-semibold text-[#344723]">
              Hủy đơn hàng?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6f715f]">
              Bạn chắc chắn muốn hủy đơn <strong>{order ? formatOrderCode(order.id) : ""}</strong>? Hành động này
              không thể hoàn tác.
            </p>

            {cancelError && (
              <div className="mt-4 flex items-start gap-3 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]" role="alert">
                <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>{cancelError}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                disabled={cancelling}
                className="h-12 flex-1 border border-[#d9d1bf] bg-white text-sm font-semibold text-[#4d513e] transition hover:border-[#344723] disabled:opacity-50"
              >
                Giữ đơn hàng
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="h-12 flex-1 bg-[#9a4528] text-sm font-semibold text-white transition hover:bg-[#7e3720] disabled:opacity-60"
              >
                {cancelling ? "Đang hủy…" : "Hủy đơn hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <OrderDetailContent />
    </Suspense>
  );
}