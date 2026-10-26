import { pool } from '@/lib/db';
import { sendOtpEmail } from '@/lib/mailer';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

import { HttpError, readJson, withApi } from '@/lib/apiHandler';
const OTP_TTL_MS = 3 * 60 * 1000; // Mã OTP sống 3 phút
const RESEND_COOLDOWN_MS = 60 * 1000; // Phải đợi 60 giây mới được gửi lại

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

// API này dùng chung cho cả "gửi OTP lần đầu khi đăng ký" và "bấm gửi lại OTP"
async function handlePOST(request) {
  try {
    const { email, full_name, password } = await readJson(request);

    if (typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 });
    }

    const [existingRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const existing = existingRows[0];

    if (existing?.email_verified) {
      return NextResponse.json({ error: 'Email này đã được đăng ký.' }, { status: 409 });
    }

    const now = new Date();

    if (existing) {
      // Trường hợp "Gửi lại OTP" cho một đăng ký đang chờ xác thực
      const lastSentAt = existing.otp_expires_at
        ? new Date(new Date(existing.otp_expires_at).getTime() - OTP_TTL_MS)
        : null;

      if (lastSentAt && now.getTime() - lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil(
          (RESEND_COOLDOWN_MS - (now.getTime() - lastSentAt.getTime())) / 1000
        );
        return NextResponse.json(
          { error: `Vui lòng đợi ${waitSeconds} giây trước khi gửi lại.` },
          { status: 429 }
        );
      }

      const otp = generateOtp();
      const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

      await pool.query('UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0 WHERE id = ?', [
        otp,
        expiresAt,
        existing.id,
      ]);

      await sendOtpEmail(email, otp);

      return NextResponse.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
    }

    // Trường hợp đăng ký mới hoàn toàn
    const fullName = typeof full_name === 'string' ? full_name.trim().replace(/\s+/g, ' ') : '';

    if (fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json({ error: 'Họ tên cần từ 2 đến 100 ký tự.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Nhập đầy đủ họ tên và mật khẩu (tối thiểu 6 ký tự).' },
        { status: 400 }
      );
    }

    // bcrypt chỉ dùng 72 ký tự đầu, nên giới hạn để tránh hiểu nhầm và tránh gửi chuỗi quá dài
    if (password.length > 72) {
      return NextResponse.json({ error: 'Mật khẩu tối đa 72 ký tự.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    await pool.query(
      `INSERT INTO users (full_name, email, password, role, email_verified, otp_code, otp_expires_at)
       VALUES (?, ?, ?, 'customer', FALSE, ?, ?)`,
      [fullName, email, hashedPassword, otp, expiresAt]
    );

    await sendOtpEmail(email, otp);

    return NextResponse.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
  } catch (error) {
    if (error instanceof HttpError) throw error; // lỗi có chủ đích: để withApi trả đúng thông báo
    console.error('send-otp error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại sau.' }, { status: 500 });
  }
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const POST = withApi(handlePOST);
