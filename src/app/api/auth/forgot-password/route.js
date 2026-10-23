import { pool } from '@/lib/db';
import { sendResetOtpEmail } from '@/lib/mailer';
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

const OTP_TTL_MS = 3 * 60 * 1000; // Mã OTP sống 3 phút
const RESEND_COOLDOWN_MS = 60 * 1000; // Phải đợi 60 giây mới được gửi lại

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

// Bước 1 của "Quên mật khẩu": nhận email, gửi mã OTP nếu tài khoản tồn tại.
// Luôn trả về ok dù email có tồn tại hay không, để không lộ email nào đã đăng ký.
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 });
    }

    const okResponse = () =>
      NextResponse.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });

    const [rows] = await pool.query(
      'SELECT id, email_verified, otp_expires_at FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];

    // Email không tồn tại hoặc chưa xác thực: không gửi gì, nhưng vẫn trả lời như thành công
    if (!user || !user.email_verified) {
      return okResponse();
    }

    // Chống spam gửi mail: chưa đủ 60 giây kể từ lần gửi trước thì bỏ qua
    const now = Date.now();
    if (user.otp_expires_at) {
      const lastSentAt = new Date(user.otp_expires_at).getTime() - OTP_TTL_MS;
      if (now - lastSentAt < RESEND_COOLDOWN_MS) {
        return okResponse();
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(now + OTP_TTL_MS);

    await pool.query(
      'UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0 WHERE id = ?',
      [otp, expiresAt, user.id]
    );

    await sendResetOtpEmail(email, otp);

    return okResponse();
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại sau.' }, { status: 500 });
  }
}
