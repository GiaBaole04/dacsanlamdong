"use client";

import { useEffect } from "react";

/**
 * Hộp xác nhận dùng chung cho các thao tác quan trọng (hủy đơn, xác nhận nhận tiền, xóa...).
 * Nhấn Esc hoặc "Quay lại" để đóng. Lỗi từ máy chủ hiện ngay trong hộp.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Xác nhận",
  cancelLabel = "Quay lại",
  tone = "primary",
  busy = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    function handleKey(e) {
      if (e.key === "Escape" && !busy) onCancel();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-[#9a4528] hover:bg-[#7e3720]"
      : "bg-[#344723] hover:bg-[#263719]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1c2412]/55 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-[440px] border border-[#e4dfd2] bg-[#fbf8ef] p-7 shadow-[0_24px_60px_rgba(28,36,18,0.3)]">
        <h2 id="confirm-dialog-title" className="font-serif text-2xl font-semibold text-[#344723]">
          {title}
        </h2>

        <div className="mt-3 space-y-2 text-sm leading-6 text-[#6f715f]">{children}</div>

        {error && (
          <p className="mt-4 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-12 flex-1 border border-[#d9d1bf] bg-white text-sm font-semibold text-[#4d513e] transition hover:border-[#344723] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-12 flex-1 text-sm font-semibold text-white transition disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}