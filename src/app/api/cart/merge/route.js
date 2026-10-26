import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { HttpError, readJson, toPositiveInt, withApi } from '@/lib/apiHandler';
import { NextResponse } from 'next/server';

const MAX_QUANTITY = 999;
const MAX_ITEMS = 50;

// Gộp giỏ hàng "khách vãng lai" (đang lưu tạm ở localStorage trên trình duyệt)
// vào giỏ hàng thật của tài khoản, gọi ngay sau khi đăng nhập thành công.
//
// Dữ liệu trong localStorage có thể cũ hoặc bị sửa tay, nên mỗi dòng đều được kiểm tra lại:
// dòng sai định dạng, sản phẩm đã bị xóa hoặc ngừng bán sẽ được BỎ QUA lặng lẽ, không làm hỏng việc đăng nhập.
async function handlePOST(request) {
  const user = await getCurrentUser();

  if (!user) {
    throw new HttpError('Chưa đăng nhập.', 401);
  }

  const { items } = await readJson(request);

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: true });
  }

  let merged = 0;

  for (const item of items.slice(0, MAX_ITEMS)) {
    const variantId = toPositiveInt(item?.variantId);
    const quantity = toPositiveInt(item?.quantity, MAX_QUANTITY);

    if (!variantId || !quantity) continue;

    // INSERT ... SELECT: chỉ thêm khi quy cách còn tồn tại và sản phẩm đang bán
    const [result] = await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity)
       SELECT ?, pv.id, ?
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ? AND p.is_active = 1
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ${MAX_QUANTITY})`,
      [user.sub, quantity, variantId]
    );

    if (result.affectedRows > 0) merged += 1;
  }

  return NextResponse.json({ ok: true, merged });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const POST = withApi(handlePOST);
