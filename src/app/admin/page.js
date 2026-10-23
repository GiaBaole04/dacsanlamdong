"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ORDER_STATUS,
  PAYMENT_STATUS_LABEL,
  formatDateTime,
  formatOrderCode,
  formatPrice,
} from "@/lib/orderUtils";
import {
  DeltaBadge,
  Donut,
  HBarList,
  Sparkline,
  TrendChart,
  WeekdayBars,
  formatCompactVnd,
  formatInt,
  formatPercent,
} from "@/components/admin/charts";

// ---------------------------------------------------------------------------
// Cấu hình hiển thị
// ---------------------------------------------------------------------------

const RANGES = [
  { key: "7", label: "7 ngày" },
  { key: "30", label: "30 ngày" },
  { key: "90", label: "90 ngày" },
  { key: "365", label: "12 tháng" },
];

const STATUS_COLORS = {
  pending: "#d9a441",
  processing: "#5b8fc4",
  shipped: "#7a66c2",
  delivered: "#53633c",
  cancelled: "#c0644a",
};
const PAYMENT_COLORS = { cod: "#8c7040", bank: "#344723" };
const CATEGORY_COLORS = ["#344723", "#8c7040", "#7a8f5c", "#d9a441", "#5b8fc4", "#c0644a"];

const WEEKDAY_FULL_SUN_FIRST = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]; // thứ Hai đứng đầu
const WEEKDAY_LONG = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];

const pad2 = (n) => String(n).padStart(2, "0");

// Nhãn trục X và tiêu đề tooltip của một mốc thời gian
function bucketLabels(key, unit) {
  if (unit === "month") {
    const [y, m] = key.split("-");
    return { label: `T${Number(m)}/${y.slice(2)}`, title: `Tháng ${Number(m)}/${y}` };
  }

  const [y, m, d] = key.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return {
    label: `${pad2(d)}/${pad2(m)}`,
    title: `${WEEKDAY_FULL_SUN_FIRST[dow]}, ${pad2(d)}/${pad2(m)}/${y}`,
  };
}

function formatDateKey(key) {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

function greeting(isoString) {
  const hour = new Date(isoString).getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Xuất số liệu theo thời gian ra CSV (có BOM để Excel đọc đúng tiếng Việt)
function exportCsv(data) {
  const header = ["Mốc thời gian", "Số đơn", "Đơn hợp lệ", "Đơn hủy", "Doanh số (đ)", "Doanh thu đã thu (đ)", "Khách hàng mới"];
  const rows = data.series.map((s) => [s.key, s.orders, s.valid, s.cancelled, s.gross, s.revenue, s.customers]);
  const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `bao-cao-${data.range.start}_${data.range.end}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Các khối giao diện nhỏ
// ---------------------------------------------------------------------------

function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`min-w-0 border border-[#e4dfd2] bg-white p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-semibold text-[#344723]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#8c8d7d]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActionCard({ label, value, hint, href, urgent }) {
  return (
    <Link
      href={href}
      className={`group block border bg-white p-5 transition hover:border-[#344723] ${
        urgent ? "border-[#e8c9a8] border-l-4 border-l-[#d9a441]" : "border-[#e4dfd2]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8c8d7d]">{label}</div>
        <span className="text-sm text-[#a3a493] transition group-hover:translate-x-0.5 group-hover:text-[#344723]" aria-hidden="true">
          →
        </span>
      </div>
      <div className={`mt-2 font-serif text-3xl font-semibold ${urgent ? "text-[#a0561e]" : "text-[#344723]"}`}>{formatInt(value)}</div>
      <div className="mt-1 text-xs text-[#8c8d7d]">{hint}</div>
    </Link>
  );
}

function KpiCard({ label, value, delta, spark, hint }) {
  return (
    <div className="border border-[#e4dfd2] bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8c8d7d]">{label}</div>
      <div className="mt-2 font-serif text-[26px] font-semibold leading-tight text-[#344723]">{value}</div>
      <div className="mt-1.5">{delta}</div>
      <div className="mt-3">{spark}</div>
      {hint && <div className="mt-2 text-[11px] text-[#8c8d7d]">{hint}</div>}
    </div>
  );
}

function MetricRow({ label, value, percent, color, note }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[#6f715f]">{label}</span>
        <span className="font-semibold text-[#292c18]">{value}</span>
      </div>
      {percent !== undefined && (
        <div className="mt-1.5 h-1.5 w-full bg-[#efe9da]">
          <div className="h-full" style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: color }} />
        </div>
      )}
      {note && <div className="mt-1 text-[11px] text-[#8c8d7d]">{note}</div>}
    </div>
  );
}

function EmptyNote({ children }) {
  return <p className="py-8 text-center text-sm text-[#8c8d7d]">{children}</p>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải số liệu">
      <div className="h-12 w-72 animate-pulse bg-[#e9e3d4]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse bg-[#e9e3d4]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 animate-pulse bg-[#e9e3d4]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-[420px] animate-pulse bg-[#e9e3d4] xl:col-span-2" />
        <div className="h-[420px] animate-pulse bg-[#e9e3d4]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trang Tổng quan
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [tick, setTick] = useState(0);

  // Tải số liệu mỗi khi đổi khoảng thời gian hoặc bấm "Làm mới"
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/admin/stats?range=${range}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Không tải được số liệu.");
        if (!cancelled) {
          setData(json);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Không tải được số liệu.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range, tick]);

  // Tự làm mới mỗi 60 giây khi đang xem tab này
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  function changeRange(key) {
    if (key === range) return;
    setFetching(true);
    setRange(key);
  }

  function refresh() {
    setFetching(true);
    setTick((t) => t + 1);
  }

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.series.map((s) => {
      const labels = bucketLabels(s.key, data.range.unit);
      return { key: s.key, label: labels.label, title: labels.title, revenue: s.revenue, orders: s.orders };
    });
  }, [data]);

  if (!data && error) {
    return (
      <div className="border border-[#e6cfc4] bg-[#faf0ea] px-5 py-4 text-sm text-[#a04a2e]">
        <p>{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-3 border border-[#a04a2e] px-4 py-2 text-xs font-semibold transition hover:bg-[#a04a2e] hover:text-white"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const { totals, actions, viewer } = data;
  const cur = totals.current;
  const prev = totals.previous;
  const rangeLabel = RANGES.find((r) => r.key === data.range.key)?.label || "";
  const isAdmin = viewer.role === "admin";

  const delivered = data.statusBreakdown.find((s) => s.status === "delivered")?.count ?? 0;
  const completionRate = cur.orders ? (delivered / cur.orders) * 100 : 0;
  const cancelRate = cur.orders ? (cur.cancelled / cur.orders) * 100 : 0;
  const prevCancelRate = prev.orders ? (prev.cancelled / prev.orders) * 100 : 0;
  const collectRate = cur.gross ? (cur.revenue / cur.gross) * 100 : 0;
  const uncollected = Math.max(0, cur.gross - cur.revenue);
  const stockAlerts = actions.outOfStock + actions.lowStock;

  const peakDay = data.weekdays.reduce((best, d) => (d.orders > best.orders ? d : best), { day: -1, orders: 0 });

  const statusSegments = data.statusBreakdown.map((s) => ({
    key: s.status,
    label: ORDER_STATUS[s.status].label,
    value: s.count,
    color: STATUS_COLORS[s.status],
    detail: s.value > 0 ? `Giá trị ${formatCompactVnd(s.value)}đ` : undefined,
  }));

  const paymentSegments = ["cod", "bank"].map((method) => {
    const row = data.paymentBreakdown.find((p) => p.method === method);
    return {
      key: method,
      label: method === "bank" ? "Chuyển khoản" : "Thanh toán khi nhận (COD)",
      value: row?.count || 0,
      color: PAYMENT_COLORS[method],
      detail: `Giá trị ${formatCompactVnd(row?.value || 0)}đ`,
    };
  });

  const categoryTotal = data.categories.reduce((sum, c) => sum + c.value, 0);
  const categorySegments = data.categories.map((c, i) => ({
    key: String(c.id),
    label: c.name,
    value: c.value,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    detail: `${formatInt(c.qty)} sản phẩm`,
  }));

  const productItems = data.topProducts.map((p) => ({
    key: String(p.id),
    label: p.name,
    sub: `${formatInt(p.qty)} sản phẩm đã bán`,
    value: p.value,
    valueLabel: formatPrice(p.value),
    image: p.imageUrl || "",
    href: `/admin/products/${p.id}`,
  }));

  const weekdayItems = data.weekdays.map((d) => ({
    key: String(d.day),
    label: WEEKDAY_SHORT[d.day],
    title: WEEKDAY_LONG[d.day],
    value: d.orders,
  }));

  return (
    <div className={`transition-opacity ${fetching ? "opacity-70" : ""}`}>
      {/* ================= TIÊU ĐỀ + BỘ LỌC ================= */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#344723]">Tổng quan</h1>
          <p className="mt-1 text-sm text-[#6f715f]">
            {greeting(data.generatedAt)}, {viewer.name}. Hôm nay có{" "}
            <strong className="font-semibold text-[#344723]">{formatInt(data.today.orders)} đơn</strong>
            {data.today.orders > 0 && <>, doanh số {formatPrice(data.today.gross)}</>}
            {data.today.yesterdayOrders > 0 && (
              <span className="text-[#8c8d7d]"> (hôm qua {formatInt(data.today.yesterdayOrders)} đơn)</span>
            )}
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Khoảng thời gian" className="flex border border-[#e4dfd2] bg-white">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={range === r.key}
                onClick={() => changeRange(r.key)}
                className={`px-3.5 py-2 text-[13px] font-medium transition ${
                  range === r.key ? "bg-[#344723] text-white" : "text-[#6f715f] hover:bg-[#f4f1e8]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={fetching}
            className="border border-[#e4dfd2] bg-white px-3.5 py-2 text-[13px] font-medium text-[#6f715f] transition hover:border-[#344723] hover:text-[#344723] disabled:opacity-60"
          >
            {fetching ? "Đang tải..." : "Làm mới"}
          </button>
          <button
            type="button"
            onClick={() => exportCsv(data)}
            className="bg-[#344723] px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-[#263719]"
          >
            Xuất CSV
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#8c8d7d]">
        Giai đoạn xem: {formatDateKey(data.range.start)} – {formatDateKey(data.range.end)} ({rangeLabel}). Cập nhật lúc{" "}
        {new Date(data.generatedAt).toLocaleTimeString("vi-VN")}.
      </p>

      {error && (
        <p className="mt-4 border border-[#e6cfc4] bg-[#faf0ea] px-4 py-2.5 text-sm text-[#a04a2e]">
          {error} Đang hiển thị số liệu của lần tải trước.
        </p>
      )}

      {/* ================= CẦN XỬ LÝ NGAY ================= */}
      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7040]">Cần xử lý ngay</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          label="Chờ xác nhận"
          value={actions.pending}
          hint={actions.pendingLate > 0 ? `${formatInt(actions.pendingLate)} đơn đã chờ quá 24 giờ` : "Đơn mới cần xử lý"}
          href="/admin/orders?status=pending"
          urgent={actions.pending > 0}
        />
        <ActionCard
          label="Chờ nhận tiền"
          value={actions.waitingPayment}
          hint="Đơn chuyển khoản chưa xác nhận tiền"
          href="/admin/orders?payment=unpaid"
          urgent={actions.waitingPayment > 0}
        />
        <ActionCard
          label="Đang xử lý"
          value={actions.processing}
          hint={`Cần đóng gói và giao · ${formatInt(actions.shipped)} đơn đang giao`}
          href="/admin/orders?status=processing"
        />
        <ActionCard
          label="Cảnh báo tồn kho"
          value={stockAlerts}
          hint={`${formatInt(actions.outOfStock)} hết hàng · ${formatInt(actions.lowStock)} sắp hết (≤ ${data.lowStockLimit})`}
          href="/admin/products"
          urgent={actions.outOfStock > 0}
        />
      </div>

      {/* ================= CHỈ SỐ KINH DOANH ================= */}
      <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c7040]">Kết quả kinh doanh · {rangeLabel}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Doanh thu"
          value={formatPrice(cur.revenue)}
          delta={<DeltaBadge current={cur.revenue} previous={prev.revenue} />}
          spark={<Sparkline values={data.series.map((s) => s.revenue)} color="#344723" />}
          hint="Đơn đã thanh toán, không tính đơn hủy"
        />
        <KpiCard
          label="Đơn hàng"
          value={formatInt(cur.orders)}
          delta={<DeltaBadge current={cur.orders} previous={prev.orders} />}
          spark={<Sparkline values={data.series.map((s) => s.orders)} color="#8c7040" />}
          hint={`${formatInt(cur.valid)} hợp lệ · ${formatInt(cur.cancelled)} đã hủy`}
        />
        <KpiCard
          label="Giá trị trung bình / đơn"
          value={formatPrice(cur.aov)}
          delta={<DeltaBadge current={cur.aov} previous={prev.aov} />}
          spark={<Sparkline values={data.series.map((s) => (s.valid ? s.gross / s.valid : 0))} color="#5b8fc4" />}
          hint="Tính trên các đơn không bị hủy"
        />
        <KpiCard
          label="Khách hàng mới"
          value={formatInt(cur.newCustomers)}
          delta={<DeltaBadge current={cur.newCustomers} previous={prev.newCustomers} />}
          spark={<Sparkline values={data.series.map((s) => s.customers)} color="#7a66c2" />}
          hint="Tài khoản khách đăng ký trong giai đoạn"
        />
      </div>

      {/* ================= BIỂU ĐỒ XU HƯỚNG + TRẠNG THÁI ================= */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Doanh thu và đơn hàng theo thời gian"
          subtitle={data.range.unit === "month" ? "Gom theo tháng, 12 tháng gần nhất" : "Gom theo ngày"}
        >
          <TrendChart data={chartData} ariaLabel={`Biểu đồ doanh thu và số đơn hàng ${rangeLabel} gần nhất`} />
        </Card>

        <Card title="Trạng thái đơn hàng" subtitle={`${formatInt(cur.orders)} đơn trong ${rangeLabel.toLowerCase()}`}>
          <Donut segments={statusSegments} centerLabel="Tổng đơn" centerValue={formatInt(cur.orders)} emptyText="Chưa có đơn" />
        </Card>
      </div>

      {/* ================= SẢN PHẨM + DANH MỤC ================= */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Sản phẩm bán chạy"
          subtitle="Xếp theo doanh số, không tính đơn hủy"
          action={
            <Link href="/admin/products" className="flex-shrink-0 text-xs font-semibold text-[#8c7040] hover:text-[#344723]">
              Xem sản phẩm
            </Link>
          }
        >
          <HBarList
            items={productItems}
            emptyText="Chưa có sản phẩm nào được bán trong giai đoạn này."
            renderLink={(href, content) => (
              <Link href={href} className="block">
                {content}
              </Link>
            )}
          />
        </Card>

        <Card title="Doanh số theo danh mục" subtitle="Giá trị hàng hóa, chưa gồm phí vận chuyển">
          <Donut
            segments={categorySegments}
            centerLabel="Tổng doanh số"
            centerValue={`${formatCompactVnd(categoryTotal)}đ`}
            formatValue={(v) => `${formatCompactVnd(v)}đ`}
            emptyText="Chưa có doanh số"
          />
        </Card>
      </div>

      {/* ================= THANH TOÁN + THỨ TRONG TUẦN + HIỆU SUẤT ================= */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Phương thức thanh toán" subtitle="Đơn không bị hủy">
          <Donut segments={paymentSegments} centerLabel="Tổng đơn" centerValue={formatInt(paymentSegments.reduce((s, x) => s + x.value, 0))} emptyText="Chưa có đơn" />
        </Card>

        <Card
          title="Đơn theo thứ trong tuần"
          subtitle={peakDay.orders > 0 ? `Đông đơn nhất: ${WEEKDAY_LONG[peakDay.day]} (${formatInt(peakDay.orders)} đơn)` : "Chưa có dữ liệu"}
        >
          <WeekdayBars items={weekdayItems} />
        </Card>

        <Card title="Hiệu suất bán hàng" subtitle={`So với kỳ trước ${rangeLabel.toLowerCase()}`}>
          <div className="space-y-5">
            <MetricRow
              label="Tỷ lệ giao thành công"
              value={formatPercent(completionRate)}
              percent={completionRate}
              color="#53633c"
              note={`${formatInt(delivered)} / ${formatInt(cur.orders)} đơn đã giao`}
            />
            <MetricRow
              label="Tỷ lệ hủy đơn"
              value={formatPercent(cancelRate)}
              percent={cancelRate}
              color="#c0644a"
              note={<DeltaBadge current={cancelRate} previous={prevCancelRate} invert suffix="so với kỳ trước" />}
            />
            <MetricRow
              label="Tỷ lệ đã thu tiền"
              value={formatPercent(collectRate)}
              percent={collectRate}
              color="#8c7040"
              note={`Còn ${formatPrice(uncollected)} chưa thu`}
            />
            <div className="border-t border-[#efe9da] pt-4">
              <MetricRow
                label="Sản phẩm trên cửa hàng"
                value={`${formatInt(data.products.active)} đang bán`}
                note={`${formatInt(data.products.hidden)} đang ẩn · Tổng doanh thu từ đầu: ${formatPrice(data.lifetimeRevenue)}`}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ================= TỒN KHO + ĐƠN MỚI NHẤT ================= */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          title="Sắp hết hàng"
          subtitle={`Quy cách còn từ ${data.lowStockLimit} sản phẩm trở xuống`}
          action={
            <Link href="/admin/products" className="flex-shrink-0 text-xs font-semibold text-[#8c7040] hover:text-[#344723]">
              Nhập kho
            </Link>
          }
        >
          {data.lowStock.length === 0 ? (
            <EmptyNote>Tồn kho đều ổn.</EmptyNote>
          ) : (
            <ul className="divide-y divide-[#efe9da]">
              {data.lowStock.map((item, index) => (
                <li key={`${item.productId}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${item.productId}`} className="min-w-0 truncate hover:text-[#8c7040]">
                    {item.name} <span className="text-[#8c8d7d]">({item.variantName})</span>
                  </Link>
                  <span
                    className={`flex-shrink-0 px-2.5 py-0.5 text-xs font-semibold ${
                      item.stock === 0 ? "bg-[#f6e3dc] text-[#9a4528]" : "bg-[#fbf1d9] text-[#8a6a1a]"
                    }`}
                  >
                    {item.stock === 0 ? "Hết hàng" : `Còn ${item.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <section className="min-w-0 border border-[#e4dfd2] bg-white xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#344723]">Đơn hàng mới nhất</h2>
              <p className="mt-0.5 text-xs text-[#8c8d7d]">8 đơn gần đây, bất kể khoảng thời gian đang xem</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#8c7040] hover:text-[#344723]">
              Xem tất cả
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <EmptyNote>Chưa có đơn hàng nào.</EmptyNote>
          ) : (
            <ul className="divide-y divide-[#efe9da] border-t border-[#efe9da]">
              {data.recentOrders.map((order) => {
                const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm transition hover:bg-[#faf8f1] sm:px-6"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="flex-shrink-0 font-semibold text-[#344723]">{formatOrderCode(order.id)}</span>
                          <span className="truncate text-[#292c18]">{order.receiverName}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-[#8c8d7d]">
                          {formatDateTime(order.createdAt)} · {formatInt(order.itemCount)} sản phẩm ·{" "}
                          {order.paymentMethod === "bank" ? "Chuyển khoản" : "COD"} ·{" "}
                          <span className={order.paymentStatus === "paid" ? "text-[#3b6a2a]" : "text-[#a3844a]"}>
                            {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <span className="font-semibold text-[#9b7130]">{formatPrice(order.totalAmount)}</span>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold ${status.badge}`}>{status.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ================= KHÁCH HÀNG TIÊU BIỂU (CHỈ QUẢN TRỊ VIÊN) ================= */}
      {isAdmin && data.topCustomers && (
        <Card
          className="mt-6"
          title="Khách hàng chi tiêu nhiều nhất"
          subtitle={`Trong ${rangeLabel.toLowerCase()} · chỉ quản trị viên xem được`}
        >
          {data.topCustomers.length === 0 ? (
            <EmptyNote>Chưa có khách hàng nào mua hàng trong giai đoạn này.</EmptyNote>
          ) : (
            <ol className="divide-y divide-[#efe9da]">
              {data.topCustomers.map((customer, index) => (
                <li key={customer.id} className="flex items-center gap-4 py-3">
                  <span className="w-5 flex-shrink-0 text-center font-serif text-sm font-semibold text-[#a3a493]">{index + 1}</span>
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-[#344723] text-sm font-semibold text-white" aria-hidden="true">
                    {customer.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#292c18]">{customer.name}</span>
                    <span className="block truncate text-xs text-[#8c8d7d]">{customer.email}</span>
                  </span>
                  <span className="hidden text-xs text-[#6f715f] sm:block">{formatInt(customer.orders)} đơn</span>
                  <span className="w-32 text-right text-sm font-semibold text-[#9b7130]">{formatPrice(customer.spent)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}