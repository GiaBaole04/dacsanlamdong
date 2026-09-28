import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Thiếu thông tin xác thực.' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND email_verified = FALSE',
      [email]
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu đăng ký cho email này.' },
        { status: 404 }
      );
    }

    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Mã OTP đã hết hạn, vui lòng bấm gửi lại.' },
        { status: 400 }
      );
    }

    if (String(user.otp_code) !== String(otp)) {
      return NextResponse.json({ error: 'Mã OTP không đúng.' }, { status: 400 });
    }

    await pool.query(
      'UPDATE users SET email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
      [user.id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('verify-otp error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại sau.' }, { status: 500 });
  }
}
