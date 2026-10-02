import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Chi tiết 1 đơn hàng. Chỉ chủ đơn (hoặc admin/nhân viên) mới xem được.
export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId < 1) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
  }

  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  const order = rows[0];

  const isOwner = order && order.user_id === Number(user.sub);
  const isStaff = ['admin', 'staff'].includes(user.role);

  // Trả 404 cho cả trường hợp "đơn của người khác" để không lộ ra đơn đó có tồn tại
  if (!order || (!isOwner && !isStaff)) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
  }

  const [items] = await pool.query(
    `SELECT id, variant_id, product_name, variant_name, image_url, quantity, price_at_order
     FROM order_items
     WHERE order_id = ?
     ORDER BY id`,
    [orderId]
  );

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      receiverName: order.receiver_name,
      phone: order.phone,
      shippingAddress: order.shipping_address,
      note: order.note,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      shippingFee: Number(order.shipping_fee),
      subtotal: Number(order.total_amount) - Number(order.shipping_fee),
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      items: items.map((i) => ({
        id: i.id,
        productName: i.product_name,
        variantName: i.variant_name,
        imageUrl: i.image_url,
        quantity: i.quantity,
        price: Number(i.price_at_order),
      })),
    },
  });
}