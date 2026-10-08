import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Kiểm tra quyền cho các API quản trị.
 *   const guard = await requireStaff();            // admin hoặc nhân viên
 *   const guard = await requireStaff({ adminOnly: true });   // chỉ admin
 *   if (guard.response) return guard.response;     // chưa đăng nhập (401) hoặc không đủ quyền (403)
 *   const { user } = guard;
 *
 * Quyền được đọc lại từ DATABASE mỗi lần gọi (không chỉ tin vào thẻ đăng nhập), nên khi admin
 * hạ quyền hoặc khóa một nhân viên thì có hiệu lực ngay, không phải đợi thẻ cũ hết hạn.
 */
export async function requireStaff({ adminOnly = false } = {}) {
  const session = await getCurrentUser();

  if (!session) {
    return { response: NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 }) };
  }

  const [rows] = await pool.query(
    'SELECT id, full_name, role, email_verified FROM users WHERE id = ?',
    [Number(session.sub)]
  );
  const user = rows[0];

  if (!user) {
    return { response: NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 }) };
  }

  const allowed = adminOnly ? ['admin'] : ['admin', 'staff'];

  if (!user.email_verified || !allowed.includes(user.role)) {
    return {
      response: NextResponse.json(
        { error: 'Bạn không có quyền thực hiện thao tác này.' },
        { status: 403 }
      ),
    };
  }

  return { user: { id: user.id, name: user.full_name, role: user.role } };
}