import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { validateProductInput } from '@/lib/productRules';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
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

const notFound = () => NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });

// Lấy 1 sản phẩm để sửa
async function handleGET(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const productId = parseId((await params).id);
  if (!productId) return notFound();

  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
  const p = rows[0];
  if (!p) return notFound();

  const [variants] = await pool.query(
    'SELECT id, variant_name, price, stock FROM product_variants WHERE product_id = ? ORDER BY id',
    [productId]
  );

  return NextResponse.json({
    product: {
      id: p.id,
      name: p.name,
      categoryId: p.category_id,
      description: p.description || '',
      region: p.region || '',
      imageUrl: p.image_url || '',
      isActive: Boolean(p.is_active),
      variants: variants.map((v) => ({
        id: v.id,
        name: v.variant_name,
        price: Number(v.price),
        stock: Number(v.stock),
      })),
    },
  });
}

// Cập nhật sản phẩm và đồng bộ danh sách quy cách
async function handlePUT(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const productId = parseId((await params).id);
  if (!productId) return notFound();

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  const { errors, values } = validateProductInput(body);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (rows.length === 0) throw new AdminError('Không tìm thấy sản phẩm.', 404);

    const [cat] = await conn.query('SELECT id FROM categories WHERE id = ?', [values.categoryId]);
    if (cat.length === 0) throw new AdminError('Danh mục không tồn tại.', 400);

    await conn.query(
      `UPDATE products
       SET category_id = ?, name = ?, description = ?, region = ?, image_url = ?, is_active = ?
       WHERE id = ?`,
      [
        values.categoryId,
        values.name,
        values.description || null,
        values.region || null,
        values.imageUrl || null,
        values.isActive ? 1 : 0,
        productId,
      ]
    );

    const [current] = await conn.query(
      'SELECT id, variant_name FROM product_variants WHERE product_id = ?',
      [productId]
    );
    const currentIds = new Set(current.map((v) => v.id));
    const keptIds = new Set();

    for (const v of values.variants) {
      if (v.id === null) continue;

      // Chỉ được sửa quy cách THUỘC sản phẩm này
      if (!currentIds.has(v.id)) {
        throw new AdminError('Có quy cách không thuộc sản phẩm này.', 400);
      }

      keptIds.add(v.id);
      await conn.query(
        'UPDATE product_variants SET variant_name = ?, price = ?, stock = ? WHERE id = ? AND product_id = ?',
        [v.name, v.price, v.stock, v.id, productId]
      );
    }

    // Quy cách bị bỏ khỏi form: chỉ xóa được nếu chưa từng có trong đơn hàng nào
    for (const old of current) {
      if (keptIds.has(old.id)) continue;

      const [[used]] = await conn.query(
        'SELECT COUNT(*) AS c FROM order_items WHERE variant_id = ?',
        [old.id]
      );

      if (Number(used.c) > 0) {
        throw new AdminError(
          `Quy cách "${old.variant_name}" đã có trong đơn hàng nên không thể xóa. Hãy đặt tồn kho về 0 hoặc ẩn sản phẩm.`,
          409
        );
      }

      await conn.query('DELETE FROM product_variants WHERE id = ?', [old.id]);
    }

    const toInsert = values.variants.filter((v) => v.id === null);

    if (toInsert.length > 0) {
      await conn.query('INSERT INTO product_variants (product_id, variant_name, price, stock) VALUES ?', [
        toInsert.map((v) => [productId, v.name, v.price, v.stock]),
      ]);
    }

    await conn.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // bỏ qua
    }

    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('update product error:', error);
    return NextResponse.json({ error: 'Không lưu được sản phẩm, vui lòng thử lại.' }, { status: 500 });
  } finally {
    conn.release();
  }
}

// Ẩn / hiện nhanh sản phẩm: { isActive: false }
async function handlePATCH(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const productId = parseId((await params).id);
  if (!productId) return notFound();

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  if (typeof body.isActive !== 'boolean') {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const [rows] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
  if (rows.length === 0) return notFound();

  await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [body.isActive ? 1 : 0, productId]);

  return NextResponse.json({ ok: true });
}

// Xóa hẳn sản phẩm: CHỈ ADMIN, và chỉ khi chưa từng có đơn hàng. Đã có đơn thì chỉ ẩn.
async function handleDELETE(request, { params }) {
  const guard = await requireStaff({ adminOnly: true });
  if (guard.response) return guard.response;

  const productId = parseId((await params).id);
  if (!productId) return notFound();

  const [[used]] = await pool.query(
    `SELECT COUNT(*) AS c FROM order_items oi
     JOIN product_variants pv ON pv.id = oi.variant_id
     WHERE pv.product_id = ?`,
    [productId]
  );

  if (Number(used.c) > 0) {
    return NextResponse.json(
      { error: 'Sản phẩm đã có đơn hàng nên không thể xóa. Hãy chuyển sang trạng thái ẩn.' },
      { status: 409 }
    );
  }

  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [productId]);

  if (result.affectedRows === 0) return notFound();

  return NextResponse.json({ ok: true });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
export const PUT = withApi(handlePUT);
export const PATCH = withApi(handlePATCH);
export const DELETE = withApi(handleDELETE);
