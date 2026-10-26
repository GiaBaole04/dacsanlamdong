import { pool } from '@/lib/db';
import { requireStaff } from '@/lib/adminAuth';
import { deriveExcerpt, validateStoryInput } from '@/lib/storyRules';
import { NextResponse } from 'next/server';

import { withApi } from '@/lib/apiHandler';
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const notFound = () => NextResponse.json({ error: 'Không tìm thấy bài viết.' }, { status: 404 });

// Lấy 1 bài (kể cả bản nháp) để sửa
async function handleGET(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const id = parseId((await params).id);
  if (!id) return notFound();

  const [rows] = await pool.query('SELECT * FROM stories WHERE id = ?', [id]);
  const s = rows[0];
  if (!s) return notFound();

  return NextResponse.json({
    story: {
      id: s.id,
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt || '',
      content: s.content || '',
      region: s.region || '',
      coverUrl: s.cover_url || '',
      isPublished: Boolean(s.is_published),
    },
  });
}

// Sửa bài. Đường dẫn (slug) giữ nguyên để các liên kết đã chia sẻ không bị hỏng.
async function handlePUT(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const id = parseId((await params).id);
  if (!id) return notFound();

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

  const [rows] = await pool.query('SELECT id FROM stories WHERE id = ?', [id]);
  if (rows.length === 0) return notFound();

  await pool.query(
    `UPDATE stories
     SET title = ?, excerpt = ?, content = ?, region = ?, cover_url = ?, is_published = ?
     WHERE id = ?`,
    [
      values.title,
      values.excerpt || deriveExcerpt(values.content) || null,
      values.content || null,
      values.region || null,
      values.coverUrl || null,
      values.isPublished ? 1 : 0,
      id,
    ]
  );

  return NextResponse.json({ ok: true });
}

// Đăng / chuyển về bản nháp nhanh: { isPublished: true }
async function handlePATCH(request, { params }) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  const id = parseId((await params).id);
  if (!id) return notFound();

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }

  if (typeof body.isPublished !== 'boolean') {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 });
  }

  const [rows] = await pool.query('SELECT id, content FROM stories WHERE id = ?', [id]);
  if (rows.length === 0) return notFound();

  if (body.isPublished && String(rows[0].content || '').trim().length < 50) {
    return NextResponse.json(
      { error: 'Bài chưa có nội dung (ít nhất 50 ký tự) nên chưa thể đăng.' },
      { status: 400 }
    );
  }

  await pool.query('UPDATE stories SET is_published = ? WHERE id = ?', [body.isPublished ? 1 : 0, id]);

  return NextResponse.json({ ok: true });
}

// Xóa bài: CHỈ ADMIN
async function handleDELETE(request, { params }) {
  const guard = await requireStaff({ adminOnly: true });
  if (guard.response) return guard.response;

  const id = parseId((await params).id);
  if (!id) return notFound();

  const [result] = await pool.query('DELETE FROM stories WHERE id = ?', [id]);

  if (result.affectedRows === 0) return notFound();

  return NextResponse.json({ ok: true });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const GET = withApi(handleGET);
export const PUT = withApi(handlePUT);
export const PATCH = withApi(handlePATCH);
export const DELETE = withApi(handleDELETE);
