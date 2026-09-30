import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const SESSION_COOKIE_NAME = 'session_token';

// Tạo token đăng nhập. expiresIn ví dụ '1d' (1 ngày) hoặc '30d' (30 ngày, dùng khi tick "Ghi nhớ đăng nhập")
export async function signToken(payload, expiresIn = '1d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// Kiểm tra token có hợp lệ không (dùng ở middleware/proxy và các API cần biết ai đang đăng nhập)
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// Đọc thông tin người đang đăng nhập từ cookie, dùng trong các API route (Route Handler)
// Trả về { sub, role, name } nếu có đăng nhập hợp lệ, ngược lại trả về null
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}