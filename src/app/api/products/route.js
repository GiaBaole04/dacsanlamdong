import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [products] = await pool.query(`
      SELECT p.id, p.name, p.description, p.region, p.image_note, p.image_url, c.name AS category
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `);

    const [variants] = await pool.query('SELECT * FROM product_variants');

    const result = products.map(p => ({
      ...p,
      variants: variants.filter(v => v.product_id === p.id),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}