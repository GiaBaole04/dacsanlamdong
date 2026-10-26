import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { HttpError, readJson, toPositiveInt, withApi } from '@/lib/apiHandler';
import { NextResponse } from 'next/server';

// Số lượng tối đa của 1 quy cách trong giỏ (khớp với giới hạn khi đặt hàng)
const MAX_QUANTITY = 999;

async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new HttpError('Chưa đăng nhập.', 401);
  }

  return user;
}

// Kiểm tra mã quy cách + số lượng người dùng gửi lên. Sai thì ném lỗi 400 kèm thông báo rõ ràng.
function parseVariantAndQuantity(body) {
  const variantId = toPositiveInt(body.variantId);
  const quantity = toPositiveInt(body.quantity, MAX_QUANTITY);

  if (!variantId) {
    throw new HttpError('Mã sản phẩm không hợp lệ.', 400);
  }

  if (!quantity) {
    throw new HttpError(`Số lượng phải là số nguyên từ 1 đến ${MAX_QUANTITY}.`, 400);
  }

  return { variantId, quantity };
}

// Xem giỏ hàng của người đang đăng nhập
async function handleGET() {
  const user = await requireUser();

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

// Thêm sản phẩm vào giỏ (nếu đã có quy cách này trong giỏ thì cộng dồn số lượng, tối đa 999)
async function handlePOST(request) {
  const user = await requireUser();
  const { variantId, quantity } = parseVariantAndQuantity(await readJson(request));

  const [[variant]] = await pool.query(
    `SELECT pv.stock
     FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     WHERE pv.id = ? AND p.is_active = 1`,
    [variantId]
  );

  if (!variant) {
    throw new HttpError('Sản phẩm không tồn tại hoặc đã ngừng bán.', 404);
  }

  if (variant.stock < 1) {
    throw new HttpError('Sản phẩm này đã hết hàng.', 409);
  }

  await pool.query(
    `INSERT INTO cart_items (user_id, variant_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ${MAX_QUANTITY})`,
    [user.sub, variantId, quantity]
  );

  return NextResponse.json({ ok: true });
}

// Đổi số lượng chính xác của 1 quy cách trong giỏ (dùng khi bấm nút +/- ở trang giỏ hàng)
async function handlePUT(request) {
  const user = await requireUser();
  const { variantId, quantity } = parseVariantAndQuantity(await readJson(request));

  const [result] = await pool.query(
    'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND variant_id = ?',
    [quantity, user.sub, variantId]
  );

  if (result.affectedRows === 0) {
    // Có thể số lượng gửi lên đúng bằng số lượng đang có (không đổi) nên kiểm tra thêm
    const [[exists]] = await pool.query(
      'SELECT 1 AS ok FROM cart_items WHERE user_id = ? AND variant_id = ?',
      [user.sub, variantId]
    );

    if (!exists) {
      throw new HttpError('Sản phẩm này không có trong giỏ hàng.', 404);
    }
  }

  return NextResponse.json({ ok: true });
}

// Xoá 1 sản phẩm khỏi giỏ
async function handleDELETE(request) {
  const user = await requireUser();
  const body = await readJson(request);
  const variantId = toPositiveInt(body.variantId);

  if (!variantId) {
    throw new HttpError('Mã sản phẩm không hợp lệ.', 400);
  }

  await pool.query('DELETE FROM cart_items WHERE user_id = ? AND variant_id = ?', [
    user.sub,
    variantId,
  ]);

  return NextResponse.json({ ok: true });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
export const POST = withApi(handlePOST);
export const PUT = withApi(handlePUT);
export const DELETE = withApi(handleDELETE);
