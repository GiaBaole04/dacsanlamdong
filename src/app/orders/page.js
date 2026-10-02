"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  ORDER_STATUS,
  formatDateTime,
  formatOrderCode,
  formatPrice,
} from "@/lib/orderUtils";

function ArrowRight({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function LeafIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function ReceiptIcon({ className = "h-9 w-9" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/orders");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Không tải được danh sách đơn hàng.");

        if (!cancelled) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header />

      <div className="border-b border-[#e7e0d1] bg-[#f8f5ec]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-5 text-[12px] lg:px-10">
          <Link href="/" className="text-[#7a7d6b] transition hover:text-[#344723]">Trang chủ</Link>
          <span className="text-[#b4ad9b]">/</span>
          <span className="font-medium text-[#344723]">Đơn hàng của tôi</span>
        </div>
      </div>

      <section className="mx-auto max-w-[1000px] px-6 py-10 lg:py-14">
        <h1 className="font-serif text-3xl font-semibold text-[#344723] md:text-4xl">Đơn hàng của tôi</h1>

        {loading || authLoading ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse border border-[#e4dfd2] bg-[#efe9da]" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-8 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-sm text-[#a04a2e]">
            {error}
          </p>
        ) : orders.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ebe4d5] text-[#53633c]">
              <ReceiptIcon />
            </div>
            <p className="text-lg font-medium text-[#344723]">Bạn chưa có đơn hàng nào</p>
            <p className="mt-2 max-w-sm text-sm text-[#6f715f]">
              Khi đặt hàng, đơn của bạn sẽ hiện ở đây để theo dõi.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-3 bg-[#344723] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#263719]"
            >
              Khám phá sản phẩm
              <ArrowRight />
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
              const preview = order.items.slice(0, 3);
              const more = order.items.length - preview.length;

              return (
                <li key={order.id} className="border border-[#e4dfd2] bg-[#fbf8ef]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece6d7] px-5 py-4">
                    <div>
                      <div className="font-serif text-lg font-semibold text-[#344723]">
                        {formatOrderCode(order.id)}
                      </div>
                      <div className="mt-0.5 text-xs text-[#7a7c6c]">{formatDateTime(order.createdAt)}</div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold ${status.badge}`}>{status.label}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-2">
                      {preview.map((item, index) => (
                        <div key={index} className="h-14 w-14 flex-shrink-0 overflow-hidden bg-[#eee8da]" title={item.productName}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#8c8d7d]">
                              <LeafIcon />
                            </div>
                          )}
                        </div>
                      ))}
                      {more > 0 && (
                        <div className="flex h-14 w-14 items-center justify-center bg-[#eee8da] text-sm font-medium text-[#6f715f]">
                          +{more}
                        </div>
                      )}
                      <div className="ml-2 hidden text-sm text-[#6f715f] sm:block">
                        {order.items[0]?.productName}
                        {order.items.length > 1 && ` và ${order.items.length - 1} sản phẩm khác`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[#7a7c6c]">Tổng tiền</div>
                      <div className="font-serif text-xl font-semibold text-[#9b7130]">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#ece6d7] px-5 py-3 text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#344723] transition hover:text-[#8c7040]"
                    >
                      Xem chi tiết
                      <ArrowRight />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Footer />
    </main>
  );
}