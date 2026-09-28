"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function UserIcon({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5" />
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

function MailCheckIcon({ className = "h-9 w-9" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
      <path d="m9 16 2.2 2.2L16 13.5" strokeWidth="1.8" />
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

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState("form"); // "form" | "otp" | "success"

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const otpInputRef = useRef(null);

  useEffect(() => {
    if (step !== "otp") return;
    const interval = setInterval(() => {
      setExpirySeconds((s) => Math.max(0, s - 1));
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === "otp") {
      otpInputRef.current?.focus();
    }
  }, [step]);

  async function handleSubmitInfo(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Nhập họ tên của bạn.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu cần tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không gửi được mã xác thực.");
      }

      setExpirySeconds(data.expiresInSeconds || 180);
      setResendCooldown(60);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Nhập đủ 6 số của mã OTP.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Xác thực không thành công.");
      }

      setStep("success");
      setTimeout(() => {
        router.push("/login");
      }, 1800);
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
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không gửi lại được mã.");
      }

      setOtp("");
      setExpirySeconds(data.expiresInSeconds || 180);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f8f5ec] text-[#292c18] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-[#243219] lg:block">
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
              transform={`translate(${(i % 4) * 170 - 40} ${Math.floor(i / 4) * 220 + 20}) rotate(${(i * 53) % 360})`}
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
              "Từng trái thanh long ở Hàm Thuận Nam đều được hái đúng độ chín
              để giữ trọn vị ngọt thanh."
            </p>

            <div className="mt-6 h-px w-12 bg-[#c8b98d]/60" />
            <p className="mt-4 text-sm text-[#cfd0bc]">
              Người trồng thanh long tại Hàm Thuận Nam, Lâm Đồng
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

      <div className="flex items-center justify-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c8b98d] text-[#53633c]">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[17px] font-semibold tracking-[0.13em] text-[#344723]">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#8c7040]">LÂM ĐỒNG</div>
            </div>
          </Link>

          {step === "form" && (
            <>
              <h1 className="font-serif text-[30px] font-semibold leading-tight text-[#344723]">
                Tạo tài khoản mới
              </h1>
              <p className="mt-2 text-sm text-[#6f715f]">
                Đăng ký để đặt hàng và theo dõi đơn hàng của bạn.
              </p>

              <form onSubmit={handleSubmitInfo} className="mt-8 flex flex-col gap-5">
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
                    Họ và tên
                  </label>
                  <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-[#fbf8ef] px-4 focus-within:border-[#344723]">
                    <UserIcon className="h-[18px] w-[18px] flex-shrink-0 text-[#8c8d7d]" />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="h-12 w-full bg-transparent text-sm text-[#292c18] outline-none placeholder:text-[#a3a58f]"
                    />
                  </div>
                </div>

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

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[#4d513e]">
                    Mật khẩu
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
                    Nhập lại mật khẩu
                  </label>
                  <div className="flex items-center gap-2.5 border border-[#d9d1bf] bg-[#fbf8ef] px-4 focus-within:border-[#344723]">
                    <LockIcon className="h-[18px] w-[18px] flex-shrink-0 text-[#8c8d7d]" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
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
                  {submitting ? "Đang gửi mã…" : "Tiếp tục"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-[#6f715f]">
                Đã có tài khoản?{" "}
                <Link href="/login" className="font-semibold text-[#344723] hover:text-[#263719]">
                  Đăng nhập
                </Link>
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError("");
                }}
                className="mb-6 flex items-center gap-2 text-sm text-[#6f715f] hover:text-[#344723]"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>

              <h1 className="font-serif text-[28px] font-semibold leading-tight text-[#344723]">
                Nhập mã xác thực
              </h1>
              <p className="mt-2 text-sm text-[#6f715f]">
                Mã gồm 6 số đã được gửi đến <span className="font-medium text-[#344723]">{email}</span>.
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-8 flex flex-col gap-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="otp" className="block text-[13px] font-medium text-[#4d513e]">
                      Mã OTP
                    </label>
                    <span className="text-[12px] text-[#a3a58f]">
                      {expirySeconds > 0
                        ? `Mã hết hạn sau ${formatMMSS(expirySeconds)}`
                        : "Mã đã hết hạn"}
                    </span>
                  </div>
                  <input
                    id="otp"
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="h-14 w-full border border-[#d9d1bf] bg-[#fbf8ef] px-4 text-center text-2xl font-semibold tracking-[0.5em] text-[#292c18] outline-none focus:border-[#344723] placeholder:text-[#c9c3b0]"
                  />
                </div>

                {error && (
                  <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || expirySeconds === 0}
                  className="flex h-13 items-center justify-center gap-3 bg-[#344723] py-3.5 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60"
                >
                  {submitting ? "Đang xác thực…" : "Xác nhận"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || submitting}
                  className="text-center text-sm font-medium text-[#8c7040] transition hover:text-[#6b551f] disabled:cursor-not-allowed disabled:text-[#a3a58f]"
                >
                  {resendCooldown > 0 ? `Có thể gửi lại mã sau ${resendCooldown}s` : "Gửi lại mã"}
                </button>

                <p className="text-center text-[12px] leading-5 text-[#a3a58f]">
                  Mã có hiệu lực 3 phút. Sau mỗi 60 giây bạn có thể yêu cầu mã mới,
                  mã cũ sẽ không dùng được nữa.
                </p>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2e7] text-[#4b5c3b]">
                <MailCheckIcon />
              </div>
              <h1 className="font-serif text-2xl font-semibold text-[#344723]">
                Xác thực thành công
              </h1>
              <p className="mt-2 text-sm text-[#6f715f]">
                Tài khoản của bạn đã sẵn sàng. Đang chuyển đến trang đăng nhập…
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}