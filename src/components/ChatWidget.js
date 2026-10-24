'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatPrice } from '@/lib/orderUtils';

// Các trang không hiện nút chat (quản trị, đăng nhập, đặt hàng)
const HIDDEN_PREFIXES = ['/admin', '/login', '/register', '/forgot-password', '/checkout'];

const STORAGE_KEY = 'chatMessages';
const MAX_INPUT = 500;

const QUICK_QUESTIONS = [
  'Quà biếu người lớn tuổi, dưới 300 nghìn',
  'Cà phê nào đậm vị, ít chua?',
  'Món nào hợp làm quà từ Đà Lạt?',
  'Gợi ý đặc sản vùng biển Phan Thiết',
];

const WELCOME = {
  role: 'bot',
  text: 'Xin chào! Mình là trợ lý của Đặc Sản Lâm Đồng. Bạn đang tìm quà biếu, món để thưởng thức hay đặc sản của vùng nào? Cứ hỏi mình nhé.',
  products: [],
};

/* =========================
   ICONS
========================= */

function ChatIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-5.5L8 19.5V16H7a2.5 2.5 0 0 1-2.5-2.5v-7Z" />
      <path d="M8.5 9.5h7M8.5 12h4" />
    </svg>
  );
}

function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function SendIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M5 12 20 5l-4.5 14-3.5-5.5L5 12Z" />
      <path d="m12 13.5 3.5-4" />
    </svg>
  );
}

function LeafIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

/* =========================
   THẺ SẢN PHẨM TRONG KHUNG CHAT
========================= */

function ProductCard({ product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex items-center gap-3 rounded-xl border border-[#e4dfd2] bg-white p-2.5 transition hover:border-[#344723] hover:shadow-sm"
    >
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#eee8da]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8c8d7d]">
            <LeafIcon />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[#344723] group-hover:text-[#8c7040]">
          {product.name}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-[#858878]">{product.region}</div>
        <div className="mt-0.5 text-[12px] font-semibold text-[#9b7130]">Giá từ {formatPrice(product.minPrice)}</div>
      </div>
    </Link>
  );
}

/* =========================
   WIDGET
========================= */

export default function ChatWidget() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadedRef = useRef(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  /* Giữ cuộc trò chuyện khi chuyển trang (chỉ trong phiên duyệt web hiện tại) */
  function persist(next) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-30)));
    } catch {
      // trình duyệt chặn lưu trữ thì bỏ qua
    }
  }

  function toggleOpen() {
    if (!open && !loadedRef.current) {
      loadedRef.current = true;
      try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
        if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
      } catch {
        // dữ liệu lưu bị hỏng thì dùng lời chào mặc định
      }
    }
    setOpen((v) => !v);
  }

  /* Cuộn xuống tin mới nhất */
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  /* Mở khung thì đưa con trỏ vào ô nhập; nhấn Esc để đóng */
  useEffect(() => {
    if (!open) return;

    const t = setTimeout(() => inputRef.current?.focus(), 150);

    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function send(text) {
    const question = text.trim().slice(0, MAX_INPUT);
    if (!question || loading) return;

    const withQuestion = [...messages, { role: 'user', text: question }];
    setMessages(withQuestion);
    persist(withQuestion);
    setInput('');
    setError('');
    setLoading(true);

    try {
      // Chỉ gửi nội dung chữ, không gửi thẻ sản phẩm
      const history = withQuestion
        .filter((m) => m !== WELCOME)
        .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Trợ lý chưa trả lời được, bạn thử lại nhé.');
      }

      const next = [...withQuestion, { role: 'bot', text: data.reply, products: data.products || [] }];
      setMessages(next);
      persist(next);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra, bạn thử lại nhé.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  function resetChat() {
    setMessages([WELCOME]);
    setError('');
    persist([WELCOME]);
  }

  if (hidden) return null;

  const onlyWelcome = messages.length === 1;

  return (
    <>
      {/* Nút mở chat */}
      {!open && (
        <button
          type="button"
          onClick={toggleOpen}
          aria-label="Mở trợ lý tư vấn đặc sản"
          className="fixed bottom-5 right-5 z-[60] flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-[#2f6a22] to-[#1d3d14] pl-4 pr-5 text-sm font-semibold text-white shadow-[0_14px_34px_-10px_rgba(29,61,20,0.8)] ring-1 ring-[#e6bd63]/50 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-10px_rgba(29,61,20,0.9)]"
        >
          <ChatIcon className="h-6 w-6 text-[#f0cf7a]" />
          <span className="hidden sm:inline">Tư vấn đặc sản</span>
        </button>
      )}

      {/* Khung chat */}
      {open && (
        <section
          role="dialog"
          aria-label="Trợ lý tư vấn đặc sản"
          className="fade-up fixed inset-x-3 bottom-3 z-[60] flex h-[min(620px,calc(100dvh-5rem))] flex-col overflow-hidden rounded-2xl border border-[#e1daca] bg-[#fbf8ef] shadow-[0_28px_70px_-18px_rgba(28,36,18,0.55)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[400px]"
          style={{ animationDuration: '0.35s' }}
        >
          {/* Đầu khung */}
          <header className="flex items-center justify-between bg-gradient-to-br from-[#2f6a22] to-[#1d3d14] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8c97a]/60 bg-white/10 text-[#f3e3b3]">
                <LeafIcon className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="font-serif text-[16px] font-semibold">Trợ lý Đặc Sản</div>
                <div className="mt-0.5 text-[11px] text-white/70">Tư vấn bằng AI</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!onlyWelcome && (
                <button
                  type="button"
                  onClick={resetChat}
                  className="rounded-full px-3 py-1.5 text-[12px] text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  Làm mới
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng khung chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
          </header>

          {/* Danh sách tin nhắn */}
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={message.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[92%]'}>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-6 ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-[#344723] text-white'
                        : 'rounded-bl-md border border-[#e4dfd2] bg-white text-[#292c18]'
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.products?.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {message.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Câu hỏi gợi ý (chỉ hiện khi mới mở) */}
            {onlyWelcome && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => send(question)}
                    className="rounded-full border border-[#d9d1bf] bg-white px-3.5 py-2 text-left text-[12.5px] text-[#4d513e] transition hover:border-[#344723] hover:text-[#344723]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Đang trả lời */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#e4dfd2] bg-white px-4 py-3.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-2 w-2 animate-bounce rounded-full bg-[#b08b43]"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                  <span className="sr-only">Trợ lý đang trả lời</span>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-[#e6cfc4] bg-[#faf0ea] px-4 py-3 text-[13px] leading-5 text-[#a04a2e]">
                {error}
              </div>
            )}
          </div>

          {/* Ô nhập */}
          <form onSubmit={handleSubmit} className="border-t border-[#e4dfd2] bg-white px-3 pb-2 pt-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_INPUT}
                placeholder="Nhập câu hỏi của bạn…"
                aria-label="Câu hỏi cho trợ lý"
                className="h-11 flex-1 rounded-full border border-[#d9d1bf] bg-[#fbf8ef] px-4 text-sm text-[#292c18] outline-none transition placeholder:text-[#a3a58f] focus:border-[#344723] focus:ring-2 focus:ring-[#344723]/15"
              />
              <button
                type="submit"
                disabled={loading || input.trim() === ''}
                aria-label="Gửi"
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#344723] text-white transition hover:bg-[#263719] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <SendIcon />
              </button>
            </div>
            <p className="mt-2 px-1 text-center text-[11px] leading-4 text-[#9a9a88]">
              Trợ lý AI có thể nhầm lẫn. Giá và tồn kho xem ở trang sản phẩm.
            </p>
          </form>
        </section>
      )}
    </>
  );
}
