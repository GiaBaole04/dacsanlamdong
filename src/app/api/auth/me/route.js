import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Trả về thông tin người đang đăng nhập (đọc từ cookie httpOnly).
// Trình duyệt không tự đọc được cookie này, nên giao diện phải hỏi API này
// để biết "ai đang đăng nhập" mà hiển thị header cho đúng.
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: payload.sub,
      name: payload.name,
      role: payload.role,
    },
  });
}
