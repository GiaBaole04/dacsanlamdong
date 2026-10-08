import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAGE_SIZE = 15;

// Danh sách đơn hàng cho quản trị: lọc theo trạng thái / thanh toán, tìm theo mã đơn, tên, SĐT, email
export async function GET(request) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const payment = searchParams.get('payment') || 'all';
  const q = (searchParams.get('q') || '').trim().slice(0, 100);
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const where = [];
  const params = [];

  if (payment === 'paid' || payment === 'unpaid') {
    where.push('o.payment_status = ?');
    params.push(payment);
  }

  if (q) {
    const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    const parts = ['o.receiver_name LIKE ?', 'o.phone LIKE ?', 'u.email LIKE ?'];
    params.push(like, like, like);

    // Gõ "DS-000042", "ds42" hoặc "42" thì tìm theo mã đơn
    const idMatch = q.match(/^(?:ds-?)?0*(\d{1,9})$/i);
    if (idMatch) {
      parts.push('o.id = ?');
      params.push(Number(idMatch[1]));
    }

    where.push(`(${parts.join(' OR ')})`);
  }

  const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Số đơn của từng trạng thái (để hiện trên các tab), áp dụng cùng bộ lọc tìm kiếm / thanh toán
  const [countRows] = await pool.query(
    `SELECT o.status, COUNT(*) AS c
     FROM orders o JOIN users u ON u.id = o.user_id
     ${baseWhere}
     GROUP BY o.status`,
    params
  );
  const counts = { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const row of countRows) {
    counts[row.status] = Number(row.c);
    counts.all += Number(row.c);
  }

  const filterStatus = STATUSES.includes(status);
  const listWhere = filterStatus
    ? `${baseWhere ? `${baseWhere} AND` : 'WHERE'} o.status = ?`
    : baseWhere;
  const listParams = filterStatus ? [...params, status] : params;
  const total = filterStatus ? counts[status] : counts.all;

  const [rows] = await pool.query(
    `SELECT o.id, o.status, o.payment_method, o.payment_status, o.total_amount,
            o.receiver_name, o.phone, o.created_at, u.email AS customer_email,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
     FROM orders o JOIN users u ON u.id = o.user_id
     ${listWhere}
     ORDER BY o.id DESC
     LIMIT ? OFFSET ?`,
    [...listParams, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  );

  return NextResponse.json({
    orders: rows.map((o) => ({
      id: o.id,
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      totalAmount: Number(o.total_amount),
      receiverName: o.receiver_name,
      phone: o.phone,
      customerEmail: o.customer_email,
      itemCount: Number(o.item_count),
      createdAt: o.created_at,
    })),
    counts,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}