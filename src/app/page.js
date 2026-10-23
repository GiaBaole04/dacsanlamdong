'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import StoryCard from '@/components/StoryCard';
import { LandscapeScene, RidgeDivider } from '@/components/Landscape';

/* =========================================================
   DỮ LIỆU TĨNH CHO PHẦN GIAO DIỆN
   Sản phẩm và câu chuyện lấy từ database qua API.
========================================================= */

// Ba tỉnh cũ đã hợp nhất thành tỉnh Lâm Đồng từ 01/07/2025
const PROVINCES = [
  {
    id: 'lam-dong',
    order: '01',
    badge: 'Tỉnh Lâm Đồng (cũ)',
    title: 'Cao nguyên mát lạnh',
    theme: 'highland',
    text: 'Sương sớm, rừng thông và khí hậu mát quanh năm nuôi lớn cà phê Arabica, trà, dâu tây, atiso cùng những món mứt và trái cây sấy.',
    places: ['Đà Lạt', 'Cầu Đất', 'Bảo Lộc'],
  },
  {
    id: 'dak-nong',
    order: '02',
    badge: 'Tỉnh Đắk Nông (cũ)',
    title: 'Rừng đất đỏ bazan',
    theme: 'forest',
    text: 'Những triền đất đỏ bazan màu mỡ cho cà phê Robusta đậm đà, hạt tiêu đen cay thơm và hạt mắc ca béo bùi.',
    places: ['Gia Nghĩa', 'Đắk Song'],
  },
  {
    id: 'binh-thuan',
    order: '03',
    badge: 'Tỉnh Bình Thuận (cũ)',
    title: 'Biển nắng gió',
    theme: 'sea',
    text: 'Vùng ven biển nhiều nắng, nhiều gió cho thanh long ruột đỏ ngọt thanh và nước mắm truyền thống ủ chượp qua nhiều tháng.',
    places: ['Phan Thiết', 'Hàm Thuận Nam'],
  },
];

// Dùng để gắn nhãn "tỉnh cũ" lên từng sản phẩm dựa vào địa danh trong cột region
const PROVINCE_RULES = [
  {
    label: 'Đắk Nông (cũ)',
    color: '#c2703d',
    places: ['gia nghĩa', 'đắk song', 'đắk mil', 'đắk r', 'cư jút', 'krông nô', 'tuy đức'],
  },
  {
    label: 'Bình Thuận (cũ)',
    color: '#2f87a3',
    places: ['phan thiết', 'hàm thuận', 'mũi né', 'hàm tân', 'la gi', 'tuy phong', 'bắc bình', 'phú quý', 'đức linh', 'tánh linh'],
  },
  {
    label: 'Lâm Đồng (cũ)',
    color: '#5f8a43',
    places: ['đà lạt', 'cầu đất', 'bảo lộc', 'lạc dương', 'đơn dương', 'đức trọng', 'di linh', 'lâm hà', 'bảo lâm', 'đạ huoai'],
  },
];

function provinceOf(region) {
  const text = (region || '').toLowerCase();
  return PROVINCE_RULES.find((rule) => rule.places.some((place) => text.includes(place))) || null;
}

const CATEGORIES = [
  { name: 'Cà phê', note: 'Arabica · Robusta', icon: 'coffee' },
  { name: 'Trà', note: 'Trà Bảo Lộc, Atiso', icon: 'tea' },
  { name: 'Trái cây tươi', note: 'Theo mùa', icon: 'fruit' },
  { name: 'Mứt / Trái cây sấy', note: 'Dâu, hồng, chuối', icon: 'jar' },
  { name: 'Hạt', note: 'Mắc ca, hạt điều', icon: 'nut' },
  { name: 'Đặc sản khác', note: 'Nước mắm, tiêu', icon: 'sprout' },
];

const PERKS = [
  { icon: 'pin', title: 'Chọn lọc tại địa phương', text: 'Sản vật đặc trưng của từng vùng' },
  { icon: 'check', title: 'Nguồn gốc rõ ràng', text: 'Thông tin vùng sản xuất minh bạch' },
  { icon: 'box', title: 'Đóng gói cẩn thận', text: 'Giữ trọn hương vị khi đến tay bạn' },
  { icon: 'truck', title: 'Giao hàng tận nơi', text: 'Trên toàn quốc' },
];

/* =========================================================
   ICON SVG
========================================================= */

function Icon({ name, className = 'h-6 w-6' }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  };

  switch (name) {
    case 'coffee':
      return (
        <svg {...common}>
          <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" />
          <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M8 3.5c0 1.2 1 1.3 1 2.5M12 3.5c0 1.2 1 1.3 1 2.5" />
        </svg>
      );
    case 'tea':
      return (
        <svg {...common}>
          <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
          <path d="M5 20c2.5-4.5 6-7.5 11-10" />
        </svg>
      );
    case 'fruit':
      return (
        <svg {...common}>
          <path d="M12 8.5c-2-1.6-6-1.2-6.8 3.2-.8 4.4 2.4 8.3 5.2 8.3.6 0 1-.3 1.6-.3s1 .3 1.6.3c2.8 0 6-3.9 5.2-8.3C18 7.3 14 6.9 12 8.5Z" />
          <path d="M12 8.5c0-2 .8-3.7 2.5-4.5" />
        </svg>
      );
    case 'jar':
      return (
        <svg {...common}>
          <path d="M7 6.5h10M8 6.5V5h8v1.5" />
          <path d="M7 6.5c-1 1.2-1.5 2.4-1.5 4v6.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-6.5c0-1.6-.5-2.8-1.5-4" />
          <path d="M6 12h12" />
        </svg>
      );
    case 'nut':
      return (
        <svg {...common}>
          <path d="M12 3.5c3.5 2 5.5 5 5.5 8.8 0 4.3-2.7 7.2-5.5 8.2-2.8-1-5.5-3.9-5.5-8.2 0-3.8 2-6.8 5.5-8.8Z" />
          <path d="M12 3.5v17M8.6 8.5c1.2.7 2.3 1.9 3.4 3.5 1.1-1.6 2.2-2.8 3.4-3.5" />
        </svg>
      );
    case 'sprout':
      return (
        <svg {...common}>
          <path d="M12 20v-8" />
          <path d="M12 12c0-3.5-2.5-5.5-6.5-5.5 0 3.5 2.5 5.5 6.5 5.5Z" />
          <path d="M12 14c0-3 2.2-5 6-5 0 3-2.2 5-6 5Z" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11Z" />
          <circle cx="12" cy="10" r="2.3" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M12 3.5 19.5 6v5.5c0 4.5-3 7.8-7.5 9-4.5-1.2-7.5-4.5-7.5-9V6L12 3.5Z" />
          <path d="m8.8 12 2.3 2.3 4.2-4.6" />
        </svg>
      );
    case 'box':
      return (
        <svg {...common}>
          <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
          <path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9" />
        </svg>
      );
    case 'truck':
      return (
        <svg {...common}>
          <path d="M3 6.5h11v9.5H3zM14 10h4l3 3v3h-7" />
          <circle cx="7.5" cy="17.5" r="1.8" />
          <circle cx="17.5" cy="17.5" r="1.8" />
        </svg>
      );
    default:
      return null;
  }
}

function ArrowRight({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
      <path d="M5 8.5h14l-.8 11H5.8L5 8.5Z" />
      <path d="M8.5 9V6.8a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

function LeafIcon({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className={className} aria-hidden="true">
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function Bird({ top, delay, scale = 1 }) {
  return (
    <svg
      className="bird"
      style={{ top, animationDelay: delay, transform: `scale(${scale})` }}
      width="26"
      height="12"
      viewBox="0 0 26 12"
      fill="none"
      stroke="#fff7dd"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M1 8c3-6 7-6 12 0 5-6 9-6 12 0" />
    </svg>
  );
}

/* =========================================================
   TIÊU ĐỀ MỤC DÙNG CHUNG
========================================================= */

function SectionHeading({ eyebrow, title, text, light = false, center = false }) {
  return (
    <div className={center ? 'mx-auto max-w-[720px] text-center' : 'max-w-[720px]'}>
      <div className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        <span className={`h-px w-9 ${light ? 'bg-[#dfb65c]' : 'bg-[#b08b43]'}`} />
        <span
          className={`text-[12px] font-semibold uppercase tracking-[0.24em] ${
            light ? 'text-[#e8c97a]' : 'text-[#8c7040]'
          }`}
        >
          {eyebrow}
        </span>
        {center && <span className={`h-px w-9 ${light ? 'bg-[#dfb65c]' : 'bg-[#b08b43]'}`} />}
      </div>
      <h2
        className={`mt-5 font-serif text-[34px] font-semibold leading-[1.18] md:text-[44px] ${
          light ? 'text-white' : 'text-[#2f4220]'
        }`}
      >
        {title}
      </h2>
      {text && (
        <p className={`mt-5 text-[16px] leading-8 ${light ? 'text-white/75' : 'text-[#676a5b]'}`}>{text}</p>
      )}
    </div>
  );
}

/* =========================================================
   BA TỈNH - MỘT LÂM ĐỒNG (các tấm tranh mở rộng khi rê chuột)
========================================================= */

function ProvincePanels() {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-14 flex flex-col gap-4 lg:h-[600px] lg:flex-row">
      {PROVINCES.map((province, index) => {
        const isActive = active === index;

        return (
          <article
            key={province.id}
            tabIndex={0}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            className={`group relative min-h-[430px] cursor-pointer overflow-hidden rounded-2xl bg-[#10303a] outline-none transition-[flex-grow] duration-700 ease-out focus-visible:ring-2 focus-visible:ring-[#dfb65c] lg:min-h-0 ${
              isActive ? 'lg:flex-[2.5]' : 'lg:flex-1'
            }`}
          >
            <LandscapeScene
              theme={province.theme}
              className={`transition-transform duration-[1600ms] ease-out ${isActive ? 'scale-110' : 'scale-100'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06150f]/90 via-[#06150f]/25 to-[#06150f]/35" />

            <div className="absolute left-7 top-7 flex items-center gap-3 text-white">
              <span className="font-serif text-[34px] font-semibold leading-none text-[#e8c97a]">{province.order}</span>
              <span className="h-px w-8 bg-white/40" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85">
                {province.badge}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-7 text-white lg:p-9">
              <h3 className="font-serif text-[28px] font-semibold leading-tight lg:text-[32px]">{province.title}</h3>

              <div
                className={`overflow-hidden transition-all duration-700 ease-out ${
                  isActive ? 'lg:max-h-[300px] lg:opacity-100' : 'lg:max-h-0 lg:opacity-0'
                }`}
              >
                <p className="mt-4 max-w-[480px] text-[15px] leading-7 text-white/85">{province.text}</p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {province.places.map((place) => (
                    <Link
                      key={place}
                      href={`/products?q=${encodeURIComponent(place)}`}
                      className="rounded-full border border-white/35 bg-white/10 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm transition hover:border-[#dfb65c] hover:bg-[#dfb65c] hover:text-[#1d2c13]"
                    >
                      {place}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* =========================================================
   TRANG CHỦ
========================================================= */

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);

  const heroRef = useRef(null);

  /* Tải sản phẩm */
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error('Không thể tải sản phẩm');
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  /* Tải câu chuyện mới nhất (nếu lỗi thì ẩn mục này, không ảnh hưởng trang) */
  useEffect(() => {
    async function loadStories() {
      try {
        const response = await fetch('/api/stories');
        if (!response.ok) return;

        const data = await response.json();
        if (Array.isArray(data.stories)) {
          setStories(data.stories.slice(0, 3));
        }
      } catch (error) {
        console.error('Lỗi tải câu chuyện:', error);
      }
    }

    loadStories();
  }, []);

  /* Hiệu ứng thị sai (parallax): tranh nền hero cuộn chậm hơn nội dung */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        el.style.setProperty('--scroll', String(y));
      });
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

  function formatPrice(price) {
    if (!price) return 'Liên hệ';
    return `${Number(price).toLocaleString('vi-VN')}đ`;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f5ec] text-[#292c18]">
      <Header variant="hero" />

      {/* =====================================================
          HERO
      ===================================================== */}
      <section ref={heroRef} className="relative isolate overflow-hidden bg-[#0c2b25]">
        {/* Tranh cao nguyên, cuộn chậm hơn nội dung */}
        <div
          className="absolute inset-0 -z-10"
          style={{ transform: 'translate3d(0, calc(var(--scroll, 0) * 0.28px), 0)' }}
        >
          <div className="kenburns absolute inset-0">
            <LandscapeScene theme="highland" />
          </div>
        </div>

        {/* Vầng sáng mặt trời, sương và chim */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="sun-pulse absolute right-[12%] top-[22%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.55),rgba(255,236,170,0)_68%)]" />
          <div className="mist-drift absolute -left-[20%] bottom-[24%] h-40 w-[140%] bg-gradient-to-r from-transparent via-[#eef3dd]/35 to-transparent blur-2xl" />
          <div className="mist-drift-slow absolute -left-[20%] bottom-[10%] h-44 w-[140%] bg-gradient-to-r from-transparent via-[#eef3dd]/30 to-transparent blur-3xl" />
          <Bird top="20%" delay="2s" />
          <Bird top="27%" delay="9s" scale={0.75} />
          <Bird top="16%" delay="17s" scale={0.6} />
        </div>

        {/* Lớp tối nhẹ để chữ luôn rõ */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07201a]/80 via-[#07201a]/35 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#07201a]/55 via-transparent to-[#07201a]/30" />

        <div className="relative mx-auto flex min-h-[760px] max-w-[1400px] flex-col px-7 lg:min-h-[860px] lg:px-10">
          <div className="flex flex-1 items-center pb-12 pt-36">
            <div className="max-w-[760px] text-white">
              <div
                className="fade-up inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[12px] font-medium text-white/90 backdrop-blur-md"
                style={{ animationDelay: '0.1s' }}
              >
                <span className="h-2 w-2 rounded-full bg-[#e8c97a]" />
                Từ 01/07/2025 · Ba tỉnh hợp nhất thành tỉnh Lâm Đồng
              </div>

              <h1
                className="fade-up mt-7 font-serif text-[46px] font-semibold leading-[1.06] tracking-[-0.02em] sm:text-[60px] lg:text-[78px]"
                style={{ animationDelay: '0.25s' }}
              >
                Ba vùng đất,
                <span className="block bg-gradient-to-r from-[#f8e2a6] via-[#e8c46a] to-[#d9a640] bg-clip-text text-transparent">
                  một Lâm Đồng
                </span>
              </h1>

              <p
                className="fade-up mt-7 max-w-[620px] text-[16px] leading-8 text-white/85 sm:text-[18px]"
                style={{ animationDelay: '0.45s' }}
              >
                Cao nguyên mát lạnh, rừng đất đỏ bazan và biển nắng gió, nay cùng một tên gọi. Đặc sản của cả ba
                vùng đất được tuyển chọn và gửi đến bàn ăn nhà bạn.
              </p>

              <div className="fade-up mt-10 flex flex-wrap gap-4" style={{ animationDelay: '0.65s' }}>
                <Link
                  href="/products"
                  className="shine inline-flex items-center gap-3 rounded-full bg-[#dfb65c] px-8 py-4 text-[14px] font-semibold text-[#1d2c13] shadow-[0_14px_34px_-10px_rgba(223,182,92,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ebc975]"
                >
                  Khám phá sản phẩm
                  <ArrowRight />
                </Link>
                <a
                  href="#ba-tinh"
                  className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/5 px-8 py-4 text-[14px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  Tìm hiểu ba vùng đất
                </a>
              </div>
            </div>
          </div>

          {/* Số liệu nổi bật */}
          <div
            className="fade-up relative mb-24 grid grid-cols-2 gap-y-6 border-t border-white/20 pt-7 text-white md:mb-28 md:grid-cols-4"
            style={{ animationDelay: '0.85s' }}
          >
            <div>
              <div className="font-serif text-[34px] font-semibold text-[#f0d48a]">
                <CountUp to={products.length || 18} suffix="+" />
              </div>
              <div className="mt-1 text-[13px] text-white/70">Sản phẩm đặc sản</div>
            </div>
            <div>
              <div className="font-serif text-[34px] font-semibold text-[#f0d48a]">
                <CountUp to={3} />
              </div>
              <div className="mt-1 text-[13px] text-white/70">Tỉnh cũ hợp nhất</div>
            </div>
            <div>
              <div className="font-serif text-[34px] font-semibold text-[#f0d48a]">
                <CountUp to={6} />
              </div>
              <div className="mt-1 text-[13px] text-white/70">Vùng đặc sản tuyển chọn</div>
            </div>
            <div>
              <div className="font-serif text-[34px] font-semibold text-[#f0d48a]">
                <CountUp to={100} suffix="%" />
              </div>
              <div className="mt-1 text-[13px] text-white/70">Nguồn gốc rõ ràng</div>
            </div>
          </div>
        </div>

        <div className="scroll-hint pointer-events-none absolute bottom-[78px] left-1/2 hidden -translate-x-1/2 text-white/70 md:block" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className="absolute inset-x-0 bottom-[-1px]">
          <RidgeDivider fill="#f8f5ec" />
        </div>
      </section>

      {/* =====================================================
          BA TỈNH - MỘT LÂM ĐỒNG
      ===================================================== */}
      <section id="ba-tinh" className="scroll-mt-4 mx-auto max-w-[1400px] px-7 py-20 lg:px-10 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Ba tỉnh · Một Lâm Đồng"
            title="Ba vùng đất cũ, một tỉnh Lâm Đồng mới"
            text="Từ ngày 01/07/2025, tỉnh Lâm Đồng, Đắk Nông và Bình Thuận hợp nhất thành tỉnh Lâm Đồng mới, trung tâm hành chính đặt tại Đà Lạt. Ba vùng đất khác nhau về khí hậu và thổ nhưỡng, nay cùng góp hương vị riêng vào một mâm đặc sản."
          />
        </Reveal>

        {/* Sơ đồ hợp nhất */}
        <Reveal delay={120} className="mt-10">
          <div className="flex flex-wrap items-center gap-3 text-[14px] font-semibold">
            <span className="rounded-full border border-[#cfd9bf] bg-[#eef3e3] px-5 py-2.5 text-[#3f5a2c]">Lâm Đồng</span>
            <span className="text-[#b08b43]">+</span>
            <span className="rounded-full border border-[#e6cdb9] bg-[#f8ece2] px-5 py-2.5 text-[#9a5a2e]">Đắk Nông</span>
            <span className="text-[#b08b43]">+</span>
            <span className="rounded-full border border-[#bcd9e2] bg-[#e8f3f6] px-5 py-2.5 text-[#256d84]">Bình Thuận</span>
            <ArrowRight className="mx-1 h-5 w-5 text-[#b08b43]" />
            <span className="rounded-full bg-[#2f4220] px-6 py-2.5 text-[#f3e3b3] shadow-[0_10px_24px_-10px_rgba(47,66,32,0.7)]">
              Tỉnh Lâm Đồng
            </span>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <ProvincePanels />
        </Reveal>
      </section>

      {/* =====================================================
          DANH MỤC
      ===================================================== */}
      <section className="border-y border-[#e6dfcc] bg-[#fbf8ef] py-16 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-7 lg:px-10">
          <Reveal>
            <SectionHeading eyebrow="Danh mục" title="Chọn theo hương vị bạn thích" center />
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((category, index) => (
              <Reveal key={category.name} delay={index * 70}>
                <Link
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group flex h-full flex-col items-center rounded-2xl border border-[#e1daca] bg-white px-4 py-7 text-center transition duration-300 hover:-translate-y-1.5 hover:border-[#c9b273] hover:shadow-[0_18px_40px_-16px_rgba(52,71,35,0.35)]"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef3e3] text-[#3f5a2c] transition duration-300 group-hover:scale-110 group-hover:bg-[#2f4220] group-hover:text-[#f3e3b3]">
                    <Icon name={category.icon} className="h-7 w-7" />
                  </span>
                  <span className="mt-4 text-[15px] font-semibold text-[#2f4220]">{category.name}</span>
                  <span className="mt-1 text-[12px] text-[#8a8873]">{category.note}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SẢN PHẨM NỔI BẬT
      ===================================================== */}
      <section className="mx-auto max-w-[1400px] px-7 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal>
            <SectionHeading
              eyebrow="Chọn lọc cho bạn"
              title="Sản phẩm nổi bật"
              text="Những hương vị tiêu biểu, mang trong mình khí hậu và thổ nhưỡng riêng của từng vùng đất."
            />
          </Reveal>
          <Reveal delay={120}>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 rounded-full border border-[#385527] px-7 py-3.5 text-[13px] font-semibold text-[#315020] transition hover:bg-[#315020] hover:text-white"
            >
              Xem tất cả sản phẩm
              <ArrowRight />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-[470px] animate-pulse rounded-2xl bg-[#eee9dc]" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product, index) => {
                const firstVariant = product.variants?.[0];
                const province = provinceOf(product.region);

                return (
                  <Reveal key={product.id} delay={index * 100}>
                    <Link
                      href={`/products/${product.id}`}
                      className="group block h-full overflow-hidden rounded-2xl border border-[#e1daca] bg-white transition duration-300 hover:-translate-y-2 hover:shadow-[0_26px_55px_-18px_rgba(48,55,28,0.35)]"
                    >
                      <div className="relative h-[300px] overflow-hidden bg-[#e7eadf]">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-[900ms] group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-[#e3e8db] text-[#5f7a4a]">
                            <LeafIcon />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                        {province && (
                          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#2f4220] shadow-sm backdrop-blur">
                            <span className="h-2 w-2 rounded-full" style={{ background: province.color }} />
                            {province.label}
                          </div>
                        )}

                        <div className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-3 items-center justify-center rounded-full bg-[#dfb65c] text-[#1d2c13] opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <BagIcon />
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-1.5 text-[12px] text-[#817967]">
                          <MapPinIcon />
                          <span>{product.region || 'Lâm Đồng'}</span>
                        </div>

                        <h3 className="mt-2.5 min-h-[56px] font-serif text-[19px] font-semibold leading-7 text-[#2d301d] transition group-hover:text-[#4a6b2f]">
                          {product.name}
                        </h3>

                        <div className="mt-5 flex items-end justify-between border-t border-[#eee8d8] pt-5">
                          <div>
                            <div className="text-[12px] text-[#8c8574]">Giá từ</div>
                            <div className="text-[19px] font-semibold text-[#754522]">
                              {formatPrice(firstVariant?.price)}
                            </div>
                          </div>
                          <span className="flex items-center gap-2 text-[13px] font-semibold text-[#2e5a24] transition group-hover:gap-3">
                            Xem
                            <ArrowRight />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#ccc4b1] py-20 text-center text-[#817967]">
              Chưa có sản phẩm để hiển thị.
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          CÂU CHUYỆN ĐẶC SẢN
      ===================================================== */}
      {stories.length > 0 && (
        <section className="border-t border-[#e6dfcc] bg-[#fbf8ef] py-20 lg:py-28">
          <div className="mx-auto max-w-[1400px] px-7 lg:px-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <Reveal>
                <SectionHeading
                  eyebrow="Câu chuyện đặc sản"
                  title="Mỗi sản phẩm đều có một câu chuyện"
                  text="Đọc về những vùng đất, những mùa vụ và đôi tay làm nên hương vị bạn đang thưởng thức."
                />
              </Reveal>
              <Reveal delay={120}>
                <Link
                  href="/stories"
                  className="inline-flex items-center gap-3 rounded-full border border-[#385527] px-7 py-3.5 text-[13px] font-semibold text-[#315020] transition hover:bg-[#315020] hover:text-white"
                >
                  Xem tất cả câu chuyện
                  <ArrowRight />
                </Link>
              </Reveal>
            </div>

            <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story, index) => (
                <Reveal key={story.id} delay={index * 120}>
                  <StoryCard story={story} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          CAM KẾT
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#1f3a16] text-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((perk, index) => (
            <Reveal
              key={perk.title}
              delay={index * 90}
              className="flex items-center gap-4 border-b border-white/10 px-7 py-9 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:border-r lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[#e8c97a]">
                <Icon name={perk.icon} className="h-6 w-6" />
              </span>
              <div>
                <div className="text-[15px] font-semibold">{perk.title}</div>
                <div className="mt-1 text-[13px] text-white/65">{perk.text}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* =====================================================
          LỜI MỜI CUỐI TRANG
      ===================================================== */}
      <section className="relative isolate overflow-hidden bg-[#0c2b25]">
        <div className="absolute inset-0 -z-10">
          <LandscapeScene theme="highland" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[#06150f]/55" />

        <Reveal className="mx-auto max-w-[860px] px-7 py-24 text-center lg:py-32">
          <h2 className="font-serif text-[34px] font-semibold leading-[1.2] text-white md:text-[48px]">
            Mang hương vị ba vùng đất về bàn ăn nhà bạn
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-8 text-white/80">
            Từ ly cà phê Cầu Đất buổi sáng đến chén nước mắm Phan Thiết trong bữa cơm tối, tất cả đều đến từ một
            tỉnh Lâm Đồng.
          </p>
          <Link
            href="/products"
            className="shine mt-10 inline-flex items-center gap-3 rounded-full bg-[#dfb65c] px-9 py-4 text-[14px] font-semibold text-[#1d2c13] shadow-[0_14px_34px_-10px_rgba(223,182,92,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ebc975]"
          >
            Bắt đầu mua sắm
            <ArrowRight />
          </Link>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
