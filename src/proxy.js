import { NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// Next.js 16 đổi tên "middleware" thành "proxy" — chức năng giữ nguyên.
// Chạy TRƯỚC khi vào các trang khớp với "matcher" bên dưới.
// Hiện đang bảo vệ toàn bộ đường dẫn /admin/* — chỉ cho admin/staff vào.
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload || !['admin', 'staff'].includes(payload.role)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
