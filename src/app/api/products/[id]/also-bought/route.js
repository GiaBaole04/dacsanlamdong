import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GỢI Ý "KHÁCH MUA SẢN PHẨM NÀY CŨNG MUA" (luật kết hợp, association rule)
 *
 * Với sản phẩm X đang xem:
 *  - totalOrders      : số đơn hàng có chứa X (không tính đơn đã hủy)
 *  - ordersTogether(Y): số đơn hàng chứa cả X và Y
 *  - confidence(X→Y)  : ordersTogether / totalOrders = tỉ lệ khách mua X cũng mua Y
 *
 * Y nào có ordersTogether cao nhất thì được gợi ý trước.
 * Chỉ trả về mã sản phẩm và con số thống kê, không có thông tin khách hàng.
 * Chạy hoàn toàn trên MariaDB, không cần dịch vụ ngoài.
 */

const LIMIT = 4;

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: 'Mã sản phẩm không hợp lệ.' }, { status: 400 });
    }

    // Số đơn có chứa sản phẩm X
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT o.id) AS total
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN product_variants pv ON pv.id = oi.variant_id
       WHERE pv.product_id = ? AND o.status <> 'cancelled'`,
      [productId]
    );

    const totalOrders = Number(total) || 0;

    if (totalOrders === 0) {
      return NextResponse.json({ totalOrders: 0, items: [] });
    }

    // Các sản phẩm Y hay nằm chung đơn với X
    const [rows] = await pool.query(
      `SELECT pv2.product_id AS productId, COUNT(DISTINCT o.id) AS ordersTogether
       FROM orders o
       JOIN order_items oi1 ON oi1.order_id = o.id
       JOIN product_variants pv1 ON pv1.id = oi1.variant_id
       JOIN order_items oi2 ON oi2.order_id = o.id
       JOIN product_variants pv2 ON pv2.id = oi2.variant_id
       JOIN products p ON p.id = pv2.product_id
       WHERE pv1.product_id = ?
         AND pv2.product_id <> ?
         AND o.status <> 'cancelled'
         AND p.is_active = 1
       GROUP BY pv2.product_id
       ORDER BY ordersTogether DESC, pv2.product_id ASC
       LIMIT ?`,
      [productId, productId, LIMIT]
    );

    const items = rows.map((row) => ({
      productId: Number(row.productId),
      ordersTogether: Number(row.ordersTogether),
      confidence: Number(row.ordersTogether) / totalOrders,
    }));

    return NextResponse.json({ totalOrders, items });
  } catch (error) {
    console.error('also-bought error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
