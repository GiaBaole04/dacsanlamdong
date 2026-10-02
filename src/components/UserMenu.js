"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/* =========================
   ICONS
========================= */

function UserIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.2-5.5 7-5.5s6.2 2 7 5.5" />
    </svg>
  );
}

function LogoutIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H9" />
    </svg>
  );
}

function ReceiptIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function DashboardIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="4" rx="1" />
      <rect x="13" y="10" width="7" height="10" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

/* =========================
   CẤU HÌNH GIAO DIỆN THEO TỪNG KIỂU HEADER
   hero : chữ trắng, nằm trên ảnh hero (trang chủ)
   text : chữ xám, có tên bên cạnh icon (trang danh sách sản phẩm)
   icon : nút tròn chỉ có icon (trang chi tiết, giỏ hàng)
========================= */

const TRIGGER_CLASS = {
  hero: "flex items-center gap-2 text-sm text-white/90 transition hover:text-[#e8bd5c]",
  text: "flex items-center gap-2 text-sm text-[#555546] transition hover:text-[#315020]",
  icon: "flex h-10 w-10 items-center justify-center rounded-full text-[#53633c] transition hover:bg-[#eee8d9]",
};

const ROLE_LABEL = {
  admin: "Quản trị viên",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

function getShortName(fullName = "") {
  // Tên Việt: từ cuối là tên gọi (Lê Huỳnh Gia Bảo -> Bảo)
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || "Tài khoản";
}

/* =========================
   COMPONENT
========================= */

export default function UserMenu({ variant = "text" }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const triggerClass = TRIGGER_CLASS[variant] || TRIGGER_CLASS.text;
  const showName = variant !== "icon";

  /* Đóng menu khi bấm ra ngoài hoặc nhấn Esc */
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Nếu lỗi mạng, vẫn tiếp tục làm mới giao diện
    }

    window.dispatchEvent(new Event("authUpdated"));
    router.push("/");
    router.refresh();
  }

  /* Đang kiểm tra đăng nhập: giữ nguyên chỗ trống để header không bị giật */
  if (loading) {
    return (
      <span className={`${triggerClass} invisible`} aria-hidden="true">
        <UserIcon />
        {showName && <span className="hidden md:inline">Đăng nhập</span>}
      </span>
    );
  }

  /* Chưa đăng nhập */
  if (!user) {
    return (
      <Link href="/login" className={triggerClass} aria-label="Đăng nhập">
        <UserIcon />
        {showName && <span className="hidden md:inline">Đăng nhập</span>}
      </Link>
    );
  }

  /* Đã đăng nhập */
  const shortName = getShortName(user.name);
  const initial = shortName.charAt(0).toUpperCase();
  const canManage = user.role === "admin" || user.role === "staff";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tài khoản của ${user.name}`}
      >
        {variant === "icon" ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#344723] text-[13px] font-semibold text-white">
            {initial}
          </span>
        ) : (
          <>
            <UserIcon />
            <span className="hidden max-w-[110px] truncate md:inline">{shortName}</span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-3 w-60 border border-[#e4dfd2] bg-[#fbf8ef] py-2 text-[#292c18] shadow-[0_12px_32px_rgba(41,44,24,0.14)]"
        >
          <div className="border-b border-[#e9e3d4] px-4 pb-3 pt-2">
            <div className="truncate font-serif text-[15px] font-semibold text-[#344723]">
              {user.name}
            </div>
            <div className="mt-0.5 text-[12px] text-[#8c7040]">
              {ROLE_LABEL[user.role] || "Thành viên"}
            </div>
          </div>

          <Link
            href="/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4d513e] transition hover:bg-[#f1eadb] hover:text-[#344723]"
          >
            <ReceiptIcon />
            Đơn hàng của tôi
          </Link>

          {canManage && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4d513e] transition hover:bg-[#f1eadb] hover:text-[#344723]"
            >
              <DashboardIcon />
              Trang quản trị
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#4d513e] transition hover:bg-[#f1eadb] hover:text-[#a04a2e]"
          >
            <LogoutIcon />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}