import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Số liệu cho trang Tổng quan của quản trị
export async function GET() {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const [statusRows] = await pool.query('SELECT status, COUNT(*) AS c FROM orders GROUP BY status');
  const statusCounts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const row of statusRows) statusCounts[row.status] = Number(row.c);

  // Đơn chuyển khoản đang chờ cửa hàng nhận tiền
  const [[waiting]] = await pool.query(
    `SELECT COUNT(*) AS c FROM orders
     WHERE payment_method = 'bank' AND payment_status = 'unpaid'
       AND status NOT IN ('cancelled', 'delivered')`
  );

  // Doanh thu = tổng các đơn ĐÃ THANH TOÁN và không bị hủy
  const [[revenue]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total,
            COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN total_amount ELSE 0 END), 0) AS last30
     FROM orders
     WHERE payment_status = 'paid' AND status <> 'cancelled'`
  );

  const [dailyRows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COUNT(*) AS orders,
            COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total_amount ELSE 0 END), 0) AS value
     FROM orders
     WHERE created_at >= CURDATE() - INTERVAL 6 DAY
     GROUP BY d`
  );
  const dailyMap = new Map(dailyRows.map((r) => [r.d, r]));
  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = dateKey(date);
    const row = dailyMap.get(key);
    daily.push({ date: key, orders: row ? Number(row.orders) : 0, value: row ? Number(row.value) : 0 });
  }

  const [lowStock] = await pool.query(
    `SELECT p.id AS productId, p.name, pv.variant_name AS variantName, pv.stock
     FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     WHERE p.is_active = 1 AND pv.stock <= 5
     ORDER BY pv.stock ASC, p.name
     LIMIT 8`
  );

  const [recent] = await pool.query(
    `SELECT id, status, total_amount, receiver_name, created_at
     FROM orders ORDER BY id DESC LIMIT 6`
  );

  const [[products]] = await pool.query(
    'SELECT COALESCE(SUM(is_active = 1), 0) AS active, COALESCE(SUM(is_active = 0), 0) AS hidden FROM products'
  );

  return NextResponse.json({
    statusCounts,
    waitingPayment: Number(waiting.c),
    revenue: { total: Number(revenue.total), last30: Number(revenue.last30) },
    daily,
    lowStock: lowStock.map((r) => ({ ...r, stock: Number(r.stock) })),
    recentOrders: recent.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: Number(o.total_amount),
      receiverName: o.receiver_name,
      createdAt: o.created_at,
    })),
    products: { active: Number(products.active), hidden: Number(products.hidden) },
  });
}