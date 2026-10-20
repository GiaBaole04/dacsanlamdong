"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LandscapeScene } from "@/components/Landscape";

const NAV = [
  { href: "/admin", label: "Tổng quan", exact: true },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/products", label: "Sản phẩm" },
  { href: "/admin/stories", label: "Câu chuyện" },
  { href: "/admin/users", label: "Tài khoản", adminOnly: true },
];

const ROLE_LABEL = { admin: "Quản trị viên", staff: "Nhân viên" };

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const allowed = user && (user.role === "admin" || user.role === "staff");

  // Mục "Tài khoản" chỉ hiện với quản trị viên
  const navItems = NAV.filter((item) => !item.adminOnly || user?.role === "admin");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/admin");
    }
  }, [loading, user, router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // vẫn tiếp tục đăng xuất ở giao diện
    }

    window.dispatchEvent(new Event("authUpdated"));
    router.push("/login");
  }

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  if (loading || !user) {
    return <div className="min-h-screen bg-[#f4f1e8]" aria-busy="true" />;
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f1e8] px-6">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-3xl font-semibold text-[#344723]">Không có quyền truy cập</h1>
          <p className="mt-3 text-sm text-[#6f715f]">
            Khu vực này chỉ dành cho quản trị viên và nhân viên cửa hàng.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block bg-[#344723] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#263719]"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1e8] text-[#292c18] lg:flex">
      {/* THANH BÊN (máy tính) */}
      <aside className="hidden w-60 flex-shrink-0 flex-col bg-[#243219] text-[#eee8d9] lg:flex">
        <div className="px-6 py-7">
          <div className="font-serif text-lg font-bold tracking-[0.12em]">ĐẶC SẢN</div>
          <div className="mt-1 text-[10px] tracking-[0.28em] text-[#dfb65c]">QUẢN TRỊ</div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 text-sm font-medium transition ${
                isActive(item)
                  ? "bg-[#344723] text-white"
                  : "text-[#c5cbb7] hover:bg-[#2c3d1f] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative mx-3 mb-4 h-24 overflow-hidden opacity-60" aria-hidden="true">
          <LandscapeScene theme="highland" />
        </div>

        <div className="border-t border-white/10 px-6 py-5 text-sm">
          <div className="truncate font-medium text-white">{user.name}</div>
          <div className="mt-0.5 text-xs text-[#dfb65c]">{ROLE_LABEL[user.role]}</div>
          <div className="mt-4 flex flex-col items-start gap-2 text-[13px]">
            <Link href="/" className="text-[#c5cbb7] transition hover:text-white">
              Xem cửa hàng
            </Link>
            <button type="button" onClick={handleLogout} className="text-[#c5cbb7] transition hover:text-white">
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* THANH TRÊN (điện thoại) */}
        <header className="bg-[#243219] px-5 py-4 text-[#eee8d9] lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-serif text-base font-bold tracking-[0.12em]">ĐẶC SẢN</span>
              <span className="ml-2 text-[10px] tracking-[0.28em] text-[#dfb65c]">QUẢN TRỊ</span>
            </div>
            <button type="button" onClick={handleLogout} className="text-xs text-[#c5cbb7]">
              Đăng xuất
            </button>
          </div>
          <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3.5 py-2 text-[13px] font-medium ${
                  isActive(item) ? "bg-[#344723] text-white" : "text-[#c5cbb7]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}