"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { STATUS_ACTION, NEXT_STATUS, checkTransition } from "@/lib/orderRules";
import {
  ORDER_STATUS,
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  formatDateTime,
  formatOrderCode,
  formatPrice,
} from "@/lib/orderUtils";

function describeEvent(event) {
  if (event.event === "payment") {
    return "Xác nhận đã nhận tiền";
  }

  const from = ORDER_STATUS[event.from]?.label || event.from;
  const to = ORDER_STATUS[event.to]?.label || event.to;
  return `Đổi trạng thái: ${from} → ${to}`;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  // action: { type: "status", to } hoặc { type: "paid" }
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" });

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không tải được đơn hàng.");

      setOrder(json.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) load();
  }, [orderId, load]);

  async function runAction() {
    if (!action || busy) return;

    setBusy(true);
    setActionError("");

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.type === "paid" ? { markPaid: true } : { status: action.to }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Không cập nhật được đơn hàng.");

      setAction(null);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function openAction(next) {
    setActionError("");
    setAction(next);
  }

  if (loading) {
    return <div className="h-64 animate-pulse bg-[#e9e3d4]" aria-busy="true" />;
  }

  if (notFound) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#344723]">Không tìm thấy đơn hàng</h1>
        <Link href="/admin/orders" className="mt-6 inline-block text-sm font-semibold text-[#8c7040] hover:text-[#344723]">
          ← Về danh sách đơn hàng
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">{error || "Không tải được đơn hàng."}</p>;
  }

  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const nextOptions = NEXT_STATUS[order.status] || [];
  const canMarkPaid = order.paymentMethod === "bank" && order.paymentStatus === "unpaid" && order.status !== "cancelled";
  const isFinal = nextOptions.length === 0;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-medium text-[#8c7040] hover:text-[#344723]">
        ← Tất cả đơn hàng
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#344723]">Đơn hàng {formatOrderCode(order.id)}</h1>
          <p className="mt-1 text-sm text-[#8c8d7d]">Đặt lúc {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1.5 text-sm font-semibold ${status.badge}`}>{status.label}</span>
          <span
            className={`px-3 py-1.5 text-sm font-semibold ${
              order.paymentStatus === "paid" ? "bg-[#e3eedc] text-[#3b6a2a]" : "bg-[#fbf1d9] text-[#8a6a1a]"
            }`}
          >
            {PAYMENT_STATUS_LABEL[order.paymentStatus]}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* SẢN PHẨM */}
          <section className="border border-[#e4dfd2] bg-white">
            <h2 className="border-b border-[#efe9da] px-6 py-4 font-serif text-lg font-semibold text-[#344723]">Sản phẩm</h2>
            <ul className="divide-y divide-[#efe9da]">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-[#eee8da]">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#344723]">{item.productName}</div>
                    <div className="text-xs text-[#8c8d7d]">Quy cách: {item.variantName}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-[#8c8d7d]">
                      {formatPrice(item.price)} × {item.quantity}
                    </div>
                    <div className="font-semibold text-[#9b7130]">{formatPrice(item.price * item.quantity)}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-[#efe9da] px-6 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8c8d7d]">Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c8d7d]">Phí vận chuyển</span>
                <span>{order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-[#efe9da] pt-3 font-serif text-lg font-semibold">
                <span className="text-[#344723]">Tổng thanh toán</span>
                <span className="text-[#9b7130]">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          {/* GIAO NHẬN */}
          <section className="border border-[#e4dfd2] bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-[#344723]">Thông tin giao nhận</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#8c8d7d]">Người nhận</dt>
                <dd className="font-medium">{order.receiverName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8c8d7d]">Điện thoại</dt>
                <dd className="font-medium">{order.phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#8c8d7d]">Địa chỉ</dt>
                <dd className="font-medium">{order.shippingAddress}</dd>
              </div>
              {order.note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#8c8d7d]">Ghi chú của khách</dt>
                  <dd className="font-medium">{order.note}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[#8c8d7d]">Tài khoản đặt hàng</dt>
                <dd className="font-medium">
                  {order.customer.name} <span className="text-[#8c8d7d]">({order.customer.email})</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#8c8d7d]">Thanh toán</dt>
                <dd className="font-medium">{PAYMENT_LABEL[order.paymentMethod]}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          {/* XỬ LÝ ĐƠN */}
          <section className="border border-[#e4dfd2] bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-[#344723]">Xử lý đơn</h2>

            {isFinal && (
              <p className="mt-3 text-sm text-[#8c8d7d]">
                {order.status === "cancelled" ? "Đơn hàng đã hủy, không thể thay đổi." : "Đơn hàng đã hoàn tất, không thể thay đổi."}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {canMarkPaid && (
                <button
                  type="button"
                  onClick={() => openAction({ type: "paid" })}
                  className="h-12 w-full border border-[#b08b43] bg-[#fbf4dd] text-sm font-semibold text-[#6b551f] transition hover:bg-[#f5ebc8]"
                >
                  Xác nhận đã nhận tiền
                </button>
              )}

              {nextOptions.map((to) => {
                const action_ = STATUS_ACTION[to];
                const problem = checkTransition(
                  { status: order.status, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus },
                  to
                );
                const danger = action_.tone === "danger";

                return (
                  <div key={to}>
                    <button
                      type="button"
                      disabled={Boolean(problem)}
                      onClick={() => openAction({ type: "status", to })}
                      className={`h-12 w-full text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        danger
                          ? "border border-[#d9a08b] bg-white text-[#9a4528] hover:bg-[#faf0ea]"
                          : "bg-[#344723] text-white hover:bg-[#263719]"
                      }`}
                    >
                      {action_.label}
                    </button>
                    {problem && <p className="mt-1.5 text-xs leading-5 text-[#a3844a]">{problem}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* NHẬT KÝ */}
          <section className="border border-[#e4dfd2] bg-white p-6">
            <h2 className="font-serif text-lg font-semibold text-[#344723]">Lịch sử xử lý</h2>
            {order.events.length === 0 ? (
              <p className="mt-3 text-sm text-[#8c8d7d]">Chưa có thao tác nào.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l border-[#e4dfd2] pl-5">
                {order.events.map((event) => (
                  <li key={event.id} className="relative text-sm">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[#53633c]" />
                    <div className="font-medium text-[#344723]">{describeEvent(event)}</div>
                    <div className="text-xs text-[#8c8d7d]">
                      {event.by || "Tài khoản đã xóa"} · {formatDateTime(event.createdAt)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      {/* XÁC NHẬN THAO TÁC */}
      <ConfirmDialog
        open={Boolean(action)}
        title={
          action?.type === "paid"
            ? "Xác nhận đã nhận tiền?"
            : action?.to === "cancelled"
              ? "Hủy đơn hàng?"
              : STATUS_ACTION[action?.to]?.label || "Xác nhận"
        }
        confirmLabel={action?.type === "paid" ? "Đã nhận tiền" : action?.to === "cancelled" ? "Hủy đơn" : "Xác nhận"}
        tone={action?.to === "cancelled" ? "danger" : "primary"}
        busy={busy}
        error={actionError}
        onConfirm={runAction}
        onCancel={() => setAction(null)}
      >
        {action?.type === "paid" && (
          <p>
            Bạn đã kiểm tra tài khoản ngân hàng và thấy khoản tiền <strong>{formatPrice(order.totalAmount)}</strong> với nội dung{" "}
            <strong>DS{String(order.id).padStart(6, "0")}</strong>?
          </p>
        )}
        {action?.type === "status" && action.to === "cancelled" && (
          <>
            <p>
              Hủy đơn <strong>{formatOrderCode(order.id)}</strong>? Số lượng sản phẩm sẽ được cộng lại vào kho và không thể hoàn tác.
            </p>
            {order.paymentStatus === "paid" && (
              <p className="text-[#a04a2e]">Đơn này đã thanh toán, bạn cần hoàn tiền cho khách bên ngoài hệ thống.</p>
            )}
          </>
        )}
        {action?.type === "status" && action.to !== "cancelled" && (
          <p>
            Chuyển đơn <strong>{formatOrderCode(order.id)}</strong> sang trạng thái <strong>{ORDER_STATUS[action.to]?.label}</strong>.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}