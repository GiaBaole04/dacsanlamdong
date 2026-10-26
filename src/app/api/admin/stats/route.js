import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
// Các khoảng thời gian cho phép (chỉ nhận đúng các giá trị này, không nhận số tùy ý từ trình duyệt).
//  - unit "day"  : gom số liệu theo ngày
//  - unit "month": gom số liệu theo tháng (12 tháng gần nhất)
const RANGES = {
  '7': { days: 7, unit: 'day' },
  '30': { days: 30, unit: 'day' },
  '90': { days: 90, unit: 'day' },
  '365': { days: 365, unit: 'month' },
};
const DEFAULT_RANGE = '30';

// Tồn kho từ mức này trở xuống được coi là "sắp hết hàng"
const LOW_STOCK_LIMIT = 5;

const DAY_MS = 86400000;

// ---- Hàm xử lý ngày (tính theo UTC trên chuỗi YYYY-MM-DD, tránh lệch múi giờ) ----
function parseKey(key) {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function toKey(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}
function addDays(key, n) {
  return toKey(parseKey(key) + n * DAY_MS);
}
function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  return toKey(Date.UTC(y, m - 1 + n, 1));
}

// Các cột tổng hợp dùng chung cho mọi truy vấn trên bảng orders.
//  orders  : tất cả đơn đặt trong kỳ
//  valid   : đơn không bị hủy
//  gross   : giá trị các đơn không bị hủy (doanh số)
//  revenue : giá trị các đơn không bị hủy VÀ đã thanh toán (doanh thu thực thu)
const ORDER_AGG = `
  COUNT(*) AS orders,
  COALESCE(SUM(status <> 'cancelled'), 0) AS valid,
  COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total_amount ELSE 0 END), 0) AS gross,
  COALESCE(SUM(CASE WHEN status <> 'cancelled' AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue`;

function shapeAgg(row = {}) {
  const orders = Number(row.orders || 0);
  const valid = Number(row.valid || 0);
  const gross = Number(row.gross || 0);
  const revenue = Number(row.revenue || 0);
  return {
    orders,
    valid,
    cancelled: orders - valid,
    gross,
    revenue,
    aov: valid > 0 ? Math.round(gross / valid) : 0,
  };
}

// Số liệu cho trang Tổng quan của quản trị (admin và nhân viên đều xem được)
async function handleGET(request) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const { user } = guard;
  const isAdmin = user.role === 'admin';

  try {
    const requested = new URL(request.url).searchParams.get('range');
    const rangeKey = Object.hasOwn(RANGES, requested) ? requested : DEFAULT_RANGE;
    const { days, unit } = RANGES[rangeKey];

    // Lấy "hôm nay" theo giờ của chính máy chủ database để các mốc ngày luôn khớp với created_at
    const [[nowRow]] = await pool.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
    const today = nowRow.today;
    const tomorrow = addDays(today, 1);
    const yesterday = addDays(today, -1);

    // Kỳ hiện tại [start, tomorrow) và kỳ liền trước có cùng độ dài [prevStart, start)
    const start = unit === 'month' ? addMonths(today, -11) : addDays(today, -(days - 1));
    const spanDays = Math.round((parseKey(tomorrow) - parseKey(start)) / DAY_MS);
    const prevStart = addDays(start, -spanDays);

    // Các mốc thời gian (cột) của biểu đồ
    const bucketFormat = unit === 'month' ? '%Y-%m' : '%Y-%m-%d';
    const bucketKeys = [];
    if (unit === 'month') {
      for (let i = 0; i < 12; i++) bucketKeys.push(addMonths(start, i).slice(0, 7));
    } else {
      for (let i = 0; i < days; i++) bucketKeys.push(addDays(start, i));
    }

    const inRange = 'created_at >= ? AND created_at < ?';
    const period = [start, tomorrow];

    const [
      [seriesRows],
      [[prevRow]],
      [customerSeriesRows],
      [[prevCustomers]],
      [[todayRow]],
      [[yesterdayRow]],
      [statusAllRows],
      [statusRows],
      [paymentRows],
      [categoryRows],
      [topProductRows],
      [weekdayRows],
      [[waiting]],
      [[lateRow]],
      [[stockCounts]],
      [lowStock],
      [recent],
      [[productCounts]],
      [[lifetime]],
    ] = await Promise.all([
      // 1. Chuỗi thời gian (theo ngày hoặc tháng)
      pool.query(
        `SELECT DATE_FORMAT(created_at, '${bucketFormat}') AS k, ${ORDER_AGG}
         FROM orders WHERE ${inRange} GROUP BY k`,
        period
      ),
      // 2. Tổng của kỳ trước (để so sánh)
      pool.query(`SELECT ${ORDER_AGG} FROM orders WHERE ${inRange}`, [prevStart, start]),
      // 3. Khách hàng mới theo thời gian
      pool.query(
        `SELECT DATE_FORMAT(created_at, '${bucketFormat}') AS k, COUNT(*) AS c
         FROM users WHERE role = 'customer' AND ${inRange} GROUP BY k`,
        period
      ),
      pool.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer' AND ${inRange}`, [prevStart, start]),
      // 4. Hôm nay / hôm qua
      pool.query(`SELECT ${ORDER_AGG} FROM orders WHERE ${inRange}`, [today, tomorrow]),
      pool.query(`SELECT ${ORDER_AGG} FROM orders WHERE ${inRange}`, [yesterday, today]),
      // 5. Việc cần xử lý (không phụ thuộc khoảng thời gian đang xem)
      pool.query('SELECT status, COUNT(*) AS c FROM orders GROUP BY status'),
      // 6. Cơ cấu trạng thái đơn trong kỳ
      pool.query(
        `SELECT status, COUNT(*) AS c, COALESCE(SUM(total_amount), 0) AS v
         FROM orders WHERE ${inRange} GROUP BY status`,
        period
      ),
      // 7. Cơ cấu phương thức thanh toán (đơn không bị hủy)
      pool.query(
        `SELECT payment_method AS method, COUNT(*) AS c, COALESCE(SUM(total_amount), 0) AS v
         FROM orders WHERE ${inRange} AND status <> 'cancelled' GROUP BY payment_method`,
        period
      ),
      // 8. Doanh số theo danh mục
      pool.query(
        `SELECT c.id, c.name, COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS v, COALESCE(SUM(oi.quantity), 0) AS qty
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN product_variants pv ON pv.id = oi.variant_id
         JOIN products p ON p.id = pv.product_id
         JOIN categories c ON c.id = p.category_id
         WHERE o.created_at >= ? AND o.created_at < ? AND o.status <> 'cancelled'
         GROUP BY c.id, c.name
         ORDER BY v DESC`,
        period
      ),
      // 9. Sản phẩm bán chạy
      pool.query(
        `SELECT p.id, p.name, p.image_url,
                COALESCE(SUM(oi.quantity), 0) AS qty,
                COALESCE(SUM(oi.quantity * oi.price_at_order), 0) AS v
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN product_variants pv ON pv.id = oi.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE o.created_at >= ? AND o.created_at < ? AND o.status <> 'cancelled'
         GROUP BY p.id, p.name, p.image_url
         ORDER BY v DESC, qty DESC
         LIMIT 6`,
        period
      ),
      // 10. Đơn theo thứ trong tuần (WEEKDAY: 0 = thứ Hai ... 6 = Chủ nhật)
      pool.query(
        `SELECT WEEKDAY(created_at) AS wd, COUNT(*) AS c
         FROM orders WHERE ${inRange} AND status <> 'cancelled' GROUP BY wd`,
        period
      ),
      // 11. Đơn chuyển khoản đang chờ cửa hàng nhận tiền
      pool.query(
        `SELECT COUNT(*) AS c FROM orders
         WHERE payment_method = 'bank' AND payment_status = 'unpaid'
           AND status NOT IN ('cancelled', 'delivered')`
      ),
      // 12. Đơn chờ xác nhận quá 24 giờ
      pool.query(
        `SELECT COUNT(*) AS c FROM orders
         WHERE status = 'pending' AND created_at < NOW() - INTERVAL 1 DAY`
      ),
      // 13. Số quy cách hết hàng / sắp hết hàng
      pool.query(
        `SELECT COALESCE(SUM(pv.stock = 0), 0) AS out_count,
                COALESCE(SUM(pv.stock > 0 AND pv.stock <= ?), 0) AS low_count
         FROM product_variants pv JOIN products p ON p.id = pv.product_id
         WHERE p.is_active = 1`,
        [LOW_STOCK_LIMIT]
      ),
      // 14. Danh sách sắp hết hàng
      pool.query(
        `SELECT p.id AS productId, p.name, pv.variant_name AS variantName, pv.stock
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE p.is_active = 1 AND pv.stock <= ?
         ORDER BY pv.stock ASC, p.name
         LIMIT 8`,
        [LOW_STOCK_LIMIT]
      ),
      // 15. Đơn mới nhất
      pool.query(
        `SELECT o.id, o.status, o.total_amount, o.receiver_name, o.created_at,
                o.payment_method, o.payment_status,
                (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
         FROM orders o ORDER BY o.id DESC LIMIT 8`
      ),
      // 16. Số sản phẩm đang bán / đang ẩn
      pool.query(
        'SELECT COALESCE(SUM(is_active = 1), 0) AS active, COALESCE(SUM(is_active = 0), 0) AS hidden FROM products'
      ),
      // 17. Tổng doanh thu từ trước đến nay
      pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM orders WHERE payment_status = 'paid' AND status <> 'cancelled'`
      ),
    ]);

    // ---- Chuỗi thời gian: điền đủ các mốc (mốc không có đơn = 0) ----
    const seriesMap = new Map(seriesRows.map((r) => [r.k, r]));
    const customerMap = new Map(customerSeriesRows.map((r) => [r.k, Number(r.c)]));
    const series = bucketKeys.map((key) => {
      const agg = shapeAgg(seriesMap.get(key));
      return { key, ...agg, customers: customerMap.get(key) || 0 };
    });

    const current = {
      orders: series.reduce((s, x) => s + x.orders, 0),
      valid: series.reduce((s, x) => s + x.valid, 0),
      gross: series.reduce((s, x) => s + x.gross, 0),
      revenue: series.reduce((s, x) => s + x.revenue, 0),
      newCustomers: series.reduce((s, x) => s + x.customers, 0),
    };
    current.cancelled = current.orders - current.valid;
    current.aov = current.valid > 0 ? Math.round(current.gross / current.valid) : 0;

    const previous = { ...shapeAgg(prevRow), newCustomers: Number(prevCustomers.c || 0) };

    // ---- Cơ cấu trạng thái (đủ 5 trạng thái, theo thứ tự quy trình) ----
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statusMap = new Map(statusRows.map((r) => [r.status, r]));
    const statusBreakdown = statusOrder.map((status) => ({
      status,
      count: Number(statusMap.get(status)?.c || 0),
      value: Number(statusMap.get(status)?.v || 0),
    }));

    const allStatus = Object.fromEntries(statusAllRows.map((r) => [r.status, Number(r.c)]));

    // ---- Đơn theo thứ trong tuần ----
    const weekdayMap = new Map(weekdayRows.map((r) => [Number(r.wd), Number(r.c)]));
    const weekdays = Array.from({ length: 7 }, (_, i) => ({ day: i, orders: weekdayMap.get(i) || 0 }));

    // ---- Khách hàng chi tiêu nhiều nhất (chỉ quản trị viên được xem) ----
    let topCustomers = null;
    if (isAdmin) {
      const [rows] = await pool.query(
        `SELECT u.id, u.full_name, u.email, COUNT(*) AS orders, COALESCE(SUM(o.total_amount), 0) AS spent
         FROM orders o JOIN users u ON u.id = o.user_id
         WHERE o.created_at >= ? AND o.created_at < ? AND o.status <> 'cancelled'
         GROUP BY u.id, u.full_name, u.email
         ORDER BY spent DESC, orders DESC
         LIMIT 5`,
        period
      );
      topCustomers = rows.map((r) => ({
        id: r.id,
        name: r.full_name,
        email: r.email,
        orders: Number(r.orders),
        spent: Number(r.spent),
      }));
    }

    const todayAgg = shapeAgg(todayRow);
    const yesterdayAgg = shapeAgg(yesterdayRow);

    return NextResponse.json({
      viewer: { role: user.role, name: user.name },
      generatedAt: new Date().toISOString(),
      range: { key: rangeKey, unit, start, end: today, days: spanDays },
      today: {
        orders: todayAgg.orders,
        gross: todayAgg.gross,
        yesterdayOrders: yesterdayAgg.orders,
        yesterdayGross: yesterdayAgg.gross,
      },
      actions: {
        pending: allStatus.pending || 0,
        pendingLate: Number(lateRow.c),
        processing: allStatus.processing || 0,
        shipped: allStatus.shipped || 0,
        waitingPayment: Number(waiting.c),
        outOfStock: Number(stockCounts.out_count),
        lowStock: Number(stockCounts.low_count),
      },
      totals: { current, previous },
      series,
      statusBreakdown,
      paymentBreakdown: paymentRows.map((r) => ({
        method: r.method,
        count: Number(r.c),
        value: Number(r.v),
      })),
      categories: categoryRows.map((r) => ({
        id: r.id,
        name: r.name,
        value: Number(r.v),
        qty: Number(r.qty),
      })),
      topProducts: topProductRows.map((r) => ({
        id: r.id,
        name: r.name,
        imageUrl: r.image_url,
        qty: Number(r.qty),
        value: Number(r.v),
      })),
      weekdays,
      topCustomers,
      lowStockLimit: LOW_STOCK_LIMIT,
      lowStock: lowStock.map((r) => ({ ...r, stock: Number(r.stock) })),
      recentOrders: recent.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: Number(o.total_amount),
        receiverName: o.receiver_name,
        createdAt: o.created_at,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        itemCount: Number(o.item_count),
      })),
      products: { active: Number(productCounts.active), hidden: Number(productCounts.hidden) },
      lifetimeRevenue: Number(lifetime.total),
    });
  } catch (error) {
    console.error('admin stats error:', error);
    return NextResponse.json({ error: 'Không tải được số liệu thống kê.' }, { status: 500 });
  }
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
