import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
const ROLES = ['customer', 'staff', 'admin'];

// Danh sách tài khoản — CHỈ ADMIN
async function handleGET(request) {
  const guard = await requireStaff({ adminOnly: true });
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url ?? 'http://localhost/', 'http://localhost');
  const role = searchParams.get('role') || 'all';
  const q = (searchParams.get('q') || '').trim().slice(0, 100);

  const where = [];
  const params = [];

  if (ROLES.includes(role)) {
    where.push('u.role = ?');
    params.push(role);
  }

  if (q) {
    const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    where.push('(u.full_name LIKE ? OR u.email LIKE ?)');
    params.push(like, like);
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.email_verified, u.created_at,
            CASE WHEN u.locked_until > NOW() THEN u.locked_until ELSE NULL END AS locked_until,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
     FROM users u
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY FIELD(u.role, 'admin', 'staff', 'customer'), u.id
     LIMIT 200`,
    params
  );

  const [roleRows] = await pool.query('SELECT role, COUNT(*) AS c FROM users GROUP BY role');
  const counts = { admin: 0, staff: 0, customer: 0 };
  for (const r of roleRows) counts[r.role] = Number(r.c);

  return NextResponse.json({
    users: rows.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      emailVerified: Boolean(u.email_verified),
      lockedUntil: u.locked_until,
      orderCount: Number(u.order_count),
      createdAt: u.created_at,
    })),
    counts,
    currentUserId: guard.user.id,
  });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
