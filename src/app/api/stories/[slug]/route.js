import { pool } from '@/lib/db';
import { deriveExcerpt } from '@/lib/storyRules';
import { readingMinutes } from '@/lib/storyFormat';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
const notFound = () => NextResponse.json({ error: 'Không tìm thấy bài viết.' }, { status: 404 });

// Chi tiết 1 câu chuyện đã đăng, kèm bài liên quan và sản phẩm cùng vùng
async function handleGET(request, { params }) {
  const { slug } = await params;

  if (!/^[a-z0-9-]{1,160}$/.test(String(slug))) return notFound();

  const [rows] = await pool.query(
    'SELECT * FROM stories WHERE slug = ? AND is_published = 1',
    [slug]
  );
  const s = rows[0];

  if (!s) return notFound();

  // Bài khác: ưu tiên cùng vùng, sau đó mới nhất
  const [others] = await pool.query(
    `SELECT id, slug, title, excerpt, content, region, cover_url, created_at
     FROM stories
     WHERE is_published = 1 AND id <> ?
     ORDER BY (region <=> ?) DESC, created_at DESC, id DESC
     LIMIT 3`,
    [s.id, s.region]
  );

  // Sản phẩm đang bán thuộc đúng vùng của câu chuyện
  const [products] = s.region
    ? await pool.query(
        `SELECT p.id, p.name, p.image_url, p.region, MIN(pv.price) AS min_price
         FROM products p
         JOIN product_variants pv ON pv.product_id = p.id
         WHERE p.is_active = 1 AND p.region = ?
         GROUP BY p.id
         ORDER BY p.id
         LIMIT 4`,
        [s.region]
      )
    : [[]];

  return NextResponse.json({
    story: {
      id: s.id,
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt || deriveExcerpt(s.content),
      content: s.content || '',
      region: s.region || '',
      coverUrl: s.cover_url || '',
      readingMinutes: readingMinutes(s.content),
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    },
    related: others.map((o) => ({
      id: o.id,
      slug: o.slug,
      title: o.title,
      excerpt: o.excerpt || deriveExcerpt(o.content),
      region: o.region || '',
      coverUrl: o.cover_url || '',
      readingMinutes: readingMinutes(o.content),
      createdAt: o.created_at,
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.image_url || '',
      region: p.region,
      minPrice: Number(p.min_price),
    })),
  });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
