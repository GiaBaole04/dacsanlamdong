"use client";

import { useEffect } from "react";
import Link from "next/link";

// Hiện khi một trang gặp lỗi không lường trước. Giữ đơn giản, không dùng Header để tránh lỗi lặp lại.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Lỗi trang:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ec] px-6 text-[#292c18]">
      <div className="max-w-[520px] text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#faf0ea] text-[#a04a2e]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-8 w-8" aria-hidden="true">
            <path d="M12 4 3 20h18L12 4Z" />
            <path d="M12 10v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-[#344723]">Có lỗi xảy ra</h1>
        <p className="mt-3 text-[15px] leading-7 text-[#6f715f]">
          Rất tiếc, trang này tạm thời không hiển thị được. Bạn thử tải lại, hoặc quay về trang chủ nhé.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-[#344723] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#263719]"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="rounded-full border border-[#d9d1bf] bg-white px-7 py-3 text-sm font-semibold text-[#4d513e] transition hover:border-[#344723]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
