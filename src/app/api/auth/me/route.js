import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Trả về thông tin người đang đăng nhập.
// Vai trò được đọc lại từ DATABASE (không chỉ tin thẻ đăng nhập), nên khi admin đổi quyền
// hoặc xóa tài khoản, giao diện cập nhật ngay.
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json({ user: null });
  }

  const [rows] = await pool.query('SELECT id, full_name, role FROM users WHERE id = ?', [
    Number(payload.sub),
  ]);
  const user = rows[0];

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: { id: user.id, name: user.full_name, role: user.role },
  });
}