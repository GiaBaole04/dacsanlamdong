"use client";

import { useState } from "react";
import Link from "next/link";

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

/* =========================
   PAGE
========================= */

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice("");

    if (!email || !password) {
      setNotice("Nhập đầy đủ email và mật khẩu để tiếp tục.");
      return;
    }

    setSubmitting(true);

    try {
      // Khi API đăng nhập (/api/auth/login) hoàn thiện, thay đoạn giả lập
      // dưới đây bằng lệnh gọi thật, ví dụ:
      //
      // const res = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại.');

      await new Promise((resolve) => setTimeout(resolve, 500));
      setNotice("Chức năng đăng nhập sẽ hoạt động sau khi kết nối API tài khoản.");
    } catch (err) {
      setNotice(err.message || "Có lỗi xảy ra, thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8f5ec] text-[#292c18] lg:grid-cols-[1.05fr_1fr]">
      {/* =========================
          CỘT TRÁI — KỂ CHUYỆN THƯƠNG HIỆU
      ========================= */}
      <div className="relative hidden overflow-hidden bg-[#243219] lg:block">
        {/* Hoạ tiết lá cách điệu, gợi nhắc vùng cao nguyên */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.08]"
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <path
              key={i}
              d="M0 30C40 5 90 5 130 30"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
              transform={`translate(${(i % 4) * 170 - 40} ${Math.floor(i / 4) * 220 + 20}) rotate(${(i * 37) % 360})`}
            />
          ))}
        </svg>

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c8b98d]/60 text-[#e8dcc0]">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[17px] font-semibold tracking-[0.13em] text-[#f3ecdb]">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#c8b98d]">LÂM ĐỒNG</div>
            </div>
          </Link>

          <div className="max-w-md">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#c8b98d]">
              Chuyện từ nông trại
            </span>

            <p className="mt-5 font-serif text-[26px] font-medium leading-[1.4] text-[#f3ecdb] xl:text-[30px]">
              "Mỗi mẻ cà phê rang ở Cầu Đất đều bắt đầu từ một buổi sáng sương
              còn đọng trên lá."
            </p>

            <div className="mt-6 h-px w-12 bg-[#c8b98d]/60" />
            <p className="mt-4 text-sm text-[#cfd0bc]">
              Người trồng cà phê tại Cầu Đất, Lâm Đồng
            </p>
          </div>

          <div className="flex gap-8 text-[#cfd0bc]">
            <div>
              <div className="font-serif text-2xl font-semibold text-[#f3ecdb]">18+</div>
              <div className="text-xs">Sản phẩm</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-semibold text-[#f3ecdb]">6</div>
              <div className="text-xs">Vùng đặc sản</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-semibold text-[#f3ecdb]">100%</div>
              <div className="text-xs">Nguồn gốc rõ ràng</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          CỘT PHẢI — FORM
      ========================= */}
      <div className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-[380px]">
          {/* Logo chỉ hiện trên mobile (vì cột trái đã ẩn) */}
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c8b98d] text-[#53633c]">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[17px] font-semibold tracking-[0.13em] text-[#344723]">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#8c7040]">LÂM ĐỒNG</div>
            </div>
          </Link>

          <h1 className="font-serif text-[30px] font-semibold leading-tight text-[#344723]">
            Chào mừng trở lại
          </h1>
          <p className="mt-2 text-sm text-[#6f715f]">
            Đăng nhập để tiếp tục mua sắm đặc sản Lâm Đồng.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
                Email
              </label>
              <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-[#fbf8ef] px-4 focus-within:border-[#344723]">
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

            {/* PASSWORD */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-[13px] font-medium text-[#4d513e]">
                  Mật khẩu
                </label>
                <Link href="/forgot-password" className="text-[12px] font-medium text-[#8c7040] hover:text-[#6b551f]">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-[#fbf8ef] px-4 focus-within:border-[#344723]">
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

            {/* REMEMBER */}
            <label className="flex select-none items-center gap-2.5 text-[13px] text-[#4d513e]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-[#344723]"
              />
              Ghi nhớ đăng nhập
            </label>

            {/* NOTICE */}
            {notice && (
              <p className="border border-[#e1daca] bg-[#f1eadb] px-4 py-3 text-[13px] leading-5 text-[#6b551f]">
                {notice}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-13 items-center justify-center gap-3 bg-[#344723] py-3.5 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60"
            >
              {submitting ? "Đang xử lý…" : "Đăng nhập"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
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
        </div>
      </div>
    </main>
  );
}