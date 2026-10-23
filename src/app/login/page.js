"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandscapeScene } from "@/components/Landscape";

// Muốn dùng ảnh thật làm nền: bỏ ảnh vào public/images/ rồi điền đường dẫn, ví dụ "/images/login-bg.jpg".
// Để trống thì dùng tranh cao nguyên Lâm Đồng (rừng thông, núi, sương sớm) vẽ sẵn của website.
const BACKGROUND_PHOTO = "";

/* =========================
   ICONS
========================= */

function LeafIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function MailIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  );
}

function LockIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="10.5" width="14" height="9" rx="1.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

function EyeIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.3 4.1M6.8 7.3C4.2 9 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.3 0 2.5-.3 3.6-.8" />
      <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function ArrowRight({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function AlertIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* =========================
   NỀN CẢNH LÂM ĐỒNG
========================= */

function ScenicBackground() {
  if (BACKGROUND_PHOTO) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={BACKGROUND_PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return <LandscapeScene theme="highland" />;
}

/* =========================
   PAGE
========================= */

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("error"); // "error" | "info"

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice("");

    if (!email || !password) {
      setNoticeType("error");
      setNotice("Nhập đầy đủ email và mật khẩu để tiếp tục.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại.");
      }

      // Báo cho các component khác (nếu có theo dõi trạng thái đăng nhập) biết vừa đăng nhập
      window.dispatchEvent(new Event("authUpdated"));

      // Quay lại trang đang định vào (?next=/checkout...). Chỉ nhận đường dẫn nội bộ,
      // chặn dạng "//trang-khac.com" để không bị lợi dụng chuyển hướng ra ngoài.
      const next = new URLSearchParams(window.location.search).get("next");
      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

      router.push(target);
      router.refresh();
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Có lỗi xảy ra, thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8f5ec] text-[#292c18] lg:grid-cols-[1.1fr_1fr]">
      {/* =========================
          CỘT TRÁI — CẢNH LÂM ĐỒNG (chỉ hiện trên màn hình lớn)
      ========================= */}
      <div className="relative hidden overflow-hidden bg-[#0c2b25] lg:block">
        <ScenicBackground />
        {/* Lớp phủ để chữ luôn dễ đọc */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07201a]/80 via-[#07201a]/25 to-[#07201a]/70" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8c97a]/60 bg-white/5 text-[#f3e3b3] backdrop-blur-sm">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[18px] font-semibold tracking-[0.13em] text-white">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#e8c97a]">LÂM ĐỒNG</div>
            </div>
          </Link>

          <div className="max-w-[460px]">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#dfb65c]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e8c97a]">
                Cao nguyên Lâm Đồng
              </span>
            </div>
            <h2 className="mt-6 font-serif text-[34px] font-semibold leading-[1.2] text-white xl:text-[40px]">
              Hương vị của đất trời cao nguyên, gửi đến tận nhà bạn
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-white/80">
              Cà phê, trà, trái cây sấy và nhiều sản vật được chọn lọc từ những vùng đất nổi tiếng của Lâm Đồng.
            </p>
          </div>

          <div className="flex gap-10 border-t border-white/20 pt-6">
            <div>
              <div className="font-serif text-[26px] font-semibold text-white">18+</div>
              <div className="mt-0.5 text-xs text-white/70">Sản phẩm</div>
            </div>
            <div>
              <div className="font-serif text-[26px] font-semibold text-white">6</div>
              <div className="mt-0.5 text-xs text-white/70">Vùng đặc sản</div>
            </div>
            <div>
              <div className="font-serif text-[26px] font-semibold text-white">100%</div>
              <div className="mt-0.5 text-xs text-white/70">Nguồn gốc rõ ràng</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          CỘT PHẢI — FORM
      ========================= */}
      <div className="flex flex-col">
        {/* Dải cảnh nhỏ trên điện thoại / máy tính bảng */}
        <div className="relative h-[150px] overflow-hidden bg-[#0c2b25] sm:h-[190px] lg:hidden">
          <ScenicBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07201a]/70 via-[#07201a]/20 to-[#07201a]/50" />
          <Link href="/" className="relative flex h-full items-start gap-3 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8c97a]/60 bg-white/5 text-[#f3e3b3] backdrop-blur-sm">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[17px] font-semibold tracking-[0.13em] text-white">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#e8c97a]">LÂM ĐỒNG</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:py-14">
          <div className="w-full max-w-[400px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">Đăng nhập</span>
            <h1 className="mt-3 font-serif text-[32px] font-semibold leading-tight text-[#344723]">
              Chào mừng trở lại
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#6f715f]">
              Đăng nhập để tiếp tục mua sắm và theo dõi đơn hàng đặc sản Lâm Đồng của bạn.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
                  Email
                </label>
                <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-white px-4 transition focus-within:border-[#344723] focus-within:ring-2 focus-within:ring-[#344723]/15">
                  <MailIcon className="h-[18px] w-[18px] flex-shrink-0 text-[#8c8d7d]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@vidu.com"
                    className="h-12 w-full bg-transparent text-sm text-[#292c18] outline-none placeholder:text-[#a3a58f]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-[13px] font-medium text-[#4d513e]">
                    Mật khẩu
                  </label>
                  <Link href="/forgot-password" className="text-[12px] font-medium text-[#8c7040] hover:text-[#6b551f]">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-white px-4 transition focus-within:border-[#344723] focus-within:ring-2 focus-within:ring-[#344723]/15">
                  <LockIcon className="h-[18px] w-[18px] flex-shrink-0 text-[#8c8d7d]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="h-12 w-full bg-transparent text-sm text-[#292c18] outline-none placeholder:text-[#a3a58f]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="flex-shrink-0 text-[#8c8d7d] hover:text-[#53633c]"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <label className="flex w-fit cursor-pointer select-none items-center gap-2.5 text-[13px] text-[#4d513e]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-[#344723]"
                />
                Ghi nhớ đăng nhập
              </label>

              {notice && (
                <div
                  role="alert"
                  className={`flex items-start gap-2.5 border px-4 py-3 text-[13px] leading-5 ${
                    noticeType === "error"
                      ? "border-[#e6cfc4] bg-[#faf0ea] text-[#a04a2e]"
                      : "border-[#e1daca] bg-[#f1eadb] text-[#6b551f]"
                  }`}
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{notice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 items-center justify-center gap-2.5 bg-[#344723] text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(52,71,35,0.6)] transition hover:bg-[#263719] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Đang đăng nhập…
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#e1daca]" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#a3a58f]">hoặc</span>
              <span className="h-px flex-1 bg-[#e1daca]" />
            </div>

            <p className="mt-7 text-center text-sm text-[#6f715f]">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-semibold text-[#344723] hover:text-[#263719]">
                Đăng ký ngay
              </Link>
            </p>

            <div className="mt-10 flex items-center justify-center gap-2 text-[12px] text-[#8c8d7d]">
              <LockIcon className="h-3.5 w-3.5" />
              Thông tin của bạn được mã hóa và bảo mật
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
