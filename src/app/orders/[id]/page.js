"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { ContourPattern, LandscapeScene, RidgeDivider } from "@/components/Landscape";
import { useAuth } from "@/hooks/useAuth";
import {
  ORDER_STATUS,
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  formatDateTime,
  formatOrderCode,
  formatPrice,
} from "@/lib/orderUtils";

/* =========================================================
   BIỂU TƯỢNG
========================================================= */

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function ArrowLeft({ className = "h-4 w-4" }) {
  return (
    <svg {...iconBase} strokeWidth={1.8} className={className}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRight({ className = "h-4 w-4" }) {
  return (
    <svg {...iconBase} strokeWidth={1.8} className={className}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function LeafIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={2.2} className={className}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconBase} strokeWidth={1.8} className={className}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ClockIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function BoxIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

function TruckIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="M3 6.5h11v9H3z" />
      <path d="M14 10h4l3 3v2.5h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function HomeIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="M4 11 12 4l8 7v9H4v-9Z" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function PinIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function WalletIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <rect x="3.5" y="6" width="17" height="13" rx="2.5" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14.5" r="1.2" />
    </svg>
  );
}

// Chim bay ngang bầu trời (lớp .bird có sẵn trong globals.css)
function Bird({ top, delay, scale = 1 }) {
  return (
    <svg
      className="bird"
      style={{ top, animationDelay: delay, transform: `scale(${scale})` }}
      width="26"
      height="12"
      viewBox="0 0 26 12"
      fill="none"
      stroke="#fff7dd"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M1 8c4-1 7-4 12-1 5-3 8 0 12 1" />
    </svg>
  );
}

/* =========================================================
   TIẾN TRÌNH ĐƠN HÀNG
========================================================= */

const STEPS = [
  { key: "pending", label: "Chờ xác nhận", Icon: ClockIcon },
  { key: "processing", label: "Đang xử lý", Icon: BoxIcon },
  { key: "shipped", label: "Đang giao", Icon: TruckIcon },
  { key: "delivered", label: "Đã giao", Icon: HomeIcon },
];

const STATUS_MESSAGE = {
  pending: "Cửa hàng đang chờ xác nhận đơn hàng của bạn.",
  processing: "Đơn hàng đang được chuẩn bị và đóng gói cẩn thận.",
  shipped: "Hương vị cao nguyên đang trên đường đến với bạn.",
  delivered: "Đơn hàng đã giao xong. Chúc bạn thưởng thức trọn vị đặc sản Lâm Đồng!",
};

function OrderProgress({ currentStep, status }) {
  const lastIndex = STEPS.length - 1;
  const fillPercent = Math.max(0, Math.min(1, currentStep / lastIndex)) * 100;

  return (
    <div>
      <div className="relative">
        {/* Đường nối: nền xám + phần đã đi qua */}
        <div className="absolute left-[12.5%] right-[12.5%] top-6 h-1 -translate-y-1/2 rounded-full bg-[#e9e3d4]" />
        <div
          className="absolute left-[12.5%] top-6 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#344723] to-[#dfb65c] transition-all duration-1000"
          style={{ width: `${fillPercent * 0.75}%` }}
        />

        <ol className="relative grid grid-cols-4 gap-2">
          {STEPS.map((step, index) => {
            const done = index < currentStep || (index === currentStep && status === "delivered");
            const current = index === currentStep && status !== "delivered";
            const { Icon } = step;

            return (
              <li key={step.key} className="flex flex-col items-center text-center">
                <div className="relative">
                  {current && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#dfb65c]/60" />
                  )}
                  <span
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition ${
                      done
                        ? "border-[#344723] bg-[#344723] text-white"
                        : current
                          ? "border-[#dfb65c] bg-[#dfb65c] text-[#243219] shadow-[0_8px_20px_-6px_rgba(176,139,67,0.7)]"
                          : "border-[#e1dac8] bg-white text-[#b4ad9b]"
                    }`}
                  >
                    {done ? <CheckIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                </div>
                <span
                  className={`mt-3 text-[12px] leading-4 sm:text-[13px] ${
                    done || current ? "font-semibold text-[#344723]" : "text-[#a3a58f]"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {STATUS_MESSAGE[status] && (
        <p className="mt-6 flex items-center justify-center gap-2 border-t border-dashed border-[#e1dac8] pt-5 text-center text-[13px] text-[#6f715f]">
          <LeafIcon className="h-4 w-4 text-[#53633c]" />
          {STATUS_MESSAGE[status]}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   CHUYỂN KHOẢN (giữ nguyên dữ liệu và data-testid)
========================================================= */

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt không cho sao chép: người dùng tự chép thủ công
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Sao chép ${label}`}
      className={`ml-3 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
        copied
          ? "border-[#344723] bg-[#344723] text-white"
          : "border-[#d9c58a] bg-white text-[#6b551f] hover:border-[#344723] hover:text-[#344723]"
      }`}
    >
      {copied ? "Đã chép" : "Sao chép"}
    </button>
  );
}

function BankTransferBox({ transfer }) {
  return (
    <section
      className="relative mt-6 overflow-hidden border border-[#e8d9ae] bg-[#fbf4dd] px-5 py-6 sm:px-7"
      data-testid="bank-box"
    >
      <ContourPattern
        stroke="#b08b43"
        opacity={0.12}
        className="pointer-events-none absolute -right-24 -top-16 w-[420px] max-w-none"
      />

      <div className="relative">
        <h2 className="font-serif text-xl font-semibold text-[#6b551f]">
          Thanh toán bằng chuyển khoản
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#7d6a35]">
          Quét mã QR bằng MoMo hoặc ứng dụng ngân hàng. Số tiền và nội dung được điền sẵn, vui lòng không chỉnh sửa.
        </p>

        {transfer.isSample && (
          <p
            className="mt-4 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]"
            data-testid="sample-warning"
          >
            Đây là tài khoản <strong>mẫu</strong> dùng để minh họa. Vui lòng <strong>không chuyển tiền thật</strong>.
          </p>
        )}

        <div className="mt-6 grid gap-7 md:grid-cols-[250px_1fr]">
          <div>
            {/* Khung QR có bốn góc vàng */}
            <div className="relative mx-auto w-fit p-3 md:mx-0">
              <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-[#b08b43]" />
              <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-[#b08b43]" />
              <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-[#b08b43]" />
              <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-[#b08b43]" />
              <img
                src={transfer.qrDataUrl}
                alt="Mã QR chuyển khoản"
                className="h-60 w-60 bg-white p-2 shadow-[0_10px_30px_-12px_rgba(107,85,31,0.45)]"
              />
            </div>
            <a
              href={transfer.qrDataUrl}
              download={`QR-${transfer.content}.png`}
              className="mt-3 inline-block text-sm font-semibold text-[#344723] underline underline-offset-4 hover:text-[#8c7040]"
            >
              Tải ảnh QR
            </a>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs text-[#9a8650]">Ngân hàng</dt>
              <dd className="font-medium">{transfer.bankName}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#9a8650]">Số tài khoản</dt>
              <dd className="flex items-center font-medium">
                {transfer.accountNumber}
                <CopyButton value={transfer.accountNumber} label="số tài khoản" />
              </dd>
            </div>
            {transfer.accountName && (
              <div>
                <dt className="text-xs text-[#9a8650]">Chủ tài khoản</dt>
                <dd className="font-medium">{transfer.accountName}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-[#9a8650]">Số tiền</dt>
              <dd className="flex items-center font-serif text-xl font-semibold text-[#9b7130]">
                {formatPrice(transfer.amount)}
                <CopyButton value={transfer.amount} label="số tiền" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#9a8650]">Nội dung chuyển khoản</dt>
              <dd className="flex items-center font-semibold tracking-wide">
                {transfer.content}
                <CopyButton value={transfer.content} label="nội dung" />
              </dd>
            </div>
          </dl>
        </div>

        <ol className="mt-6 list-decimal space-y-1.5 border-t border-[#e8d9ae] pt-5 pl-5 text-[13px] leading-5 text-[#7d6a35]">
          <li>Mở MoMo hoặc ứng dụng ngân hàng của bạn và chọn quét mã QR.</li>
          <li>
            Quét mã trên màn hình. Nếu đang xem bằng chính điện thoại này, hãy tải ảnh QR về rồi chọn quét từ ảnh trong
            thư viện (có trong MoMo và nhiều ứng dụng ngân hàng).
          </li>
          <li>Kiểm tra đúng số tiền và nội dung rồi xác nhận chuyển tiền.</li>
        </ol>

        <p className="mt-4 text-[12px] leading-5 text-[#9a8650]">
          Đơn hàng được xử lý sau khi cửa hàng kiểm tra và nhận được tiền.
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   TRANG CHI TIẾT ĐƠN HÀNG
========================================================= */

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

      {/* ===================================================
          BANNER: cao nguyên, sương mai
      =================================================== */}
      <section className="relative isolate overflow-hidden bg-[#0c2b25]">
        <div className="kenburns absolute inset-0">
          <LandscapeScene theme="highland" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f19]/85 via-[#0a1f19]/50 to-[#0a1f19]/10" />
        <div className="mist-drift pointer-events-none absolute -left-[20%] bottom-[26%] h-32 w-[140%] bg-gradient-to-r from-transparent via-[#eef3dd]/30 to-transparent blur-2xl" />
        <Bird top="28%" delay="2s" scale={0.9} />

        <div className="relative mx-auto max-w-[1000px] px-6 pb-24 pt-10 lg:pb-28">
          {/* Đường dẫn */}
          <nav className="fade-up flex flex-wrap items-center gap-2 text-[12px] text-white/70">
            <Link href="/" className="transition hover:text-[#e8c97a]">Trang chủ</Link>
            <span className="text-white/35">/</span>
            <Link href="/orders" className="transition hover:text-[#e8c97a]">Đơn hàng của tôi</Link>
            <span className="text-white/35">/</span>
            <span className="font-medium text-[#e8c97a]">
              {order ? formatOrderCode(order.id) : "Chi tiết"}
            </span>
          </nav>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
            <div className="fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#dfb65c]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e8c97a]">
                  Chi tiết đơn hàng
                </span>
              </div>
              <h1 className="mt-4 font-serif text-[34px] font-semibold leading-tight text-white md:text-[46px]">
                {order ? `Đơn hàng ${formatOrderCode(order.id)}` : "Đơn hàng của bạn"}
              </h1>
              {order && (
                <p className="mt-2 text-sm text-white/70">Đặt lúc {formatDateTime(order.createdAt)}</p>
              )}
            </div>

            {status && (
              <span
                className={`fade-up rounded-full px-5 py-2 text-sm font-semibold shadow-lg ${status.badge}`}
                style={{ animationDelay: "0.2s" }}
              >
                {status.label}
              </span>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-[-1px]">
          <RidgeDivider fill="#f8f5ec" />
        </div>
      </section>

      {/* ===================================================
          NỘI DUNG
      =================================================== */}
      <section className="mx-auto max-w-[1000px] px-6 pb-16 pt-6 lg:pb-20">
        {loading || authLoading ? (
          <div className="space-y-4">
            <div className="h-32 animate-pulse bg-[#efe9da]" />
            <div className="h-64 animate-pulse bg-[#efe9da]" />
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eee8da] text-[#8c8d7d]">
              <LeafIcon className="h-8 w-8" />
            </div>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-[#344723]">Không tìm thấy đơn hàng</h2>
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
            {/* ĐẶT HÀNG THÀNH CÔNG */}
            {justPlaced && (
              <div
                className="fade-up relative mb-8 flex items-start gap-5 overflow-hidden border border-[#cfe0c3] bg-gradient-to-r from-[#edf5e6] to-[#f7f3de] px-5 py-6 sm:px-7"
                role="status"
              >
                <ContourPattern
                  stroke="#53633c"
                  opacity={0.1}
                  className="pointer-events-none absolute -right-20 -top-10 w-[360px] max-w-none"
                />
                <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#3b6a2a]/40" />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#3b6a2a] text-white">
                    <CheckIcon className="h-6 w-6" />
                  </span>
                </span>
                <div className="relative">
                  <div className="font-serif text-2xl font-semibold text-[#2f5420]">Đặt hàng thành công!</div>
                  <p className="mt-1 text-sm leading-6 text-[#4b6a3c]">
                    Cảm ơn bạn đã chọn đặc sản Lâm Đồng. Mã đơn của bạn là{" "}
                    <strong>{formatOrderCode(order.id)}</strong>. Cửa hàng sẽ sớm xác nhận đơn.
                  </p>
                </div>
              </div>
            )}

            {/* TIẾN TRÌNH ĐƠN */}
            <Reveal>
              <div className="border border-[#e4dfd2] bg-[#fbf8ef] px-4 py-7 shadow-[0_10px_30px_-18px_rgba(52,71,35,0.25)] sm:px-8">
                {order.status === "cancelled" ? (
                  <div className="flex items-center gap-4 text-sm text-[#9a4528]">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f6e3dc]">
                      <AlertIcon className="h-6 w-6" />
                    </span>
                    Đơn hàng đã được hủy. Số lượng sản phẩm đã được hoàn lại kho.
                  </div>
                ) : (
                  <OrderProgress currentStep={currentStep} status={order.status} />
                )}
              </div>
            </Reveal>

            {/* CHUYỂN KHOẢN */}
            {order.transfer ? (
              <BankTransferBox transfer={order.transfer} />
            ) : (
              order.paymentMethod === "bank" &&
              order.paymentStatus === "unpaid" &&
              order.status !== "cancelled" && (
                <div
                  className="mt-6 border border-[#e8d9ae] bg-[#fbf4dd] px-5 py-4 text-sm text-[#7d6a35]"
                  data-testid="bank-missing"
                >
                  Chưa hiển thị được thông tin chuyển khoản. Vui lòng liên hệ cửa hàng để được hướng dẫn thanh toán.
                </div>
              )
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              {/* SẢN PHẨM */}
              <Reveal>
                <div className="border border-[#e4dfd2] bg-[#fbf8ef]">
                  <div className="flex items-center justify-between border-b border-[#ece6d7] px-5 py-4">
                    <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-[#344723]">
                      <LeafIcon className="h-5 w-5 text-[#b08b43]" />
                      Sản phẩm đã đặt
                    </h2>
                    <span className="rounded-full bg-[#f1ecdc] px-3 py-1 text-[12px] font-medium text-[#6b6850]">
                      {order.items.length} sản phẩm
                    </span>
                  </div>

                  <ul className="divide-y divide-[#ece6d7]">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex gap-4 px-5 py-4 transition hover:bg-[#f6f1e2]">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#eee8da]">
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
              </Reveal>

              {/* THÔNG TIN */}
              <div className="space-y-6">
                <Reveal delay={80}>
                  <div className="border border-[#e4dfd2] bg-[#fbf8ef] p-5">
                    <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-[#344723]">
                      <PinIcon className="h-5 w-5 text-[#b08b43]" />
                      Thông tin nhận hàng
                    </h2>
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
                    </dl>

                    <div className="mt-5 border-t border-dashed border-[#e1dac8] pt-4">
                      <div className="flex items-center gap-2 text-xs text-[#7a7c6c]">
                        <WalletIcon className="h-4 w-4 text-[#b08b43]" />
                        Thanh toán
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                        <span
                          className={`ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            order.paymentStatus === "paid"
                              ? "bg-[#e3eedc] text-[#3b6a2a]"
                              : "bg-[#fbf1d9] text-[#8a6a1a]"
                          }`}
                        >
                          {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* TỔNG TIỀN */}
                <Reveal delay={160}>
                  <div className="relative overflow-hidden bg-[#214919] p-5 text-white">
                    <ContourPattern
                      stroke="#dfb65c"
                      opacity={0.12}
                      className="pointer-events-none absolute -right-24 -top-10 w-[360px] max-w-none"
                    />
                    <div className="relative">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Tạm tính</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-white/70">Phí vận chuyển</span>
                        <span className={order.shippingFee === 0 ? "font-semibold text-[#e8c97a]" : ""}>
                          {order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between border-t border-white/15 pt-4">
                        <span className="font-serif text-base font-semibold">Tổng cộng</span>
                        <span className="font-serif text-[26px] font-semibold leading-none text-[#e8c97a]">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>

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

            {/* LỐI ĐI TIẾP */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#e4dfd2] pt-8">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#53633c] transition hover:text-[#344723]"
              >
                <ArrowLeft />
                Tất cả đơn hàng
              </Link>

              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-[#dfb65c] px-7 py-3.5 text-sm font-semibold text-[#243219] transition hover:bg-[#ebc975]"
              >
                Tiếp tục khám phá đặc sản
                <ArrowRight />
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
              <div
                className="mt-4 flex items-start gap-3 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]"
                role="alert"
              >
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

      <Footer ridge />
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