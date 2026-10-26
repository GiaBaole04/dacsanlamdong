import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

const MAX_OTP_ATTEMPTS = 5; // Nhập sai OTP quá 5 lần thì mã bị hủy

import { HttpError, readJson, withApi } from '@/lib/apiHandler';
async function handlePOST(request) {
  try {
    const { email, otp } = await readJson(request);

    if (typeof email !== 'string' || !email.trim() || otp === undefined || otp === null || otp === '') {
      return NextResponse.json({ error: 'Thiếu thông tin xác thực.' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return NextResponse.json({ error: 'Mã OTP gồm 6 chữ số.' }, { status: 400 });
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

    // Mã đã bị hủy (nhập sai quá 5 lần) hoặc chưa từng được gửi
    if (!user.otp_code) {
      return NextResponse.json(
        { error: 'Mã OTP không còn hiệu lực, vui lòng bấm gửi lại mã mới.' },
        { status: 400 }
      );
    }

    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Mã OTP đã hết hạn, vui lòng bấm gửi lại.' },
        { status: 400 }
      );
    }

    if (String(user.otp_code) !== String(otp)) {
      const attempts = (user.otp_attempts || 0) + 1;

      // Nhập sai đủ 5 lần thì hủy mã, bắt buộc gửi lại mã mới (chống dò mã 6 chữ số)
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await pool.query('UPDATE users SET otp_code = NULL, otp_attempts = 0 WHERE id = ?', [user.id]);
        return NextResponse.json(
          { error: 'Bạn đã nhập sai quá 5 lần. Mã đã bị hủy, vui lòng bấm gửi lại mã mới.' },
          { status: 429 }
        );
      }

      await pool.query('UPDATE users SET otp_attempts = ? WHERE id = ?', [attempts, user.id]);

      return NextResponse.json(
        { error: `Mã OTP không đúng. Còn ${MAX_OTP_ATTEMPTS - attempts} lần thử.` },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE users SET email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = ?',
      [user.id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) throw error; // lỗi có chủ đích: để withApi trả đúng thông báo
    console.error('verify-otp error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại sau.' }, { status: 500 });
  }
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const POST = withApi(handlePOST);
