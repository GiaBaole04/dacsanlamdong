import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
const ROLES = ['customer', 'staff', 'admin'];

class AdminError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Đổi vai trò hoặc mở khóa tài khoản — CHỈ ADMIN
//   { role: "staff" }   hoặc   { unlock: true }
async function handlePATCH(request, { params }) {
  const guard = await requireStaff({ adminOnly: true });
  if (guard.response) return guard.response;

  const id = Number((await params).id);

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  const wantsRole = typeof body.role === 'string';
  const wantsUnlock = body.unlock === true;

  if (wantsRole === wantsUnlock || (wantsRole && !ROLES.includes(body.role))) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const actorId = guard.user.id;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Khóa tất cả admin theo thứ tự: 2 admin bấm hạ quyền nhau cùng lúc sẽ chạy lần lượt,
    // không thể xảy ra chuyện hệ thống không còn admin nào.
    const [admins] = await conn.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE");
    const [rows] = await conn.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [id]);
    const target = rows[0];

    if (!admins.some((a) => a.id === actorId)) {
      throw new AdminError('Bạn không còn quyền quản trị viên.', 403);
    }

    if (!target) {
      throw new AdminError('Không tìm thấy tài khoản.', 404);
    }

    if (wantsUnlock) {
      await conn.query('UPDATE users SET locked_until = NULL, failed_attempts = 0 WHERE id = ?', [id]);
    } else {
      const role = body.role;

      if (target.id === actorId) {
        throw new AdminError('Bạn không thể tự đổi quyền của chính mình.', 409);
      }

      if (target.role === role) {
        throw new AdminError('Tài khoản này đã có vai trò đó.', 409);
      }

      if (role !== 'customer' && !target.email_verified) {
        throw new AdminError('Chỉ cấp quyền cho tài khoản đã xác thực email.', 409);
      }

      if (target.role === 'admin' && role !== 'admin' && admins.length <= 1) {
        throw new AdminError('Hệ thống phải còn ít nhất một quản trị viên.', 409);
      }

      await conn.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    }

    await conn.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // bỏ qua
    }

    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('admin update user error:', error);
    return NextResponse.json({ error: 'Không cập nhật được tài khoản, vui lòng thử lại.' }, { status: 500 });
  } finally {
    conn.release();
  }
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const PATCH = withApi(handlePATCH);
