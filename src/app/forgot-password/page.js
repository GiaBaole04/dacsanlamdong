"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";

/* =========================
   ICONS
========================= */

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

function ArrowLeft({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
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

function CheckIcon({ className = "h-9 w-9" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeWidth="1.8" />
    </svg>
  );
}

/* =========================
   HELPERS
========================= */

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* =========================
   PAGE
========================= */

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState("email"); // "email" | "reset" | "success"

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [expirySeconds, setExpirySeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const otpInputRef = useRef(null);

  useEffect(() => {
    if (step !== "reset") return;
    const interval = setInterval(() => {
      setExpirySeconds((s) => Math.max(0, s - 1));
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === "reset") {
      otpInputRef.current?.focus();
    }
  }, [step]);

  async function requestOtp() {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Không gửi được mã xác thực.");
    }

    setOtp("");
    setExpirySeconds(data.expiresInSeconds || 180);
    setResendCooldown(60);
  }

  async function handleSendEmail(e) {
    e.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      await requestOtp();
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || submitting) return;

    setError("");
    setSubmitting(true);
    try {
      await requestOtp();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Nhập đủ 6 số của mã OTP.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu mới cần tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không đặt lại được mật khẩu.");
      }

      setStep("success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Khôi phục tài khoản"
      title="Chỉ vài bước để quay lại với đặc sản Lâm Đồng"
      text="Nhập email, xác thực bằng mã OTP và đặt lại mật khẩu mới trong vài phút."
    >
          {/* ===== BƯỚC 1: NHẬP EMAIL ===== */}
          {step === "email" && (
            <>
              <h1 className="font-serif text-[30px] font-semibold leading-tight text-[#344723]">
                Quên mật khẩu
              </h1>
              <p className="mt-2 text-sm text-[#6f715f]">
                Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực để bạn đặt lại mật khẩu.
              </p>

              <form onSubmit={handleSendEmail} className="mt-8 flex flex-col gap-5">
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

                {error && (
                  <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex h-13 items-center justify-center gap-3 bg-[#344723] py-3.5 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60"
                >
                  {submitting ? "Đang gửi mã…" : "Gửi mã xác thực"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-[#6f715f] hover:text-[#344723]"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </>
          )}

          {/* ===== BƯỚC 2: NHẬP OTP + MẬT KHẨU MỚI ===== */}
          {step === "reset" && (
            <>
              <h1 className="font-serif text-[30px] font-semibold leading-tight text-[#344723]">
                Đặt lại mật khẩu
              </h1>
              <p className="mt-2 text-sm text-[#6f715f]">
                Nếu email <strong className="text-[#344723]">{email}</strong> đã đăng ký, một mã gồm 6 số vừa được gửi
                đến hộp thư của bạn.
              </p>

              <form onSubmit={handleReset} className="mt-8 flex flex-col gap-5">
                <div>
                  <label htmlFor="otp" className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
                    Mã OTP
                  </label>
                  <input
                    id="otp"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="------"
                    className="h-14 w-full border border-[#d9d1bf] bg-[#fbf8ef] text-center font-serif text-2xl font-semibold tracking-[0.6em] text-[#344723] outline-none placeholder:text-[#c8c6b4] focus:border-[#344723]"
                  />
                  <p className="mt-2 text-[12px] text-[#6f715f]">
                    {expirySeconds > 0 ? (
                      <>Mã hết hạn sau <strong>{formatMMSS(expirySeconds)}</strong></>
                    ) : (
                      <span className="text-[#a04a2e]">Mã đã hết hạn, hãy gửi lại mã mới.</span>
                    )}
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
                    Mật khẩu mới
                  </label>
                  <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-[#fbf8ef] px-4 focus-within:border-[#344723]">
                    <LockIcon className="h-[18px] w-[18px] flex-shrink-0 text-[#8c8d7d]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
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

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
                    Nhập lại mật khẩu mới
                  </label>
                  <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-[#fbf8ef] px-4 focus-within:border-[#344723]">
                    <LockIcon className="h-[18px] w-[18px] flex-shrink-0 text-[#8c8d7d]" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="h-12 w-full bg-transparent text-sm text-[#292c18] outline-none placeholder:text-[#a3a58f]"
                    />
                  </div>
                </div>

                {error && (
                  <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 flex h-13 items-center justify-center gap-3 bg-[#344723] py-3.5 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60"
                >
                  {submitting ? "Đang xử lý…" : "Đặt lại mật khẩu"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || submitting}
                  className="font-medium text-[#8c7040] hover:text-[#6b551f] disabled:cursor-not-allowed disabled:text-[#a3a58f]"
                >
                  {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : "Gửi lại mã"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setOtp("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-[#6f715f] hover:text-[#344723]"
                >
                  Đổi email
                </button>
              </div>
            </>
          )}

          {/* ===== BƯỚC 3: THÀNH CÔNG ===== */}
          {step === "success" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef1e4] text-[#344723]">
                <CheckIcon className="h-9 w-9" />
              </div>
              <h1 className="mt-6 font-serif text-[28px] font-semibold text-[#344723]">
                Đã đặt lại mật khẩu
              </h1>
              <p className="mt-2 text-sm text-[#6f715f]">
                Đang chuyển về trang đăng nhập…
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-semibold text-[#344723] hover:text-[#263719]"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

    </AuthShell>
  );
}
