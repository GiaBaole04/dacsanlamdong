import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
async function handlePOST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const POST = withApi(handlePOST);
