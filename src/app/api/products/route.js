import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
async function handleGET() {
  try {
    const [products] = await pool.query(`
      SELECT p.id, p.name, p.description, p.region, p.image_note, p.image_url, c.name AS category
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `);

    const [variants] = await pool.query('SELECT * FROM product_variants');

    const result = products.map(p => ({
      ...p,
      variants: variants.filter(v => v.product_id === p.id),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('products error:', error);
    return NextResponse.json({ error: 'Máy chủ đang gặp sự cố, vui lòng thử lại sau.' }, { status: 500 });
  }
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
