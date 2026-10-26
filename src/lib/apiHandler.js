import { NextResponse } from 'next/server';

// Lỗi "có chủ đích": thông báo được phép hiện cho người dùng đọc.
// Ví dụ: throw new HttpError('Sản phẩm không tồn tại.', 404)
export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Đọc JSON từ request một cách an toàn.
// JSON hỏng, rỗng, hoặc không phải object ({...}) đều trả lỗi 400 thay vì làm sập API.
export async function readJson(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    throw new HttpError('Dữ liệu gửi lên không hợp lệ.', 400);
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError('Dữ liệu gửi lên không hợp lệ.', 400);
  }

  return body;
}

// Số nguyên dương hợp lệ (dùng cho mã sản phẩm, mã quy cách...). Sai thì trả null.
export function toPositiveInt(value, max = 2147483647) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return Number.isInteger(n) && n >= 1 && n <= max ? n : null;
}

// Mã lỗi của MariaDB/MySQL cho trường hợp dữ liệu vượt giới hạn hoặc vi phạm ràng buộc CHECK
const DATA_ERROR_CODES = new Set([
  'ER_DATA_OUT_OF_RANGE',
  'ER_WARN_DATA_OUT_OF_RANGE',
  'ER_CONSTRAINT_FAILED',
  'ER_CHECK_CONSTRAINT_VIOLATED',
  'ER_TRUNCATED_WRONG_VALUE',
  'ER_DATA_TOO_LONG',
]);

// Bọc một handler (GET, POST...) để MỌI lỗi không lường trước đều trả về JSON thân thiện:
//  - Lỗi có chủ đích (HttpError)      -> trả đúng thông báo và mã trạng thái.
//  - Dữ liệu vượt giới hạn / vi phạm CHECK -> 400.
//  - Lỗi khác (mất kết nối database...) -> 500 với câu chung chung, chi tiết chỉ ghi ở log máy chủ.
// Nhờ vậy giao diện không bao giờ nhận thân phản hồi rỗng hay chuỗi lỗi kỹ thuật.
export function withApi(handler) {
  return async function wrapped(request, context) {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }

      if (DATA_ERROR_CODES.has(error?.code)) {
        console.error(`[API] ${request?.method} ${request?.url} - dữ liệu không hợp lệ:`, error.code);
        return NextResponse.json({ error: 'Dữ liệu vượt quá giới hạn cho phép.' }, { status: 400 });
      }

      console.error(`[API] ${request?.method} ${request?.url}:`, error);
      return NextResponse.json(
        { error: 'Máy chủ đang gặp sự cố, vui lòng thử lại sau.' },
        { status: 500 }
      );
    }
  };
}
