'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import UserMenu from '@/components/UserMenu';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/stories', label: 'Câu chuyện đặc sản' },
  { href: '/about', label: 'Giới thiệu' },
];

// Các từ khoá gợi ý bấm nhanh trong khung tìm kiếm
const SEARCH_SUGGESTIONS = ['Cà phê', 'Trà', 'Thanh long', 'Mứt', 'Hạt', 'Nước mắm'];

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 9-6 10-15Z" />
      <path d="M4 20c3-5 7-8 13-11" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M5 8.5h14l-.8 11H5.8L5 8.5Z" />
      <path d="M8.5 9V6.8a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

/**
 * Header dùng chung cho toàn bộ trang.
 * - variant="hero"  : nền trong suốt, chữ trắng, đặt đè lên ảnh (dùng ở trang chủ)
 * - variant="solid" : nền sáng, dính trên cùng khi cuộn (mặc định, dùng cho các trang còn lại)
 * Mục menu đang đứng sẽ tự động được tô đậm theo đường dẫn hiện tại.
 * Kính lúp mở khung tìm kiếm, tìm xong chuyển sang /products?q=từ-khoá.
 */
export default function Header({ variant = 'solid' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const headerRef = useRef(null);
  const inputRef = useRef(null);

  const isHero = variant === 'hero';

  /* Mở khung tìm kiếm thì đưa con trỏ vào ô nhập luôn */
  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  /* Đóng khung tìm kiếm khi bấm ra ngoài header hoặc nhấn Esc */
  useEffect(() => {
    if (!searchOpen) return;

    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }

    function handleKey(e) {
      if (e.key === 'Escape') setSearchOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [searchOpen]);

  function goSearch(keyword) {
    const q = keyword.trim();
    setSearchOpen(false);
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    goSearch(query);
  }

  const wrapperClass = isHero
    ? 'absolute left-0 right-0 top-0 z-50 text-white'
    : 'sticky top-0 z-50 text-[#292c18]';

  const barClass = isHero
    ? 'border-b border-white/10 bg-black/10 backdrop-blur-[3px]'
    : 'border-b border-[#e1ddcf] bg-[#f8f5ec]/95 backdrop-blur-md';

  const iconButtonClass = isHero
    ? 'text-white/90 hover:text-[#e8bd5c]'
    : 'text-[#53633c] hover:text-[#344723]';

  return (
    <header ref={headerRef} className={wrapperClass}>
      <div className={barClass}>
        <div className="mx-auto flex h-[82px] max-w-[1400px] items-center justify-between px-7 lg:px-10">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28551d] text-[#e6bd63] shadow-lg">
              <LeafIcon />
            </div>
            <div className="leading-none">
              <div
                className={`font-serif text-[17px] font-bold tracking-[0.12em] ${
                  isHero ? '' : 'text-[#344723]'
                }`}
              >
                ĐẶC SẢN
              </div>
              <div
                className={`mt-1 text-[11px] font-medium tracking-[0.28em] ${
                  isHero ? 'text-[#e1b85e]' : 'text-[#8c7040]'
                }`}
              >
                LÂM ĐỒNG
              </div>
            </div>
          </Link>

          {/* MENU — tự tô đậm theo trang đang đứng */}
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-3 text-sm font-medium transition ${
                    active
                      ? isHero
                        ? 'text-[#e8bd5c]'
                        : 'text-[#344723]'
                      : isHero
                        ? 'text-white/90 hover:text-[#e8bd5c]'
                        : 'text-[#626653] hover:text-[#344723]'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      className={`absolute bottom-0 left-0 h-[2px] w-full ${
                        isHero ? 'bg-[#dcb55b]' : 'bg-[#344723]'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className={`transition ${iconButtonClass}`}
              aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm kiếm'}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>

            <Link
              href="/cart"
              className={`relative transition ${iconButtonClass}`}
              aria-label="Giỏ hàng"
            >
              <ShoppingBagIcon />
              {totalCount > 0 && (
                <span
                  className={`absolute -right-2 -top-3 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isHero ? 'bg-[#d9ad50] text-[#263019]' : 'bg-[#344723] text-white'
                  }`}
                >
                  {totalCount}
                </span>
              )}
            </Link>

            <UserMenu variant={isHero ? 'hero' : 'text'} />
          </div>
        </div>
      </div>

      {/* KHUNG TÌM KIẾM */}
      {searchOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-[#e1ddcf] bg-[#fbf8ef] text-[#292c18] shadow-[0_18px_40px_rgba(41,44,24,0.12)]">
          <div className="mx-auto max-w-[1400px] px-7 py-7 lg:px-10">
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="mx-auto flex max-w-[720px] items-center gap-3"
            >
              <div className="flex h-[52px] flex-1 items-center gap-3 border border-[#d9d1bf] bg-white px-4 text-[#8c8d7d] focus-within:border-[#344723]">
                <SearchIcon />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm đặc sản: cà phê, thanh long, mứt…"
                  className="h-full w-full bg-transparent text-sm text-[#292c18] outline-none placeholder:text-[#a3a58f]"
                />
              </div>

              <button
                type="submit"
                className="h-[52px] bg-[#344723] px-7 text-sm font-semibold text-white transition hover:bg-[#263719]"
              >
                Tìm kiếm
              </button>
            </form>

            <div className="mx-auto mt-5 flex max-w-[720px] flex-wrap items-center gap-2 text-[13px]">
              <span className="text-[#8c8d7d]">Gợi ý:</span>
              {SEARCH_SUGGESTIONS.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => {
                    setQuery(word);
                    goSearch(word);
                  }}
                  className="border border-[#d9d1bf] bg-white px-3.5 py-1.5 text-[#4d513e] transition hover:border-[#344723] hover:text-[#344723]"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}