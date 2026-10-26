import { requireStaff } from '@/lib/adminAuth';
import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

import { withApi } from '@/lib/apiHandler';
export const runtime = 'nodejs';

const MAX_SIZE = 3 * 1024 * 1024; // 3MB

// Nhận diện loại ảnh bằng "chữ ký" đầu file, không tin vào đuôi tên file hay Content-Type
function detectImageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (
    bytes.length > 11 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

function slugify(name) {
  const base = String(name || '').replace(/\.[^.]+$/, '');
  const slug = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'anh';
}

// Tải ảnh lên thư mục public/images/products hoặc public/images/stories (dùng khi chạy local / demo)
async function handlePOST(request) {
  const guard = await requireStaff();
  if (guard.response) return guard.response;

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu tải lên không hợp lệ.' }, { status: 400 });
  }

  const file = form.get('file');

  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Chưa chọn ảnh để tải lên.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ảnh quá lớn, tối đa 3MB.' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);

  if (!type) {
    return NextResponse.json({ error: 'Chỉ nhận ảnh JPG, PNG hoặc WEBP.' }, { status: 400 });
  }

  // Thư mục lưu ảnh: sản phẩm (mặc định) hoặc câu chuyện (?folder=stories). Giá trị khác đều về "products".
  const folderParam = new URL(request.url ?? 'http://localhost/', 'http://localhost').searchParams.get('folder');
  const folder = folderParam === 'stories' ? 'stories' : 'products';

  const filename = `${slugify(file.name)}-${randomBytes(3).toString('hex')}.${type}`;
  const dir = path.join(process.cwd(), 'public', 'images', folder);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ ok: true, url: `/images/${folder}/${filename}` }, { status: 201 });
}

// Bọc từng handler để lỗi bất ngờ (mất kết nối database...) luôn trả về JSON thân thiện, không làm sập API
export const POST = withApi(handlePOST);
