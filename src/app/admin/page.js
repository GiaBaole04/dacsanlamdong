"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS, formatDateTime, formatOrderCode, formatPrice } from "@/lib/orderUtils";

function Kpi({ label, value, hint, href, tone }) {
  const body = (
    <div className={`h-full border bg-white p-5 transition ${href ? "hover:border-[#344723]" : ""} ${tone === "alert" ? "border-[#e8c9a8]" : "border-[#e4dfd2]"}`}>
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8c8d7d]">{label}</div>
      <div className="mt-3 font-serif text-3xl font-semibold text-[#344723]">{value}</div>
      {hint && <div className="mt-1 text-xs text-[#8c8d7d]">{hint}</div>}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Không tải được số liệu.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">{error}</p>;
  }

  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-10 w-64 animate-pulse bg-[#e9e3d4]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-[#e9e3d4]" />
          ))}
        </div>
      </div>
    );
  }

  const maxOrders = Math.max(1, ...data.daily.map((d) => d.orders));

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[#344723]">Tổng quan</h1>
      <p className="mt-1 text-sm text-[#8c8d7d]">Tình hình cửa hàng hôm nay.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Chờ xác nhận"
          value={data.statusCounts.pending}
          hint="Đơn mới cần xử lý"
          href="/admin/orders?status=pending"
          tone={data.statusCounts.pending > 0 ? "alert" : undefined}
        />
        <Kpi
          label="Chờ nhận tiền"
          value={data.waitingPayment}
          hint="Đơn chuyển khoản chưa xác nhận tiền"
          href="/admin/orders?payment=unpaid"
          tone={data.waitingPayment > 0 ? "alert" : undefined}
        />
        <Kpi label="Doanh thu 30 ngày" value={formatPrice(data.revenue.last30)} hint="Chỉ tính đơn đã thanh toán" />
        <Kpi label="Tổng doanh thu" value={formatPrice(data.revenue.total)} hint={`${data.products.active} sản phẩm đang bán, ${data.products.hidden} đang ẩn`} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* BIỂU ĐỒ 7 NGÀY */}
        <section className="border border-[#e4dfd2] bg-white p-6">
          <h2 className="font-serif text-lg font-semibold text-[#344723]">Đơn hàng 7 ngày qua</h2>
          <div className="mt-6 flex h-44 items-end gap-3" role="img" aria-label="Biểu đồ số đơn hàng 7 ngày qua">
            {data.daily.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center justify-end" title={`${day.orders} đơn — ${formatPrice(day.value)}`}>
                <span className="mb-1 text-xs font-medium text-[#6f715f]">{day.orders}</span>
                <div
                  className={`w-full ${day.orders > 0 ? "bg-[#53633c]" : "bg-[#e9e3d4]"}`}
                  style={{ height: `${Math.max(4, (day.orders / maxOrders) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {data.daily.map((day) => (
              <div key={day.date} className="flex-1 text-center text-[11px] text-[#8c8d7d]">
                {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
              </div>
            ))}
          </div>
        </section>

        {/* SẮP HẾT HÀNG */}
        <section className="border border-[#e4dfd2] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-[#344723]">Sắp hết hàng</h2>
            <Link href="/admin/products" className="text-xs font-semibold text-[#8c7040] hover:text-[#344723]">
              Xem sản phẩm
            </Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-[#8c8d7d]">Tồn kho đều ổn.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#efe9da]">
              {data.lowStock.map((item, index) => (
                <li key={`${item.productId}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${item.productId}`} className="min-w-0 truncate hover:text-[#8c7040]">
                    {item.name} <span className="text-[#8c8d7d]">({item.variantName})</span>
                  </Link>
                  <span className={`flex-shrink-0 px-2.5 py-0.5 text-xs font-semibold ${item.stock === 0 ? "bg-[#f6e3dc] text-[#9a4528]" : "bg-[#fbf1d9] text-[#8a6a1a]"}`}>
                    {item.stock === 0 ? "Hết hàng" : `Còn ${item.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ĐƠN MỚI NHẤT */}
      <section className="mt-6 border border-[#e4dfd2] bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-[#344723]">Đơn hàng mới nhất</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-[#8c7040] hover:text-[#344723]">
            Xem tất cả
          </Link>
        </div>
        <ul className="divide-y divide-[#efe9da] border-t border-[#efe9da]">
          {data.recentOrders.map((order) => {
            const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
            return (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-sm transition hover:bg-[#faf8f1]">
                  <span className="font-semibold text-[#344723]">{formatOrderCode(order.id)}</span>
                  <span className="min-w-0 flex-1 truncate text-[#6f715f]">{order.receiverName}</span>
                  <span className="text-xs text-[#8c8d7d]">{formatDateTime(order.createdAt)}</span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold ${status.badge}`}>{status.label}</span>
                  <span className="w-28 text-right font-semibold text-[#9b7130]">{formatPrice(order.totalAmount)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}