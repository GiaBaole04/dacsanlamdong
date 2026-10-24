import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import {
  MAX_CARDS,
  buildCatalog,
  buildSystemPrompt,
  createRateLimiter,
  parseBudget,
  sanitizeMessages,
  validateModelOutput,
} from '@/lib/chatbot';

/**
 * POST /api/chat  { messages: [{ role: 'user' | 'assistant', text }] }
 * -> { reply, products: [{ id, name, region, category, image_url, minPrice }] }
 *
 * Khóa API chỉ nằm ở máy chủ (biến môi trường GEMINI_API_KEY), không bao giờ gửi xuống trình duyệt.
 * Chỉ gửi cho Gemini: câu hỏi của khách và danh mục sản phẩm công khai. Không gửi thông tin cá nhân.
 */

// Mô hình Google khuyến nghị cho dự án mới (nhẹ, nhanh, hợp chatbot). Đổi bằng GEMINI_MODEL trong .env.
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const REQUEST_TIMEOUT_MS = 25_000;

// Mỗi địa chỉ tối đa 12 câu hỏi / 10 phút; cả website tối đa 300 câu / ngày để không cạn lượt miễn phí
const checkLimit = createRateLimiter({
  perIpLimit: Number(process.env.CHAT_IP_LIMIT) || 12,
  windowMs: 10 * 60 * 1000,
  dailyLimit: Number(process.env.CHAT_DAILY_LIMIT) || 300,
});

// Lưu tạm danh mục 60 giây để khỏi truy vấn database ở mỗi câu hỏi
let catalogCache = { at: 0, data: null };

async function loadCatalog() {
  const now = Date.now();
  if (catalogCache.data && now - catalogCache.at < 60_000) return catalogCache.data;

  const [products] = await pool.query(`
    SELECT p.id, p.name, p.description, p.region, p.image_url, c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `);
  const [variants] = await pool.query(
    'SELECT product_id, variant_name, price, stock FROM product_variants'
  );

  const data = buildCatalog(products, variants);
  catalogCache = { at: now, data };
  return data;
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'local';
}

function fail(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('chat: thiếu GEMINI_API_KEY trong file .env');
    return fail('Trợ lý tư vấn chưa được bật. Bạn vui lòng quay lại sau nhé.', 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('Yêu cầu không hợp lệ.', 400);
  }

  const messages = sanitizeMessages(body?.messages);
  if (messages.length === 0) {
    return fail('Bạn hãy nhập câu hỏi để mình tư vấn nhé.', 400);
  }

  const limit = checkLimit(clientIp(request));
  if (!limit.ok) {
    return fail(
      limit.reason === 'daily'
        ? 'Trợ lý đang quá tải hôm nay. Bạn vui lòng thử lại vào ngày mai hoặc tự xem sản phẩm nhé.'
        : 'Bạn hỏi hơi nhanh rồi, vui lòng đợi vài phút rồi hỏi tiếp nhé.',
      429
    );
  }

  try {
    const catalog = await loadCatalog();
    if (catalog.length === 0) {
      return NextResponse.json({
        reply: 'Hiện cửa hàng chưa có sản phẩm còn hàng để tư vấn. Bạn quay lại sau nhé.',
        products: [],
      });
    }

    const lastQuestion = messages[messages.length - 1].text;
    const budget = parseBudget(lastQuestion);

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const base = (process.env.GEMINI_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');

    const payload = {
      systemInstruction: { parts: [{ text: buildSystemPrompt(catalog, budget) }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            reply: { type: 'STRING', description: 'Câu trả lời tiếng Việt cho khách.' },
            productIds: {
              type: 'ARRAY',
              description: `Mã số các sản phẩm được gợi ý trong danh mục, tối đa ${MAX_CARDS}.`,
              items: { type: 'INTEGER' },
            },
          },
          required: ['reply', 'productIds'],
        },
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(`chat: Gemini trả lỗi ${response.status}:`, detail.slice(0, 500));

      if (response.status === 429) {
        return fail('Trợ lý đang bận, bạn vui lòng thử lại sau ít phút nhé.', 429);
      }
      return fail('Trợ lý tạm thời chưa trả lời được. Bạn thử lại sau nhé.', 502);
    }

    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');

    const result = validateModelOutput(text, catalog, budget);
    if (!result) {
      console.error('chat: Gemini trả dữ liệu không đúng định dạng:', String(text).slice(0, 300));
      return fail('Trợ lý chưa hiểu rõ câu hỏi. Bạn thử diễn đạt lại giúp mình nhé.', 502);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return fail('Trợ lý trả lời quá lâu. Bạn thử lại sau nhé.', 504);
    }
    console.error('chat error:', error);
    return fail('Có lỗi xảy ra, bạn thử lại sau nhé.', 500);
  }
}
