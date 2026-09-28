import { pool } from '@/lib/db';
import { sendOtpEmail } from '@/lib/mailer';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const OTP_TTL_MS = 3 * 60 * 1000; // Mã OTP sống 3 phút
const RESEND_COOLDOWN_MS = 60 * 1000; // Phải đợi 60 giây mới được gửi lại

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// API này dùng chung cho cả "gửi OTP lần đầu khi đăng ký" và "bấm gửi lại OTP"
export async function POST(request) {
  try {
    const { email, full_name, password } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
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

      await pool.query('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?', [
        otp,
        expiresAt,
        existing.id,
      ]);

      await sendOtpEmail(email, otp);

      return NextResponse.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
    }

    // Trường hợp đăng ký mới hoàn toàn
    if (!full_name || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Nhập đầy đủ họ tên và mật khẩu (tối thiểu 6 ký tự).' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

    await pool.query(
      `INSERT INTO users (full_name, email, password, role, email_verified, otp_code, otp_expires_at)
       VALUES (?, ?, ?, 'customer', FALSE, ?, ?)`,
      [full_name, email, hashedPassword, otp, expiresAt]
    );

    await sendOtpEmail(email, otp);

    return NextResponse.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
  } catch (error) {
    console.error('send-otp error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại sau.' }, { status: 500 });
  }
}
