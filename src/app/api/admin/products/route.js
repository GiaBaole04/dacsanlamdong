import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { validateProductInput } from '@/lib/productRules';
import { NextResponse } from 'next/server';

// Danh sách TẤT CẢ sản phẩm (kể cả đang ẩn) kèm quy cách và danh mục
export async function GET() {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const [products] = await pool.query(
    `SELECT p.id, p.name, p.region, p.image_url, p.is_active, p.category_id, c.name AS category
     FROM products p JOIN categories c ON c.id = p.category_id
     ORDER BY p.id`
  );
  const [variants] = await pool.query(
    'SELECT id, product_id, variant_name, price, stock FROM product_variants ORDER BY id'
  );
  const [categories] = await pool.query('SELECT id, name FROM categories ORDER BY id');

  const byProduct = new Map();
  for (const v of variants) {
    if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, []);
    byProduct.get(v.product_id).push({
      id: v.id,
      name: v.variant_name,
      price: Number(v.price),
      stock: Number(v.stock),
    });
  }

  return NextResponse.json({
    products: products.map((p) => {
      const list = byProduct.get(p.id) || [];
      return {
        id: p.id,
        name: p.name,
        region: p.region,
        imageUrl: p.image_url,
        isActive: Boolean(p.is_active),
        categoryId: p.category_id,
        category: p.category,
        variants: list,
        minPrice: list.length ? Math.min(...list.map((v) => v.price)) : 0,
        totalStock: list.reduce((sum, v) => sum + v.stock, 0),
        lowStock: list.some((v) => v.stock <= 5),
      };
    }),
    categories,
  });
}

// Thêm sản phẩm mới (kèm các quy cách)
export async function POST(request) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

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

    const [cat] = await conn.query('SELECT id FROM categories WHERE id = ?', [values.categoryId]);

    if (cat.length === 0) {
      await conn.rollback();
      return NextResponse.json({ error: 'Danh mục không tồn tại.' }, { status: 400 });
    }

    const [result] = await conn.query(
      `INSERT INTO products (category_id, name, description, region, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        values.categoryId,
        values.name,
        values.description || null,
        values.region || null,
        values.imageUrl || null,
        values.isActive ? 1 : 0,
      ]
    );
    const productId = result.insertId;

    await conn.query('INSERT INTO product_variants (product_id, variant_name, price, stock) VALUES ?', [
      values.variants.map((v) => [productId, v.name, v.price, v.stock]),
    ]);

    await conn.commit();

    return NextResponse.json({ ok: true, id: productId }, { status: 201 });
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // bỏ qua
    }

    console.error('create product error:', error);
    return NextResponse.json({ error: 'Không thêm được sản phẩm, vui lòng thử lại.' }, { status: 500 });
  } finally {
    conn.release();
  }
}