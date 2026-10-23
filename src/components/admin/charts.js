"use client";

// Bộ biểu đồ dùng cho trang Tổng quan của quản trị.
// Tự vẽ bằng SVG nên KHÔNG cần cài thêm thư viện (recharts, chart.js...).
// Gồm: TrendChart (đường + cột 2 trục), Donut, HBarList, WeekdayBars, Sparkline, DeltaBadge.

import { useEffect, useId, useRef, useState } from "react";

const GREEN_DARK = "#344723";
const GREEN = "#53633c";
const GOLD = "#8c7040";
const GRID = "#ece6d6";
const MUTED = "#8c8d7d";

// ---------------------------------------------------------------------------
// Định dạng số
// ---------------------------------------------------------------------------

export function formatInt(value) {
  return (Number(value) || 0).toLocaleString("vi-VN");
}

// Số tiền rút gọn: 1.250.000 -> "1,3 tr", 850.000 -> "850k", 2.300.000.000 -> "2,3 tỷ"
export function formatCompactVnd(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const fmt = (x, digits) => x.toLocaleString("vi-VN", { maximumFractionDigits: digits });

  if (abs >= 1e9) return `${fmt(n / 1e9, 2)} tỷ`;
  if (abs >= 1e6) return `${fmt(n / 1e6, 1)} tr`;
  if (abs >= 1e3) return `${fmt(n / 1e3, 0)}k`;
  return fmt(n, 0);
}

export function formatPercent(value, digits = 1) {
  return `${(Number(value) || 0).toLocaleString("vi-VN", { maximumFractionDigits: digits })}%`;
}

// ---------------------------------------------------------------------------
// Hàm hỗ trợ
// ---------------------------------------------------------------------------

// Đo chiều rộng của khung chứa để biểu đồ luôn vừa khít (responsive)
function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0].contentRect.width);
      setWidth((prev) => (prev === next ? prev : next));
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

// Tính thang đo "đẹp" cho trục: ticks khoảng chia, trả về { max, step }
function niceScale(maxValue, ticks = 4, integer = false) {
  if (!(maxValue > 0)) {
    return { max: ticks, step: 1 };
  }

  const rough = maxValue / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / pow;

  let nice;
  if (fraction <= 1) nice = 1;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 2.5 && !integer) nice = 2.5;
  else if (fraction <= 5) nice = 5;
  else nice = 10;

  let step = nice * pow;
  if (integer && step < 1) step = 1;

  return { max: step * ticks, step };
}

// Đường cong mượt nhưng không "vọt" quá giá trị thật (monotone cubic)
function monotonePath(points) {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;

  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i++) {
    const h = points[i + 1][0] - points[i][0];
    dx.push(h);
    slope.push((points[i + 1][1] - points[i][1]) / h);
  }

  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  }
  tangent.push(slope[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      tangent[i] = k * a * slope[i];
      tangent[i + 1] = k * b * slope[i];
    }
  }

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    d +=
      `C${points[i][0] + h / 3},${points[i][1] + (tangent[i] * h) / 3},` +
      `${points[i + 1][0] - h / 3},${points[i + 1][1] - (tangent[i + 1] * h) / 3},` +
      `${points[i + 1][0]},${points[i + 1][1]}`;
  }
  return d;
}

// ---------------------------------------------------------------------------
// TrendChart: doanh thu (vùng + đường, trục trái) và số đơn (cột, trục phải)
// data: [{ key, label, title, revenue, orders }]
// ---------------------------------------------------------------------------

export function TrendChart({ data, height = 300, ariaLabel }) {
  const [wrapRef, width] = useElementWidth();
  const [hover, setHover] = useState(null);
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const margin = { top: 14, right: 40, bottom: 28, left: 52 };
  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;
  const count = data.length;

  const maxRevenue = Math.max(0, ...data.map((d) => d.revenue));
  const maxOrders = Math.max(0, ...data.map((d) => d.orders));
  const left = niceScale(maxRevenue, 4);
  const right = niceScale(maxOrders, 4, true);
  const isEmpty = maxRevenue === 0 && maxOrders === 0;

  const band = count > 0 ? innerW / count : 0;
  const xAt = (i) => margin.left + band * (i + 0.5);
  const yRevenue = (v) => margin.top + innerH - (v / left.max) * innerH;
  const yOrders = (v) => margin.top + innerH - (v / right.max) * innerH;
  const baseY = margin.top + innerH;

  const points = data.map((d, i) => [xAt(i), yRevenue(d.revenue)]);
  const linePath = monotonePath(points);
  const areaPath = points.length > 1 ? `${linePath}L${points[points.length - 1][0]},${baseY}L${points[0][0]},${baseY}Z` : "";

  const barWidth = Math.max(2, Math.min(band * 0.55, 26));

  // Chỉ hiện nhãn trục X đủ thưa để không chồng chữ (luôn hiện nhãn mốc mới nhất)
  const maxLabels = Math.max(2, Math.floor(innerW / 64));
  const labelEvery = Math.max(1, Math.ceil(count / maxLabels));

  function handleMove(event) {
    if (band <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const index = Math.min(count - 1, Math.max(0, Math.floor(x / band)));
    setHover(index);
  }

  const active = hover !== null ? data[hover] : null;
  const tooltipLeft = hover !== null ? xAt(hover) : 0;
  const flip = width > 0 && tooltipLeft > width * 0.6;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#6f715f]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-[3px] w-5 rounded-full" style={{ background: GREEN_DARK }} />
          Doanh thu (trục trái)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3" style={{ background: "#d9c9a0" }} />
          Số đơn hàng (trục phải)
        </span>
      </div>

      <div ref={wrapRef} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel || "Biểu đồ doanh thu và số đơn hàng theo thời gian"}
            className="block select-none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity="0.28" />
                <stop offset="100%" stopColor={GREEN} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Lưới ngang + nhãn hai trục */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = margin.top + (innerH / 4) * i;
              const revenueValue = left.max - left.step * i;
              const orderValue = right.max - right.step * i;
              return (
                <g key={i}>
                  <line x1={margin.left} x2={margin.left + innerW} y1={y} y2={y} stroke={GRID} strokeDasharray={i === 4 ? undefined : "3 4"} />
                  <text x={margin.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={MUTED}>
                    {formatCompactVnd(revenueValue)}
                  </text>
                  <text x={margin.left + innerW + 8} y={y + 4} textAnchor="start" fontSize="11" fill={MUTED}>
                    {formatInt(orderValue)}
                  </text>
                </g>
              );
            })}

            {/* Cột số đơn */}
            {data.map((d, i) =>
              d.orders > 0 ? (
                <rect
                  key={d.key}
                  x={xAt(i) - barWidth / 2}
                  y={yOrders(d.orders)}
                  width={barWidth}
                  height={baseY - yOrders(d.orders)}
                  fill={hover === i ? "#c9b27a" : "#d9c9a0"}
                />
              ) : null
            )}

            {/* Vùng + đường doanh thu */}
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
            <path d={linePath} fill="none" stroke={GREEN_DARK} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />

            {/* Chấm tròn: hiện tất cả khi ít mốc, còn lại chỉ hiện chấm khi rê chuột */}
            {data.map((d, i) =>
              count <= 14 || hover === i ? (
                <circle
                  key={d.key}
                  cx={xAt(i)}
                  cy={yRevenue(d.revenue)}
                  r={hover === i ? 5 : 3}
                  fill="#fff"
                  stroke={GREEN_DARK}
                  strokeWidth="2"
                />
              ) : null
            )}

            {/* Đường chỉ khi rê chuột */}
            {hover !== null && (
              <line x1={xAt(hover)} x2={xAt(hover)} y1={margin.top} y2={baseY} stroke={GOLD} strokeWidth="1" strokeDasharray="4 3" />
            )}

            {/* Nhãn trục X */}
            {data.map((d, i) =>
              (count - 1 - i) % labelEvery === 0 ? (
                <text key={d.key} x={xAt(i)} y={height - 8} textAnchor="middle" fontSize="11" fill={MUTED}>
                  {d.label}
                </text>
              ) : null
            )}

            {/* Lớp bắt chuột/cảm ứng */}
            <rect
              x={margin.left}
              y={margin.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={handleMove}
              onPointerDown={handleMove}
              onPointerLeave={() => setHover(null)}
            />

            {isEmpty && (
              <text x={margin.left + innerW / 2} y={margin.top + innerH / 2} textAnchor="middle" fontSize="13" fill={MUTED}>
                Chưa có đơn hàng trong giai đoạn này
              </text>
            )}
          </svg>
        )}

        {active && (
          <div
            className="pointer-events-none absolute z-10 min-w-[170px] border border-[#e4dfd2] bg-white px-3.5 py-2.5 text-xs shadow-lg"
            style={{
              top: 6,
              left: tooltipLeft,
              transform: flip ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <div className="font-semibold text-[#344723]">{active.title}</div>
            <div className="mt-1.5 flex items-center justify-between gap-4 text-[#6f715f]">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: GREEN_DARK }} />
                Doanh thu
              </span>
              <span className="font-semibold text-[#292c18]">{formatInt(active.revenue)}đ</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-4 text-[#6f715f]">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2" style={{ background: "#d9c9a0" }} />
                Đơn hàng
              </span>
              <span className="font-semibold text-[#292c18]">{formatInt(active.orders)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut: biểu đồ tròn rỗng + chú thích
// segments: [{ key, label, value, color, detail? }]
// ---------------------------------------------------------------------------

export function Donut({
  segments,
  centerLabel,
  centerValue,
  formatValue = formatInt,
  size = 168,
  thickness = 24,
  emptyText = "Chưa có dữ liệu",
}) {
  const [hoverKey, setHoverKey] = useState(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? 2 : 0;

  const arcs = visible.map((s, index) => {
    const before = visible.slice(0, index).reduce((sum, x) => sum + x.value, 0);
    const length = (s.value / total) * circumference;
    return { ...s, length: Math.max(0, length - gap), offset: (before / total) * circumference };
  });

  const hovered = hoverKey ? segments.find((s) => s.key === hoverKey) : null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={centerLabel || "Biểu đồ tròn"}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#efe9da" strokeWidth={thickness} />
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={hoverKey === arc.key ? thickness + 5 : thickness}
                strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                strokeDashoffset={-arc.offset}
                opacity={hoverKey && hoverKey !== arc.key ? 0.35 : 1}
                style={{ transition: "stroke-width 0.15s, opacity 0.15s" }}
                onPointerEnter={() => setHoverKey(arc.key)}
                onPointerLeave={() => setHoverKey(null)}
              />
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {total === 0 ? (
            <span className="text-xs text-[#8c8d7d]">{emptyText}</span>
          ) : hovered ? (
            <>
              <span className="max-w-full truncate text-[11px] text-[#8c8d7d]">{hovered.label}</span>
              <span className="font-serif text-xl font-semibold text-[#344723]">{formatValue(hovered.value)}</span>
              <span className="text-[11px] font-medium text-[#8c7040]">{formatPercent((hovered.value / total) * 100)}</span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[#8c8d7d]">{centerLabel}</span>
              <span className="font-serif text-xl font-semibold text-[#344723]">{centerValue}</span>
            </>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-2">
        {segments.map((s) => (
          <li
            key={s.key}
            className={`flex items-center gap-3 text-sm transition ${hoverKey && hoverKey !== s.key ? "opacity-50" : ""}`}
            onPointerEnter={() => setHoverKey(s.key)}
            onPointerLeave={() => setHoverKey(null)}
          >
            <span className="inline-block h-2.5 w-2.5 flex-shrink-0" style={{ background: s.color }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[#292c18]">{s.label}</span>
              {s.detail && <span className="block truncate text-[11px] text-[#8c8d7d]">{s.detail}</span>}
            </span>
            <span className="flex-shrink-0 text-right">
              <span className="block font-semibold text-[#292c18]">{formatValue(s.value)}</span>
              <span className="block text-[11px] text-[#8c8d7d]">{total > 0 ? formatPercent((s.value / total) * 100) : "0%"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HBarList: danh sách thanh ngang (xếp hạng)
// items: [{ key, label, sub?, valueLabel, value, image?, href?, color? }]
// ---------------------------------------------------------------------------

export function HBarList({ items, renderLink, emptyText = "Chưa có dữ liệu" }) {
  const max = Math.max(0, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-[#8c8d7d]">{emptyText}</p>;
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => {
        const content = (
          <div className="flex items-center gap-3">
            <span className="w-5 flex-shrink-0 text-center font-serif text-sm font-semibold text-[#a3a493]">{index + 1}</span>
            {item.image !== undefined && (
              <span className="h-11 w-11 flex-shrink-0 overflow-hidden bg-[#efe9da]">
                {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-[#292c18]">{item.label}</span>
                <span className="flex-shrink-0 text-sm font-semibold text-[#9b7130]">{item.valueLabel}</span>
              </div>
              {item.sub && <div className="mt-0.5 text-[11px] text-[#8c8d7d]">{item.sub}</div>}
              <div className="mt-1.5 h-1.5 w-full bg-[#efe9da]">
                <div
                  className="h-full"
                  style={{
                    width: `${max > 0 ? Math.max(3, (item.value / max) * 100) : 0}%`,
                    background: item.color || GREEN,
                  }}
                />
              </div>
            </div>
          </div>
        );

        return (
          <li key={item.key} className="transition hover:opacity-80">
            {renderLink && item.href ? renderLink(item.href, content) : content}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// WeekdayBars: cột số đơn theo thứ trong tuần (làm nổi bật ngày cao nhất)
// items: [{ key, label, title, value }]
// ---------------------------------------------------------------------------

export function WeekdayBars({ items, height = 150 }) {
  const max = Math.max(0, ...items.map((i) => i.value));

  return (
    <div role="img" aria-label="Biểu đồ số đơn hàng theo thứ trong tuần">
      <div className="flex items-end gap-2" style={{ height }}>
        {items.map((item) => {
          const isPeak = max > 0 && item.value === max;
          return (
            <div key={item.key} className="flex h-full flex-1 flex-col items-center justify-end" title={`${item.title}: ${item.value} đơn`}>
              <span className={`mb-1 text-xs ${isPeak ? "font-semibold text-[#344723]" : "text-[#6f715f]"}`}>{item.value}</span>
              <div
                className="w-full"
                style={{
                  height: `${max > 0 ? Math.max(3, (item.value / max) * 100) : 3}%`,
                  background: item.value === 0 ? "#efe9da" : isPeak ? GREEN_DARK : "#9fb084",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {items.map((item) => (
          <div key={item.key} className="flex-1 text-center text-[11px] text-[#8c8d7d]">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline: đường xu hướng nhỏ trong thẻ chỉ số
// ---------------------------------------------------------------------------

export function Sparkline({ values, color = GREEN, height = 36 }) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  if (!values || values.length < 2) {
    return <div style={{ height }} aria-hidden="true" />;
  }

  const viewW = 100;
  const viewH = 32;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const flat = max === min;

  const points = values.map((v, i) => [
    (i / (values.length - 1)) * viewW,
    flat ? viewH / 2 : viewH - 3 - ((v - min) / span) * (viewH - 6),
  ]);
  const line = monotonePath(points);
  const area = `${line}L${viewW},${viewH}L0,${viewH}Z`;

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="none" width="100%" height={height} aria-hidden="true" className="block">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DeltaBadge: % tăng/giảm so với kỳ trước
// invert = true khi "giảm là tốt" (ví dụ tỷ lệ hủy đơn)
// ---------------------------------------------------------------------------

export function DeltaBadge({ current, previous, invert = false, suffix = "so với kỳ trước" }) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;

  let badge;

  if (prev === 0 && cur === 0) {
    badge = <span className="bg-[#efece1] px-1.5 py-0.5 text-[11px] font-semibold text-[#8c8d7d]">—</span>;
  } else if (prev === 0) {
    badge = <span className="bg-[#e3eedc] px-1.5 py-0.5 text-[11px] font-semibold text-[#3b6a2a]">Mới</span>;
  } else {
    const pct = ((cur - prev) / prev) * 100;

    if (Math.abs(pct) < 0.05) {
      badge = <span className="bg-[#efece1] px-1.5 py-0.5 text-[11px] font-semibold text-[#8c8d7d]">0%</span>;
    } else {
      const up = pct > 0;
      const good = invert ? !up : up;
      badge = (
        <span
          className={`px-1.5 py-0.5 text-[11px] font-semibold ${good ? "bg-[#e3eedc] text-[#3b6a2a]" : "bg-[#f6e3dc] text-[#9a4528]"}`}
        >
          {up ? "▲" : "▼"} {Math.abs(pct) >= 1000 ? "> 999%" : formatPercent(Math.abs(pct))}
        </span>
      );
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {badge}
      <span className="text-[11px] text-[#8c8d7d]">{suffix}</span>
    </span>
  );
}