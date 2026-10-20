import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { deriveExcerpt, slugify, validateStoryInput } from '@/lib/storyRules';
import { NextResponse } from 'next/server';

// Danh sách TẤT CẢ bài viết (kể cả bản nháp) cho quản trị
export async function GET() {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const [rows] = await pool.query(
    `SELECT id, slug, title, region, cover_url, is_published, created_at, updated_at
     FROM stories ORDER BY created_at DESC, id DESC`
  );

  return NextResponse.json({
    stories: rows.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      region: s.region || '',
      coverUrl: s.cover_url || '',
      isPublished: Boolean(s.is_published),
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })),
  });
}

// Tìm đường dẫn chưa ai dùng: cau-dat, cau-dat-2, cau-dat-3...
async function uniqueSlug(base) {
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? base : `${base.slice(0, 74)}-${i}`;
    const [rows] = await pool.query('SELECT id FROM stories WHERE slug = ?', [candidate]);
    if (rows.length === 0) return candidate;
  }
  return `${base.slice(0, 70)}-${Date.now().toString(36)}`;
}

// Viết bài mới (nhân viên và admin đều được)
export async function POST(request) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  const { errors, values } = validateStoryInput(body);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });
  }

  const excerpt = values.excerpt || deriveExcerpt(values.content);

  // Nếu 2 người cùng đặt tên giống nhau đúng lúc: thử lại với đường dẫn khác
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await uniqueSlug(slugify(values.title));

    try {
      const [result] = await pool.query(
        `INSERT INTO stories (slug, title, excerpt, content, region, cover_url, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          slug,
          values.title,
          excerpt || null,
          values.content || null,
          values.region || null,
          values.coverUrl || null,
          values.isPublished ? 1 : 0,
        ]
      );

      return NextResponse.json({ ok: true, id: result.insertId, slug }, { status: 201 });
    } catch (error) {
      if (error?.errno === 1062) continue;

      console.error('create story error:', error);
      return NextResponse.json({ error: 'Không lưu được bài viết, vui lòng thử lại.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Không tạo được đường dẫn cho bài viết, vui lòng thử lại.' }, { status: 409 });
}