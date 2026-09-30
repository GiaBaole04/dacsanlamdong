import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Gộp giỏ hàng "khách vãng lai" (đang lưu tạm ở localStorage trên trình duyệt)
// vào giỏ hàng thật của tài khoản, gọi ngay sau khi đăng nhập thành công.
export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const { items } = await request.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: true });
  }

  for (const item of items) {
    if (!item.variantId || !item.quantity) continue;

    await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [user.sub, item.variantId, item.quantity]
    );
  }

  return NextResponse.json({ ok: true });
}