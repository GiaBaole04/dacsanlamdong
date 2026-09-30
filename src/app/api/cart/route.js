import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Xem giỏ hàng của người đang đăng nhập
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const [rows] = await pool.query(
    `SELECT ci.id AS item_id, ci.quantity, ci.variant_id,
            p.id AS product_id, p.name, p.image_url, p.region,
            pv.variant_name, pv.price, pv.stock
     FROM cart_items ci
     JOIN product_variants pv ON ci.variant_id = pv.id
     JOIN products p ON pv.product_id = p.id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at DESC`,
    [user.sub]
  );

  const items = rows.map((r) => ({
    itemId: r.item_id,
    variantId: r.variant_id,
    productId: r.product_id,
    name: r.name,
    image_url: r.image_url,
    region: r.region,
    variantName: r.variant_name,
    price: Number(r.price),
    stock: r.stock,
    quantity: r.quantity,
  }));

  return NextResponse.json({ items });
}

// Thêm sản phẩm vào giỏ (nếu đã có quy cách này trong giỏ thì cộng dồn số lượng)
export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const { variantId, quantity } = await request.json();

  if (!variantId || !quantity) {
    return NextResponse.json({ error: 'Thiếu thông tin.' }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO cart_items (user_id, variant_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [user.sub, variantId, quantity]
  );

  return NextResponse.json({ ok: true });
}

// Đổi số lượng chính xác của 1 quy cách trong giỏ (dùng khi bấm nút +/- ở trang giỏ hàng)
export async function PUT(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const { variantId, quantity } = await request.json();

  if (!variantId || !quantity) {
    return NextResponse.json({ error: 'Thiếu thông tin.' }, { status: 400 });
  }

  await pool.query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND variant_id = ?', [
    quantity,
    user.sub,
    variantId,
  ]);

  return NextResponse.json({ ok: true });
}

// Xoá 1 sản phẩm khỏi giỏ
export async function DELETE(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const { variantId } = await request.json();

  await pool.query('DELETE FROM cart_items WHERE user_id = ? AND variant_id = ?', [
    user.sub,
    variantId,
  ]);

  return NextResponse.json({ ok: true });
}