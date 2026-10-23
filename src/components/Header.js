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

/* =========================
   ICONS
========================= */

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

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
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

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Header dùng chung cho toàn bộ trang.
 * - variant="hero"  : đè lên ảnh đầu trang. Lúc đầu trong suốt, chữ trắng; cuộn xuống thì tự chuyển sang
 *                     nền kem, chữ tối và LUÔN dính trên cùng (dùng ở trang chủ, giới thiệu, câu chuyện).
 * - variant="solid" : nền kem, dính trên cùng khi cuộn (mặc định, dùng cho các trang còn lại).
 * Khi cuộn, header thu gọn lại và hiện thanh tiến độ cuộn màu vàng ở cạnh dưới.
 * Trên màn hình nhỏ, menu thu vào nút ba gạch.
 * Mục menu đang đứng sẽ tự động được tô đậm theo đường dẫn hiện tại.
 * Kính lúp mở khung tìm kiếm, tìm xong chuyển sang /products?q=từ-khoá.
 */
export default function Header({ variant = 'solid' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // Lưu đường dẫn lúc mở menu di động: sang trang khác thì menu tự đóng, không cần effect
  const [mobileOpenAt, setMobileOpenAt] = useState(null);
  const mobileOpen = mobileOpenAt === pathname;

  const headerRef = useRef(null);
  const inputRef = useRef(null);

  const isHero = variant === 'hero';
  // true = nền kem, chữ tối. false = trong suốt trên ảnh, chữ trắng
  const solid = !isHero || scrolled || searchOpen || mobileOpen;

  /* Theo dõi cuộn: đổi kiểu header và cập nhật thanh tiến độ */
  useEffect(() => {
    let frame = 0;

    function update() {
      const y = window.scrollY;
      setScrolled(y > 24);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, y / max) : 0;
      headerRef.current?.style.setProperty('--progress', String(progress));
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }

    frame = requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /* Mở khung tìm kiếm thì đưa con trỏ vào ô nhập luôn */
  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  /* Đóng khung tìm kiếm / menu di động khi bấm ra ngoài header hoặc nhấn Esc */
  const anyPanelOpen = searchOpen || mobileOpen;

  useEffect(() => {
    if (!anyPanelOpen) return;

    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setSearchOpen(false);
        setMobileOpenAt(null);
      }
    }

    function handleKey(e) {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpenAt(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [anyPanelOpen]);

  function goSearch(keyword) {
    const q = keyword.trim();
    setSearchOpen(false);
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    goSearch(query);
  }

  function toggleSearch() {
    setMobileOpenAt(null);
    setSearchOpen((v) => !v);
  }

  function toggleMobile() {
    setSearchOpen(false);
    setMobileOpenAt(mobileOpen ? null : pathname);
  }

  const wrapperClass = isHero
    ? 'fixed inset-x-0 top-0 z-50'
    : 'sticky top-0 z-50';

  const barClass = solid
    ? `border-b border-[#e1ddcf]/80 bg-[#f8f5ec]/90 text-[#292c18] backdrop-blur-xl ${
        scrolled || searchOpen || mobileOpen ? 'shadow-[0_8px_28px_-14px_rgba(41,44,24,0.35)]' : ''
      }`
    : 'border-b border-white/10 bg-gradient-to-b from-black/50 to-black/5 text-white backdrop-blur-[2px]';

  const iconButtonClass = solid
    ? 'text-[#53633c] hover:bg-[#344723]/10 hover:text-[#344723]'
    : 'text-white/90 hover:bg-white/15 hover:text-white';

  return (
    <header ref={headerRef} className={wrapperClass}>
      <div className={`relative transition-all duration-300 ${barClass}`}>
        <div
          className={`mx-auto flex max-w-[1400px] items-center justify-between px-5 transition-all duration-300 sm:px-7 lg:px-10 ${
            scrolled ? 'h-[66px]' : 'h-[82px]'
          }`}
        >
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3" aria-label="Đặc Sản Lâm Đồng, về trang chủ">
            <div
              className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#2f6a22] to-[#1d3d14] text-[#f0cf7a] shadow-lg ring-1 ring-[#e6bd63]/50 transition-all duration-300 ${
                scrolled ? 'h-10 w-10' : 'h-11 w-11'
              }`}
            >
              <LeafIcon />
            </div>
            <div className="leading-none">
              <div
                className={`font-serif text-[17px] font-bold tracking-[0.12em] transition-colors ${
                  solid ? 'text-[#344723]' : 'text-white'
                }`}
              >
                ĐẶC SẢN
              </div>
              <div
                className={`mt-1 text-[11px] font-medium tracking-[0.28em] transition-colors ${
                  solid ? 'text-[#8c7040]' : 'text-[#e8c97a]'
                }`}
              >
                LÂM ĐỒNG
              </div>
            </div>
          </Link>

          {/* MENU: tự tô đậm theo trang đang đứng */}
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Menu chính">
            {NAV_LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative px-0.5 py-3 text-[14px] font-medium tracking-[0.01em] transition-colors ${
                    active
                      ? solid
                        ? 'text-[#344723]'
                        : 'text-[#f0cf7a]'
                      : solid
                        ? 'text-[#626653] hover:text-[#344723]'
                        : 'text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-[2px] w-full origin-center rounded-full transition-transform duration-300 ${
                      solid ? 'bg-[#b08b43]' : 'bg-[#dcb55b]'
                    } ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleSearch}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition ${iconButtonClass}`}
              aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Tìm kiếm'}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>

            <Link
              href="/cart"
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${iconButtonClass}`}
              aria-label={totalCount > 0 ? `Giỏ hàng, ${totalCount} sản phẩm` : 'Giỏ hàng'}
            >
              <ShoppingBagIcon />
              {totalCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d9ad50] px-1 text-[10px] font-bold text-[#263019] shadow-sm ring-2 ring-white/70">
                  {totalCount}
                </span>
              )}
            </Link>

            <div className="ml-1 sm:ml-2">
              <UserMenu variant={solid ? 'text' : 'hero'} />
            </div>

            {/* Nút ba gạch (chỉ hiện trên màn hình nhỏ) */}
            <button
              type="button"
              onClick={toggleMobile}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition lg:hidden ${iconButtonClass}`}
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Thanh tiến độ cuộn trang */}
        <div
          className={`pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-[#dfb65c] to-[#b08b43] transition-opacity duration-300 ${
            scrolled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: 'scaleX(var(--progress, 0))' }}
          aria-hidden="true"
        />
      </div>

      {/* MENU DI ĐỘNG */}
      {mobileOpen && (
        <div
          className="fade-up absolute left-0 right-0 top-full border-b border-[#e1ddcf] bg-[#fbf8ef] text-[#292c18] shadow-[0_18px_40px_rgba(41,44,24,0.14)] lg:hidden"
          style={{ animationDuration: '0.3s' }}
        >
          <nav className="mx-auto max-w-[1400px] px-6 py-2" aria-label="Menu di động">
            {NAV_LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpenAt(null)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between border-b border-[#eee8d8] py-4 text-[16px] font-medium last:border-b-0 ${
                    active ? 'text-[#344723]' : 'text-[#4d513e]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${active ? 'bg-[#dfb65c]' : 'bg-transparent'}`}
                    />
                    {link.label}
                  </span>
                  <span className="text-[#b08b43]">
                    <ArrowRight />
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* KHUNG TÌM KIẾM */}
      {searchOpen && (
        <div
          className="fade-up absolute left-0 right-0 top-full border-b border-[#e1ddcf] bg-[#fbf8ef] text-[#292c18] shadow-[0_18px_40px_rgba(41,44,24,0.12)]"
          style={{ animationDuration: '0.3s' }}
        >
          <div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-7 lg:px-10">
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
