import { SignJWT, jwtVerify } from 'jose';

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

// Kiểm tra token có hợp lệ không (dùng ở middleware và các API cần biết ai đang đăng nhập)
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
