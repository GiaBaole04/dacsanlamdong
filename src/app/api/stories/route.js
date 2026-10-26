import { pool } from '@/lib/db';
import { deriveExcerpt } from '@/lib/storyRules';
import { readingMinutes } from '@/lib/storyFormat';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
// Danh sách câu chuyện ĐÃ ĐĂNG (công khai, ai cũng xem được). Bản nháp không bao giờ lộ ra ở đây.
async function handleGET() {
  const [rows] = await pool.query(
    `SELECT id, slug, title, excerpt, content, region, cover_url, created_at
     FROM stories
     WHERE is_published = 1
     ORDER BY created_at DESC, id DESC`
  );

  return NextResponse.json({
    stories: rows.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt || deriveExcerpt(s.content),
      region: s.region || '',
      coverUrl: s.cover_url || '',
      readingMinutes: readingMinutes(s.content),
      createdAt: s.created_at,
    })),
  });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
