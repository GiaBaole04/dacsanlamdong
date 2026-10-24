'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import {
  ContourPattern,
  LandscapeScene,
  RidgeDivider,
  ThemeIcon,
} from '@/components/Landscape';
import { regionTheme } from '@/lib/storyFormat';
import { variantSummary } from '@/lib/variantLabel';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  formatPrice,
} from '@/lib/orderUtils';

/* =========================================================
   HÀM DÙNG CHUNG
========================================================= */

// Kiểu màu cho nhãn vùng: cao nguyên (xanh), rừng đất đỏ (nâu đất), biển (xanh nước)
const THEME_BADGE = {
  highland: 'bg-[#e3eedc] text-[#2f5d2a]',
  forest: 'bg-[#f5e2d2] text-[#8a4a24]',
  sea: 'bg-[#dcebf1] text-[#1f5d78]',
};

function categoryEmoji(category = '') {
  if (category.includes('Cà phê')) return '☕';
  if (category.includes('Trà')) return '🍵';
  if (category.includes('Trái')) return '🍓';
  if (category.includes('Mứt')) return '🍯';
  if (category.includes('Hạt')) return '🌰';
  return '🌿';
}

// Giá thấp nhất trong các lựa chọn khối lượng (khớp với nhãn "Giá từ")
function minPrice(product) {
  const prices = (product.variants || [])
    .map((variant) => Number(variant.price))
    .filter((value) => Number.isFinite(value) && value > 0);

  return prices.length ? Math.min(...prices) : null;
}

// Hết hàng khi có quy cách nhưng tất cả đều hết tồn kho
function isSoldOut(product) {
  const variants = product.variants || [];
  return variants.length > 0 && variants.every((v) => Number(v.stock) <= 0);
}

// "Đà Lạt, Lâm Đồng" -> "Đà Lạt"
function shortRegion(region = '') {
  return region.split(',')[0].trim() || region;
}

/* =========================================================
   ICONS
========================================================= */

const iconBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function SearchIcon() {
  return (
    <svg {...iconBase} className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg {...iconBase} className="h-5 w-5">
      <path d="M5 8.5h14l-.8 11H5.8L5 8.5Z" />
      <path d="M8.5 9V6.8a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg {...iconBase} className="h-4 w-4">
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg {...iconBase} className="h-5 w-5">
      <path d="M4 7h16" />
      <path d="M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="currentColor" />
      <circle cx="15" cy="17" r="2" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg {...iconBase} strokeWidth={1.8} className="h-5 w-5">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg {...iconBase} strokeWidth={1.5} className="h-6 w-6">
      <path d="M3 6.5h11v9H3z" />
      <path d="M14 10h4l3 3v2.5h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconBase} strokeWidth={1.5} className="h-6 w-6">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function LeafIcon({ className = 'h-6 w-6' }) {
  return (
    <svg {...iconBase} strokeWidth={1.5} className={className}>
      <path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 9-6 10-15Z" />
      <path d="M4 20c3-5 7-8 13-11" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg {...iconBase} strokeWidth={1.5} className="h-6 w-6">
      <path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

// Chim bay ngang bầu trời (dùng lớp .bird có sẵn trong globals.css)
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
      <path d="M1 8c4-1 7-4 12-1 5-3 8 0 12 1" />
    </svg>
  );
}

/* =========================================================
   THẺ SẢN PHẨM
========================================================= */

function ProductCard({ product }) {
  const price = minPrice(product);
  const variantCount = product.variants?.length || 0;
  const soldOut = isSoldOut(product);
  const theme = regionTheme(product.region);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e1dbc9] bg-white transition duration-300 hover:-translate-y-1.5 hover:border-[#d6b765] hover:shadow-[0_22px_50px_-12px_rgba(48,55,28,.28)]"
    >
      {/* ẢNH */}
      <div className="relative h-[270px] overflow-hidden bg-[#e7eadf]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-110 ${
              soldOut ? 'grayscale-[55%]' : ''
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#e3e8db] text-7xl">
            {categoryEmoji(product.category)}
          </div>
        )}

        {/* Lớp tối nhẹ ở đáy ảnh cho chữ dễ đọc + dải đồi thấp thoáng */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14260f]/55 to-transparent" />

        {/* Nhãn danh mục */}
        <div className="absolute left-4 top-4 rounded-full bg-[#f8f7ef]/95 px-3 py-1.5 text-[11px] font-semibold text-[#315020] shadow-sm backdrop-blur">
          {product.category || 'Đặc sản'}
        </div>

        {/* Nhãn vùng, màu theo kiểu phong cảnh */}
        <div
          className={`absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm ${THEME_BADGE[theme]}`}
        >
          <ThemeIcon theme={theme} className="h-3.5 w-3.5" />
          {shortRegion(product.region) || 'Lâm Đồng'}
        </div>

        {/* Nút giỏ hàng */}
        <div className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f1df] text-[#30471e] shadow-md transition duration-300 group-hover:rotate-[-8deg] group-hover:bg-[#d9ad50] group-hover:text-[#263019]">
          <ShoppingBagIcon />
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1c2412]/35">
            <span className="rounded-full bg-white/95 px-5 py-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#9a4528]">
              Tạm hết hàng
            </span>
          </div>
        )}
      </div>

      {/* NỘI DUNG */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="min-h-[52px] font-serif text-[19px] font-bold leading-6 text-[#2d301d] transition group-hover:text-[#355824]">
          {product.name}
        </h3>

        <p className="mt-3 line-clamp-2 min-h-[48px] text-[13px] leading-6 text-[#7d7664]">
          {product.description ||
            'Đặc sản được tuyển chọn từ vùng đất Lâm Đồng.'}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between border-t border-dashed border-[#e1dbc9] pt-4">
            <div>
              <span className="text-[12px] text-[#8c8574]">Giá từ</span>
              <div className="font-serif text-[22px] font-bold leading-tight text-[#8a5a24]">
                {price ? formatPrice(price) : 'Liên hệ'}
              </div>
            </div>

            {variantCount > 1 && (
              <span
                className="max-w-[58%] truncate rounded-full bg-[#f3efe0] px-3 py-1 text-[11px] font-medium text-[#6b6850]"
                title={product.variants.map((v) => v.variant_name).join(', ')}
              >
                {variantSummary(product.variants)}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-[#2e5a24]">
            Xem chi tiết
            <span className="transition duration-300 group-hover:translate-x-1.5">
              <ArrowRight />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   TRANG
========================================================= */

function ProductsContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy q từ URL để ô tìm kiếm trên Header lọc được sản phẩm
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || ''
  );

  const [selectedRegion, setSelectedRegion] = useState(
    searchParams.get('region') || ''
  );

  const [sort, setSort] = useState('default');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  /* ----- Đồng bộ bộ lọc với URL ----- */
  useEffect(() => {
    setSearch(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedRegion(searchParams.get('region') || '');
  }, [searchParams]);

  /* ----- Tải sản phẩm ----- */
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

  /* ----- Danh sách danh mục / vùng ----- */
  const categories = useMemo(() => {
    const values = products.map((product) => product.category).filter(Boolean);
    return [...new Set(values)];
  }, [products]);

  const regions = useMemo(() => {
    const values = products.map((product) => product.region).filter(Boolean);
    return [...new Set(values)];
  }, [products]);

  /* ----- Lọc + tìm kiếm + sắp xếp ----- */
  const filteredProducts = useMemo(() => {
    let result = [...products];

    const keyword = search.trim().toLowerCase();

    if (keyword) {
      result = result.filter((product) => {
        const name = product.name?.toLowerCase() || '';
        const description = product.description?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';
        const region = product.region?.toLowerCase() || '';

        return (
          name.includes(keyword) ||
          description.includes(keyword) ||
          category.includes(keyword) ||
          region.includes(keyword)
        );
      });
    }

    if (selectedCategory) {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (selectedRegion) {
      result = result.filter((product) => product.region === selectedRegion);
    }

    if (sort === 'price-low') {
      result.sort((a, b) => (minPrice(a) || 0) - (minPrice(b) || 0));
    }

    if (sort === 'price-high') {
      result.sort((a, b) => (minPrice(b) || 0) - (minPrice(a) || 0));
    }

    if (sort === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }

    return result;
  }, [products, search, selectedCategory, selectedRegion, sort]);

  function resetFilters() {
    setSearch('');
    setSelectedCategory('');
    setSelectedRegion('');
    setSort('default');
  }

  const hasFilter =
    search || selectedCategory || selectedRegion || sort !== 'default';

  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (selectedRegion ? 1 : 0);

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header />

      {/* ===================================================
          HERO: cao nguyên, sương mai, mặt trời
      =================================================== */}
      <section className="relative isolate overflow-hidden bg-[#0c2b25]">
        <div className="kenburns absolute inset-0">
          <LandscapeScene theme="highland" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f19]/85 via-[#0a1f19]/45 to-transparent" />

        <div className="sun-pulse pointer-events-none absolute right-[10%] top-[16%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,236,170,0.5),rgba(255,236,170,0)_68%)]" />
        <div className="mist-drift pointer-events-none absolute -left-[20%] bottom-[24%] h-36 w-[140%] bg-gradient-to-r from-transparent via-[#eef3dd]/30 to-transparent blur-2xl" />
        <div className="mist-drift-slow pointer-events-none absolute -left-[20%] bottom-[10%] h-40 w-[140%] bg-gradient-to-r from-transparent via-[#eef3dd]/25 to-transparent blur-3xl" />

        <Bird top="24%" delay="0s" />
        <Bird top="34%" delay="9s" scale={0.8} />

        <div className="relative mx-auto flex min-h-[460px] max-w-[1400px] flex-col justify-center px-7 pb-32 pt-20 lg:px-10">
          <div className="fade-up flex items-center gap-3">
            <span className="h-px w-10 bg-[#dfb65c]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e8c97a]">
              Tinh hoa từ cao nguyên
            </span>
          </div>

          <h1
            className="fade-up mt-6 max-w-[760px] font-serif text-[44px] font-semibold leading-[1.1] text-white md:text-[62px]"
            style={{ animationDelay: '0.12s' }}
          >
            Sản phẩm đặc sản
            <span className="block text-[#e8c97a]">Lâm Đồng</span>
          </h1>

          <p
            className="fade-up mt-6 max-w-[580px] text-[16px] leading-8 text-white/80"
            style={{ animationDelay: '0.24s' }}
          >
            Khám phá những sản vật được tuyển chọn từ các vùng đất đặc trưng
            của Lâm Đồng, từ cà phê Cầu Đất, trà Bảo Lộc đến những món quà mang
            hương vị Đà Lạt.
          </p>

          {search && (
            <div
              className="fade-up mt-7 inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[13px] text-white/85 backdrop-blur"
              style={{ animationDelay: '0.32s' }}
            >
              Kết quả tìm kiếm cho:
              <span className="ml-1.5 font-semibold text-[#e8c97a]">
                “{search}”
              </span>
            </div>
          )}

          {/* Số liệu nhanh (chỉ hiện khi đã tải xong để số chạy đúng) */}
          {!loading && products.length > 0 && (
            <div
              className="fade-up mt-10 flex flex-wrap gap-x-10 gap-y-5"
              style={{ animationDelay: '0.4s' }}
            >
              {[
                { value: products.length, label: 'Đặc sản' },
                { value: regions.length, label: 'Vùng sản xuất' },
                { value: categories.length, label: 'Danh mục' },
              ].map((stat) => (
                <div key={stat.label}>
                  <CountUp
                    to={stat.value}
                    className="font-serif text-[34px] font-semibold leading-none text-[#e8c97a]"
                  />
                  <div className="mt-1.5 text-[12px] uppercase tracking-[0.18em] text-white/65">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-[-1px]">
          <RidgeDivider fill="#fbf8ef" />
        </div>
      </section>

      {/* ===================================================
          DANH SÁCH SẢN PHẨM
      =================================================== */}
      <section className="relative overflow-x-clip bg-[#fbf8ef] pb-20 pt-6">
        <ContourPattern
          stroke="#b08b43"
          opacity={0.1}
          className="pointer-events-none absolute -right-40 top-10 w-[760px] max-w-none"
        />

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10">
          {/* THANH TÌM KIẾM + SẮP XẾP */}
          <div className="flex flex-col gap-5 border-b border-[#ded8c8] pb-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[430px]">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#817967]">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm cà phê, trà, mứt dâu..."
                className="h-12 w-full rounded-full border border-[#d8d3c4] bg-white pl-12 pr-12 text-sm text-[#292c18] outline-none transition placeholder:text-[#9a9587] focus:border-[#496a35] focus:ring-2 focus:ring-[#496a35]/15"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#e9e6da] text-[#666151] transition hover:bg-[#dcd8c9] [&_svg]:h-4 [&_svg]:w-4"
                  aria-label="Xóa tìm kiếm"
                >
                  <XIcon />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-[13px] text-[#817967] sm:block">
                Sắp xếp:
              </span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 rounded-full border border-[#d8d3c4] bg-white px-5 text-[13px] text-[#4d4c3d] outline-none focus:border-[#496a35]"
              >
                <option value="default">Mặc định</option>
                <option value="price-low">Giá thấp đến cao</option>
                <option value="price-high">Giá cao đến thấp</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>

          {/* ĐI THEO TỪNG VÙNG */}
          {regions.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-[#b08b43]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
                  Đi theo từng vùng
                </span>
              </div>

              <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedRegion('')}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-[13px] font-semibold transition ${
                    selectedRegion === ''
                      ? 'border-[#315020] bg-[#315020] text-white shadow-md'
                      : 'border-[#d8d3c4] bg-white text-[#5d5b48] hover:border-[#315020] hover:text-[#315020]'
                  }`}
                >
                  <LeafIcon className="h-4 w-4" />
                  Tất cả vùng
                </button>

                {regions.map((region) => {
                  const theme = regionTheme(region);
                  const count = products.filter((p) => p.region === region).length;
                  const active = selectedRegion === region;

                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setSelectedRegion(active ? '' : region)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-[13px] font-semibold transition ${
                        active
                          ? 'border-[#315020] bg-[#315020] text-white shadow-md'
                          : 'border-[#d8d3c4] bg-white text-[#5d5b48] hover:border-[#315020] hover:text-[#315020]'
                      }`}
                    >
                      <ThemeIcon theme={theme} className="h-4 w-4" />
                      {shortRegion(region)}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          active ? 'bg-white/20' : 'bg-[#f1ecdc] text-[#7d7664]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NÚT LỌC TRÊN ĐIỆN THOẠI */}
          <div className="mt-6 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#cfc9b9] bg-white text-sm font-semibold text-[#315020]"
            >
              <SlidersIcon />
              Lọc theo danh mục
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#315020] px-2 py-0.5 text-[11px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
            {/* THANH BÊN: DANH MỤC */}
            <aside className="hidden lg:block">
              <div className="sticky top-[105px]">
                <div className="font-serif text-[18px] font-bold text-[#292c18]">
                  Danh mục
                </div>
                <span className="mt-3 block h-px w-9 bg-[#b08b43]" />

                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('')}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[13px] transition ${
                      selectedCategory === ''
                        ? 'bg-[#315020] font-semibold text-white shadow-md'
                        : 'text-[#676353] hover:bg-[#eeebdf] hover:text-[#315020]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">🏔️</span>
                      Tất cả sản phẩm
                    </span>
                    <span>{products.length}</span>
                  </button>

                  {categories.map((category) => {
                    const count = products.filter(
                      (product) => product.category === category
                    ).length;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[13px] transition ${
                          selectedCategory === category
                            ? 'bg-[#315020] font-semibold text-white shadow-md'
                            : 'text-[#676353] hover:bg-[#eeebdf] hover:text-[#315020]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-base">{categoryEmoji(category)}</span>
                          {category}
                        </span>
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {hasFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-6 text-[13px] font-semibold text-[#8a552f] underline underline-offset-4"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}

                {/* Thẻ phong cảnh dẫn sang Câu chuyện */}
                <Link
                  href="/stories"
                  className="group relative mt-10 block overflow-hidden rounded-2xl bg-[#0c2b25]"
                >
                  <LandscapeScene theme="highland" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f19]/90 via-[#0a1f19]/40 to-transparent" />
                  <div className="relative flex min-h-[210px] flex-col justify-end p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e8c97a]">
                      Câu chuyện đặc sản
                    </div>
                    <div className="mt-2 font-serif text-[18px] font-semibold leading-snug text-white">
                      Mỗi sản vật mang theo một vùng đất
                    </div>
                    <span className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-[#e8c97a] transition group-hover:gap-3">
                      Đọc câu chuyện
                      <ArrowRight />
                    </span>
                  </div>
                </Link>
              </div>
            </aside>

            {/* KHU VỰC SẢN PHẨM */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="text-[14px] text-[#817967]">
                  {loading ? (
                    'Đang tải sản phẩm...'
                  ) : (
                    <>
                      Hiển thị{' '}
                      <span className="font-semibold text-[#292c18]">
                        {filteredProducts.length}
                      </span>{' '}
                      sản phẩm
                      {selectedRegion && (
                        <>
                          {' '}
                          từ{' '}
                          <span className="font-semibold text-[#315020]">
                            {shortRegion(selectedRegion)}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>

                {hasFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[12px] font-semibold text-[#315020] lg:hidden"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="h-[520px] animate-pulse overflow-hidden rounded-2xl border border-[#e2ddcf] bg-white"
                    >
                      <div className="h-[270px] bg-[#e9e6dc]" />

                      <div className="space-y-4 p-5">
                        <div className="h-5 w-4/5 rounded bg-[#e9e6dc]" />
                        <div className="h-12 rounded bg-[#e9e6dc]" />
                        <div className="h-5 w-32 rounded bg-[#e9e6dc]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product, index) => (
                    <Reveal key={product.id} delay={(index % 3) * 90} className="h-full">
                      <ProductCard product={product} />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#cbc5b5] bg-white px-6 py-20 text-center">
                  <div className="text-5xl">🌿</div>

                  <h3 className="mt-5 font-serif text-[24px] font-bold text-[#292c18]">
                    Chưa tìm thấy đặc sản bạn cần
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-[#817967]">
                    Không có sản phẩm nào phù hợp với điều kiện tìm kiếm hoặc bộ
                    lọc hiện tại. Thử bỏ bớt bộ lọc để xem thêm đặc sản Lâm Đồng.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-6 rounded-full bg-[#315020] px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-[#243d18]"
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          NGĂN LỌC TRÊN ĐIỆN THOẠI (chỉ danh mục, vùng đã có dải chọn phía trên)
      =================================================== */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Đóng bộ lọc"
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#fbf8ef] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[24px] font-bold text-[#292c18]">
                Danh mục
              </h2>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Đóng"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#555546]"
              >
                <XIcon />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`rounded-xl px-4 py-3 text-left text-sm ${
                  selectedCategory === ''
                    ? 'bg-[#315020] text-white'
                    : 'bg-white text-[#676353]'
                }`}
              >
                🏔️ Tất cả
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-xl px-4 py-3 text-left text-sm ${
                    selectedCategory === category
                      ? 'bg-[#315020] text-white'
                      : 'bg-white text-[#676353]'
                  }`}
                >
                  {categoryEmoji(category)} {category}
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 rounded-full border border-[#cfc9b9] bg-white py-3.5 text-sm font-semibold text-[#315020]"
              >
                Xóa bộ lọc
              </button>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-full bg-[#315020] py-3.5 text-sm font-semibold text-white"
              >
                Xem sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          CAM KẾT (dải núi dẫn vào khối xanh)
      =================================================== */}
      <div className="bg-[#fbf8ef]">
        <RidgeDivider fill="#214919" className="-mb-px" />
      </div>

      <section className="relative overflow-hidden bg-[#214919] text-white">
        <ContourPattern
          stroke="#dfb65c"
          opacity={0.08}
          className="pointer-events-none absolute -left-32 -top-10 w-[700px] max-w-none"
        />

        <div className="relative mx-auto grid max-w-[1400px] gap-8 px-7 pb-14 pt-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {[
            {
              icon: <LeafIcon />,
              title: 'Sản phẩm đặc trưng',
              text: 'Chọn lọc tại địa phương',
            },
            {
              icon: <PinIcon />,
              title: 'Nguồn gốc rõ ràng',
              text: 'Mỗi sản phẩm gắn với một vùng sản xuất',
            },
            {
              icon: <BoxIcon />,
              title: 'Đóng gói cẩn thận',
              text: 'Giữ trọn hương vị khi đến tay bạn',
            },
            {
              icon: <TruckIcon />,
              title: 'Giao hàng tận nơi',
              text: `Phí ${formatPrice(SHIPPING_FEE)}, miễn phí đơn trên ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
            },
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 90}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#dfb65c]/35 bg-[#dfb65c]/10 text-[#e6bd63]">
                  {item.icon}
                </div>
                <div>
                  <div className="font-serif text-[16px] font-semibold">
                    {item.title}
                  </div>
                  <div className="mt-1 text-[13px] leading-6 text-white/60">
                    {item.text}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}