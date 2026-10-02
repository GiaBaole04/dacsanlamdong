import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calcShippingFee, validateShipping } from '@/lib/orderUtils';
import { NextResponse } from 'next/server';

// Lỗi "có chủ đích" (giỏ trống, hết hàng...) để trả về cho người dùng đọc được
class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Danh sách đơn hàng của CHÍNH người đang đăng nhập
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const [orders] = await pool.query(
    `SELECT id, status, total_amount, shipping_fee, receiver_name, payment_method, payment_status, created_at
     FROM orders
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 100`,
    [Number(user.sub)]
  );

  if (orders.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const [items] = await pool.query(
    `SELECT order_id, product_name, variant_name, quantity, image_url
     FROM order_items
     WHERE order_id IN (?)
     ORDER BY id`,
    [orders.map((o) => o.id)]
  );

  const itemsByOrder = {};
  for (const item of items) {
    (itemsByOrder[item.order_id] ||= []).push({
      productName: item.product_name,
      variantName: item.variant_name,
      quantity: item.quantity,
      imageUrl: item.image_url,
    });
  }

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: Number(o.total_amount),
      shippingFee: Number(o.shipping_fee),
      receiverName: o.receiver_name,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      items: itemsByOrder[o.id] || [],
    })),
  });
}

// Đặt hàng. Hai chế độ:
//  - Đặt từ giỏ hàng: lấy giỏ THẬT trong database của người dùng, đặt xong thì xóa giỏ.
//  - "Mua ngay": trình duyệt gửi items = [{ variantId, quantity }], giỏ hàng được giữ nguyên.
// Cả hai chế độ đều KHÔNG tin giá do trình duyệt gửi: giá, tên, tồn kho đều đọc từ database.
// Kiểm tra kho, trừ kho, lưu đơn nằm trong 1 giao dịch: lỗi ở bước nào cũng hoàn tác toàn bộ.
export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod ?? 'cod';

  if (!['cod', 'bank'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Phương thức thanh toán không hợp lệ.' }, { status: 400 });
  }

  // Chế độ "Mua ngay": chỉ nhận mã quy cách + số lượng
  const buyNow = Array.isArray(body.items);
  let buyNowRows = [];

  if (buyNow) {
    const merged = new Map();

    for (const raw of body.items.slice(0, 20)) {
      const variantId = Number(raw?.variantId);
      const quantity = Number(raw?.quantity);

      if (
        !Number.isInteger(variantId) || variantId < 1 ||
        !Number.isInteger(quantity) || quantity < 1 || quantity > 999
      ) {
        return NextResponse.json({ error: 'Sản phẩm mua ngay không hợp lệ.' }, { status: 400 });
      }

      merged.set(variantId, (merged.get(variantId) || 0) + quantity);
    }

    if (merged.size === 0) {
      return NextResponse.json({ error: 'Chưa có sản phẩm để đặt hàng.' }, { status: 400 });
    }

    buyNowRows = [...merged.entries()].map(([variant_id, quantity]) => ({ variant_id, quantity }));
  }

  const { errors, values } = validateShipping(body);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });
  }

  const userId = Number(user.sub);
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [cartRows] = buyNow
      ? [buyNowRows]
      : await conn.query('SELECT variant_id, quantity FROM cart_items WHERE user_id = ?', [userId]);

    if (cartRows.length === 0) {
      throw new OrderError('Giỏ hàng đang trống.', 400);
    }

    const variantIds = cartRows.map((r) => r.variant_id).sort((a, b) => a - b);

    // Khóa các quy cách đang mua (theo thứ tự id tăng dần để 2 người đặt cùng lúc không khóa chéo nhau)
    const [variants] = await conn.query(
      `SELECT id, product_id, variant_name, price, stock
       FROM product_variants
       WHERE id IN (?)
       ORDER BY id
       FOR UPDATE`,
      [variantIds]
    );
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const productIds = [...new Set(variants.map((v) => v.product_id))];
    const [products] =
      productIds.length > 0
        ? await conn.query(
            'SELECT id, name, image_url, is_active FROM products WHERE id IN (?)',
            [productIds]
          )
        : [[]];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const problems = [];
    const lines = [];
    let total = 0;

    for (const row of cartRows) {
      const variant = variantMap.get(row.variant_id);
      const product = variant ? productMap.get(variant.product_id) : null;
      const quantity = Number(row.quantity);

      if (!variant || !product || !product.is_active) {
        problems.push('Có sản phẩm trong giỏ không còn được bán, vui lòng xóa khỏi giỏ hàng.');
        continue;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        problems.push('Số lượng trong giỏ hàng không hợp lệ.');
        continue;
      }

      if (quantity > variant.stock) {
        problems.push(
          variant.stock > 0
            ? `${product.name} (${variant.variant_name}) chỉ còn ${variant.stock} sản phẩm.`
            : `${product.name} (${variant.variant_name}) đã hết hàng.`
        );
        continue;
      }

      const price = Number(variant.price);
      total += price * quantity;

      lines.push({
        variantId: variant.id,
        quantity,
        price,
        productName: product.name,
        variantName: variant.variant_name,
        imageUrl: product.image_url,
      });
    }

    if (problems.length > 0) {
      throw new OrderError([...new Set(problems)].join(' '), 409);
    }

    const shippingFee = calcShippingFee(total);
    const grandTotal = total + shippingFee;

    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (user_id, receiver_name, phone, shipping_address, note,
          payment_method, payment_status, shipping_fee, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, 'pending')`,
      [
        userId,
        values.receiverName,
        values.phone,
        values.shippingAddress,
        values.note || null,
        paymentMethod,
        shippingFee,
        grandTotal,
      ]
    );
    const orderId = orderResult.insertId;

    await conn.query(
      `INSERT INTO order_items
         (order_id, variant_id, quantity, price_at_order, product_name, variant_name, image_url)
       VALUES ?`,
      [
        lines.map((l) => [
          orderId,
          l.variantId,
          l.quantity,
          l.price,
          l.productName,
          l.variantName,
          l.imageUrl,
        ]),
      ]
    );

    // Trừ kho. Điều kiện "stock >= số lượng" đảm bảo không bao giờ bị âm kho
    for (const l of lines) {
      const [result] = await conn.query(
        'UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [l.quantity, l.variantId, l.quantity]
      );

      if (result.affectedRows !== 1) {
        throw new OrderError('Một sản phẩm vừa hết hàng, vui lòng thử lại.', 409);
      }
    }

    // Đặt từ giỏ hàng thì xóa giỏ; "Mua ngay" thì giữ nguyên giỏ hàng
    if (!buyNow) {
      await conn.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    }

    await conn.commit();

    return NextResponse.json({ ok: true, orderId, totalAmount: grandTotal, shippingFee }, { status: 201 });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // bỏ qua lỗi khi hoàn tác
    }

    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error?.errno === 1213) {
      return NextResponse.json(
        { error: 'Hệ thống đang bận, vui lòng thử lại sau vài giây.' },
        { status: 409 }
      );
    }

    console.error('create order error:', error);
    return NextResponse.json(
      { error: 'Không đặt được hàng, vui lòng thử lại sau.' },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}