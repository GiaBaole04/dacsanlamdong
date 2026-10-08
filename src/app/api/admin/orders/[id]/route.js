import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { checkTransition, NEXT_STATUS } from '@/lib/orderRules';
import { NextResponse } from 'next/server';

class AdminError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Chi tiết 1 đơn cho quản trị: thông tin khách, hàng, nhật ký xử lý
export async function GET(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const orderId = parseId((await params).id);

  if (!orderId) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
  }

  const [rows] = await pool.query(
    `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId]
  );
  const order = rows[0];

  if (!order) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
  }

  const [items] = await pool.query(
    `SELECT id, product_name, variant_name, image_url, quantity, price_at_order
     FROM order_items WHERE order_id = ? ORDER BY id`,
    [orderId]
  );

  const [events] = await pool.query(
    `SELECT e.id, e.event, e.from_value, e.to_value, e.created_at, u.full_name AS by_name
     FROM order_events e LEFT JOIN users u ON u.id = e.user_id
     WHERE e.order_id = ? ORDER BY e.id DESC`,
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
      customer: { name: order.customer_name, email: order.customer_email },
      items: items.map((i) => ({
        id: i.id,
        productName: i.product_name,
        variantName: i.variant_name,
        imageUrl: i.image_url,
        quantity: i.quantity,
        price: Number(i.price_at_order),
      })),
      events: events.map((e) => ({
        id: e.id,
        event: e.event,
        from: e.from_value,
        to: e.to_value,
        by: e.by_name,
        createdAt: e.created_at,
      })),
    },
  });
}

// Xử lý đơn: đổi trạng thái  { status: "processing" }  hoặc  xác nhận đã nhận tiền  { markPaid: true }
export async function PATCH(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const orderId = parseId((await params).id);

  if (!orderId) {
    return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  const wantsStatus = typeof body.status === 'string';
  const wantsPaid = body.markPaid === true;

  // Mỗi lần chỉ làm đúng 1 việc
  if (wantsStatus === wantsPaid || (wantsStatus && !(body.status in NEXT_STATUS))) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const staffId = guard.user.id;
  const conn = await pool.getConnection();

  const logEvent = (event, from, to) =>
    conn.query(
      'INSERT INTO order_events (order_id, user_id, event, from_value, to_value) VALUES (?, ?, ?, ?, ?)',
      [orderId, staffId, event, from, to]
    );

  try {
    await conn.beginTransaction();

    // Khóa dòng đơn hàng: 2 nhân viên bấm cùng lúc thì lần lượt từng người, không đè nhau
    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    const order = rows[0];

    if (!order) {
      throw new AdminError('Không tìm thấy đơn hàng.', 404);
    }

    if (wantsPaid) {
      if (order.status === 'cancelled') {
        throw new AdminError('Đơn đã hủy, không thể xác nhận thanh toán.', 409);
      }

      if (order.payment_status === 'paid') {
        throw new AdminError('Đơn này đã được xác nhận thanh toán trước đó.', 409);
      }

      await conn.query("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [orderId]);
      await logEvent('payment', 'unpaid', 'paid');
    } else {
      const to = body.status;
      const problem = checkTransition(
        {
          status: order.status,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
        },
        to
      );

      if (problem) {
        throw new AdminError(problem, 409);
      }

      if (to === 'cancelled') {
        // Hủy đơn: trả hàng về kho
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
      }

      await conn.query('UPDATE orders SET status = ? WHERE id = ?', [to, orderId]);
      await logEvent('status', order.status, to);

      // Giao thành công đơn COD = đã thu tiền mặt
      if (to === 'delivered' && order.payment_method === 'cod' && order.payment_status !== 'paid') {
        await conn.query("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [orderId]);
        await logEvent('payment', 'unpaid', 'paid');
      }
    }

    await conn.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // bỏ qua lỗi khi hoàn tác
    }

    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('admin update order error:', error);
    return NextResponse.json({ error: 'Không cập nhật được đơn hàng, vui lòng thử lại.' }, { status: 500 });
  } finally {
    conn.release();
  }
}