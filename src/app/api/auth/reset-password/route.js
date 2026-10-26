import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { HttpError, readJson, withApi } from '@/lib/apiHandler';
const MAX_OTP_ATTEMPTS = 5; // Nhập sai OTP quá 5 lần thì mã bị hủy

// Bước 2 của "Quên mật khẩu": kiểm tra OTP rồi đặt mật khẩu mới
async function handlePOST(request) {
  try {
    const { email, otp, password } = await readJson(request);

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !otp || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin đặt lại mật khẩu.' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(String(otp))) {
      return NextResponse.json({ error: 'Mã OTP gồm 6 chữ số.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu cần tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }
    if (password.length > 72) {
      return NextResponse.json({ error: 'Mật khẩu tối đa 72 ký tự.' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT id, email_verified, otp_code, otp_expires_at, otp_attempts FROM users WHERE email = ?',
      [email]
    );
    const user = rows[0];

    // Dùng chung 1 thông báo cho "không có tài khoản" và "không có mã" để không lộ email
    if (!user || !user.email_verified || !user.otp_code) {
      return NextResponse.json(
        { error: 'Mã OTP không còn hiệu lực, vui lòng gửi lại mã.' },
        { status: 400 }
      );
    }

    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Mã OTP đã hết hạn, vui lòng gửi lại mã.' },
        { status: 400 }
      );
    }

    if (String(user.otp_code) !== String(otp)) {
      const attempts = (user.otp_attempts || 0) + 1;

      if (attempts >= MAX_OTP_ATTEMPTS) {
        // Hủy mã (giữ nguyên otp_expires_at để vẫn tính thời gian chờ gửi lại)
        await pool.query('UPDATE users SET otp_code = NULL, otp_attempts = 0 WHERE id = ?', [
          user.id,
        ]);
        return NextResponse.json(
          { error: 'Bạn đã nhập sai quá 5 lần. Mã đã bị hủy, vui lòng gửi lại mã mới.' },
          { status: 429 }
        );
      }

      await pool.query('UPDATE users SET otp_attempts = ? WHERE id = ?', [attempts, user.id]);

      return NextResponse.json(
        { error: `Mã OTP không đúng. Còn ${MAX_OTP_ATTEMPTS - attempts} lần thử.` },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Đổi mật khẩu, xóa OTP, đồng thời mở khóa tài khoản nếu đang bị khóa do sai mật khẩu
    await pool.query(
      `UPDATE users
       SET password = ?, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0,
           failed_attempts = 0, locked_until = NULL
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) throw error; // lỗi có chủ đích: để withApi trả đúng thông báo
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại sau.' }, { status: 500 });
  }
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const POST = withApi(handlePOST);
