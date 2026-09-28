import { pool } from '@/lib/db';
import { signToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // Khóa 15 phút sau khi sai đủ 5 lần

export async function POST(request) {
  try {
    const { email, password, remember } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Nhập đầy đủ email và mật khẩu.' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    // Dùng chung 1 câu thông báo cho "sai email" và "sai mật khẩu"
    // để không lộ ra email nào đã tồn tại trong hệ thống (best practice bảo mật)
    const invalidMessage = 'Email hoặc mật khẩu không đúng.';

    if (!user) {
      return NextResponse.json({ error: invalidMessage }, { status: 401 });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        { error: `Tài khoản đang tạm khóa do nhập sai nhiều lần. Thử lại sau ${minutesLeft} phút.` },
        { status: 423 }
      );
    }

    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư và xác thực trước khi đăng nhập.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const attempts = (user.failed_attempts || 0) + 1;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await pool.query('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?', [
          lockedUntil,
          user.id,
        ]);
        return NextResponse.json(
          { error: 'Bạn đã nhập sai quá 5 lần. Tài khoản tạm khóa 15 phút.' },
          { status: 423 }
        );
      }

      await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);

      return NextResponse.json(
        {
          error: `${invalidMessage} Còn ${MAX_FAILED_ATTEMPTS - attempts} lần thử trước khi tài khoản bị tạm khóa.`,
        },
        { status: 401 }
      );
    }

    // Đăng nhập đúng — reset bộ đếm sai
    await pool.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [
      user.id,
    ]);

    const token = await signToken(
      { sub: user.id, role: user.role, name: user.full_name },
      remember ? '30d' : '1d'
    );

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.full_name, role: user.role },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true, // JavaScript phía trình duyệt không đọc được, an toàn hơn localStorage
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 60 * 60 * 24 * 30 : undefined, // có "Ghi nhớ" -> 30 ngày; không tick -> hết khi đóng trình duyệt
    });

    return response;
  } catch (error) {
    console.error('login error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại sau.' }, { status: 500 });
  }
}
