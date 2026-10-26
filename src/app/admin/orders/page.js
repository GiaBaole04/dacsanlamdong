"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ORDER_STATUS, PAYMENT_STATUS_LABEL, formatDateTime, formatOrderCode, formatPrice } from "@/lib/orderUtils";

import { friendlyError } from "@/lib/friendlyError";
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipped", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
];

function AdminOrdersContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [payment, setPayment] = useState(searchParams.get("payment") || "all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  // Gõ xong khoảng 0,35 giây mới tìm, đỡ gọi máy chủ liên tục
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const current = ++requestId.current;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({ status, payment, page: String(page) });
        if (query) params.set("q", query);

        const res = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Không tải được danh sách đơn hàng.");

        // Bỏ qua kết quả của lần gọi cũ nếu người dùng đã đổi bộ lọc
        if (current === requestId.current) setData(json);
      } catch (err) {
        if (current === requestId.current) setError(friendlyError(err));
      } finally {
        if (current === requestId.current) setLoading(false);
      }
    }

    load();
  }, [status, payment, query, page]);

  const counts = data?.counts;

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-[#344723]">Đơn hàng</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn, tên, số điện thoại, email…"
          aria-label="Tìm đơn hàng"
          className="h-11 w-full max-w-[420px] border border-[#d9d1bf] bg-white px-4 text-sm outline-none focus:border-[#344723]"
        />
        <select
          value={payment}
          onChange={(e) => {
            setPayment(e.target.value);
            setPage(1);
          }}
          aria-label="Lọc theo thanh toán"
          className="h-11 border border-[#d9d1bf] bg-white px-3 text-sm outline-none focus:border-[#344723]"
        >
          <option value="all">Mọi thanh toán</option>
          <option value="unpaid">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
        </select>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-[#e4dfd2]" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={status === tab.key}
            onClick={() => {
              setStatus(tab.key);
              setPage(1);
            }}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
              status === tab.key
                ? "border-[#344723] text-[#344723]"
                : "border-transparent text-[#8c8d7d] hover:text-[#344723]"
            }`}
          >
            {tab.label}
            {counts && <span className="ml-1 text-xs text-[#a3a58f]"> ({counts[tab.key]})</span>}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">{error}</p>}

      <div className={`mt-4 overflow-x-auto border border-[#e4dfd2] bg-white transition ${loading && data ? "opacity-60" : ""}`}>
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-[#faf8f1] text-left text-xs uppercase tracking-[0.08em] text-[#8c8d7d]">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">Thanh toán</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-right font-medium">Tổng tiền</th>
              <th className="px-4 py-3 font-medium">Ngày đặt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efe9da]">
            {!data ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#8c8d7d]">Đang tải…</td>
              </tr>
            ) : data.orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#8c8d7d]">Không có đơn hàng nào phù hợp.</td>
              </tr>
            ) : (
              data.orders.map((order) => {
                const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                return (
                  <tr key={order.id} className="transition hover:bg-[#faf8f1]">
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-[#344723] hover:text-[#8c7040]">
                        {formatOrderCode(order.id)}
                      </Link>
                      <div className="text-xs text-[#a3a58f]">{order.itemCount} dòng hàng</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{order.receiverName}</div>
                      <div className="text-xs text-[#8c8d7d]">{order.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>{order.paymentMethod === "bank" ? "Chuyển khoản" : "COD"}</div>
                      <div className={`text-xs ${order.paymentStatus === "paid" ? "text-[#3b6a2a]" : "text-[#a3844a]"}`}>
                        {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 text-xs font-semibold ${st.badge}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-[#9b7130]">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3.5 text-xs text-[#8c8d7d]">{formatDateTime(order.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[#8c8d7d]">
            Trang {data.page}/{data.totalPages} · {data.total} đơn
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-10 border border-[#d9d1bf] bg-white px-4 font-medium transition hover:border-[#344723] disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-10 border border-[#d9d1bf] bg-white px-4 font-medium transition hover:border-[#344723] disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersContent />
    </Suspense>
  );
}