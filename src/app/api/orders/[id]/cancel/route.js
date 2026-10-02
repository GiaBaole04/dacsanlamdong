import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Khách tự hủy đơn của mình — chỉ khi đơn còn "Chờ xác nhận" (pending).
// Hủy xong thì cộng trả số lượng về kho.
export async function POST(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId < 1) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    const order = rows[0];

    if (!order || order.user_id !== Number(user.sub)) {
      await conn.rollback();
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
    }

    if (order.status === 'cancelled') {
      await conn.rollback();
      return NextResponse.json({ error: 'Đơn hàng này đã được hủy trước đó.' }, { status: 409 });
    }

    if (order.status !== 'pending') {
      await conn.rollback();
      return NextResponse.json(
        { error: 'Đơn hàng đã được xử lý nên không thể hủy. Vui lòng liên hệ cửa hàng.' },
        { status: 409 }
      );
    }

    const [items] = await conn.query(
      'SELECT variant_id, quantity FROM order_items WHERE order_id = ? ORDER BY variant_id',
      [orderId]
    );

    for (const item of items) {
      await conn.query('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [
        item.quantity,
        item.variant_id,
      ]);
    }

    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);

    await conn.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // bỏ qua lỗi khi hoàn tác
    }

    console.error('cancel order error:', error);
    return NextResponse.json(
      { error: 'Không hủy được đơn hàng, vui lòng thử lại sau.' },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}