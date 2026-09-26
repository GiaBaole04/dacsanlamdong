'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <path d="M5 8.5h14l-.8 11H5.8L5 8.5Z" />
      <path d="M8.5 9V6.8a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
    >
      <path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 9-6 10-15Z" />
      <path d="M4 20c3-5 7-8 13-11" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <path d="M4 7h16" />
      <path d="M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="currentColor" />
      <circle cx="15" cy="17" r="2" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({ product, index }) {
  const firstVariant = product.variants?.[0];

  const price = firstVariant?.price
    ? Number(firstVariant.price).toLocaleString('vi-VN')
    : null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-[#ded8c8] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(48,55,28,.12)]"
    >
      {/* IMAGE */}
      <div className="relative h-[285px] overflow-hidden bg-[#e7eadf]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#e3e8db] text-7xl">
            {product.category?.includes('Cà phê')
              ? '☕'
              : product.category?.includes('Trà')
                ? '🍵'
                : product.category?.includes('Trái')
                  ? '🍓'
                  : product.category?.includes('Mứt')
                    ? '🍯'
                    : product.category?.includes('Hạt')
                      ? '🌰'
                      : '🌿'}
          </div>
        )}

        {/* CATEGORY BADGE */}
        <div className="absolute left-4 top-4 rounded-full bg-[#f8f7ef]/95 px-3 py-1.5 text-[11px] font-semibold text-[#315020] shadow-sm">
          {product.category || 'Đặc sản'}
        </div>

        {/* CART BUTTON */}
        <div className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f1df] text-[#30471e] shadow-md transition duration-300 group-hover:bg-[#d9ad50] group-hover:text-[#263019]">
          <ShoppingBagIcon />
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {/* REGION */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#817967]">
          <MapPinIcon />
          <span>{product.region || 'Lâm Đồng'}</span>
        </div>

        {/* NAME */}
        <h3 className="mt-2 min-h-[52px] font-serif text-[19px] font-bold leading-6 text-[#2d301d] transition group-hover:text-[#355824]">
          {product.name}
        </h3>

        {/* DESCRIPTION */}
        <p className="mt-3 min-h-[48px] text-[13px] leading-6 text-[#817967]">
          {product.description || 'Đặc sản được tuyển chọn từ vùng đất Lâm Đồng.'}
        </p>

        {/* PRICE */}
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-[12px] text-[#8c8574]">
              Giá từ
            </span>

            {price ? (
              <span className="ml-1.5 text-[18px] font-semibold text-[#754522]">
                {price}đ
              </span>
            ) : (
              <span className="ml-1.5 text-[16px] font-semibold text-[#754522]">
                Liên hệ
              </span>
            )}
          </div>
        </div>

        {/* DETAIL */}
        <div className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-[#2e5a24]">
          Xem chi tiết
          <ArrowRight />
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductsPage() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || ''
  );
  const [selectedRegion, setSelectedRegion] = useState(
    searchParams.get('region') || ''
  );

  const [sort, setSort] = useState('default');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [cartCount] = useState(3);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

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

  /* =======================================================
     CATEGORY LIST
  ======================================================= */

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category)
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  /* =======================================================
     REGION LIST
  ======================================================= */

  const regions = useMemo(() => {
    const values = products
      .map((product) => product.region)
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  /* =======================================================
     FILTER + SEARCH + SORT
  ======================================================= */

  const filteredProducts = useMemo(() => {
    let result = [...products];

    /* SEARCH */
    const keyword = search.trim().toLowerCase();

    if (keyword) {
      result = result.filter((product) => {
        return (
          product.name?.toLowerCase().includes(keyword) ||
          product.description?.toLowerCase().includes(keyword) ||
          product.category?.toLowerCase().includes(keyword) ||
          product.region?.toLowerCase().includes(keyword)
        );
      });
    }

    /* CATEGORY */
    if (selectedCategory) {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    /* REGION */
    if (selectedRegion) {
      result = result.filter(
        (product) => product.region === selectedRegion
      );
    }

    /* SORT */
    if (sort === 'price-low') {
      result.sort((a, b) => {
        const priceA = Number(a.variants?.[0]?.price || 0);
        const priceB = Number(b.variants?.[0]?.price || 0);

        return priceA - priceB;
      });
    }

    if (sort === 'price-high') {
      result.sort((a, b) => {
        const priceA = Number(a.variants?.[0]?.price || 0);
        const priceB = Number(b.variants?.[0]?.price || 0);

        return priceB - priceA;
      });
    }

    if (sort === 'name') {
      result.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'vi')
      );
    }

    return result;
  }, [
    products,
    search,
    selectedCategory,
    selectedRegion,
    sort,
  ]);

  /* =======================================================
     RESET FILTER
  ======================================================= */

  function resetFilters() {
    setSearch('');
    setSelectedCategory('');
    setSelectedRegion('');
    setSort('default');
  }

  const hasFilter =
    search ||
    selectedCategory ||
    selectedRegion ||
    sort !== 'default';

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#e1ddcf] bg-[#f8f5ec]/95 backdrop-blur-md">

        <div className="mx-auto flex h-[82px] max-w-[1400px] items-center justify-between px-6 lg:px-10">

          {/* LOGO */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28551d] text-[#e6bd63] shadow-sm">
              <LeafIcon />
            </div>

            <div className="leading-none">
              <div className="font-serif text-[17px] font-bold tracking-[0.12em] text-[#292c18]">
                ĐẶC SẢN
              </div>

              <div className="mt-1 text-[11px] font-medium tracking-[0.28em] text-[#a0782e]">
                LÂM ĐỒNG
              </div>
            </div>
          </Link>

          {/* NAV */}

          <nav className="hidden items-center gap-9 lg:flex">

            <Link
              href="/"
              className="py-3 text-sm font-medium text-[#666353] transition hover:text-[#315020]"
            >
              Trang chủ
            </Link>

            <Link
              href="/products"
              className="relative py-3 text-sm font-semibold text-[#315020]"
            >
              Sản phẩm

              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#dcb55b]" />
            </Link>

            <Link
              href="/stories"
              className="py-3 text-sm font-medium text-[#666353] transition hover:text-[#315020]"
            >
              Câu chuyện đặc sản
            </Link>

            <Link
              href="/about"
              className="py-3 text-sm font-medium text-[#666353] transition hover:text-[#315020]"
            >
              Giới thiệu
            </Link>

          </nav>

          {/* ACTIONS */}

          <div className="flex items-center gap-4">

            <Link
              href="/products"
              className="hidden text-[#555546] transition hover:text-[#315020] sm:block"
              aria-label="Tìm kiếm"
            >
              <SearchIcon />
            </Link>

            <Link
              href="/cart"
              className="relative text-[#555546] transition hover:text-[#315020]"
              aria-label="Giỏ hàng"
            >
              <ShoppingBagIcon />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-3 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#d9ad50] px-1 text-[10px] font-bold text-[#263019]">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/login"
              className="hidden items-center gap-2 text-sm text-[#555546] transition hover:text-[#315020] md:flex"
            >
              <UserIcon />
              Đăng nhập
            </Link>

          </div>

        </div>
      </header>

      {/* ===================================================
          PAGE HERO
      =================================================== */}

      <section className="relative overflow-hidden bg-[#edf0e5]">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(82,112,61,.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">

          <div className="max-w-3xl">

            <p className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#78502d]">
              Tinh hoa từ cao nguyên
            </p>

            <h1 className="mt-4 font-serif text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-[#292c18] sm:text-[54px]">
              Sản phẩm đặc sản
              <span className="block text-[#496a35]">
                Lâm Đồng
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#716d5e] sm:text-[16px]">
              Khám phá những sản vật được tuyển chọn từ
              các vùng đất đặc trưng của Lâm Đồng, từ cà phê
              Cầu Đất, trà Bảo Lộc đến những món quà mang
              hương vị Đà Lạt.
            </p>

          </div>

        </div>
      </section>

      {/* ===================================================
          MAIN PRODUCTS
      =================================================== */}

      <section className="bg-[#fbf8ef] py-16">

        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">

          {/* TOP BAR */}

          <div className="flex flex-col gap-5 border-b border-[#ded8c8] pb-7 lg:flex-row lg:items-center lg:justify-between">

            {/* SEARCH */}

            <div className="relative w-full lg:max-w-[430px]">

              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#817967]">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="h-12 w-full rounded-full border border-[#d8d3c4] bg-white pl-12 pr-5 text-sm text-[#292c18] outline-none transition placeholder:text-[#9a9587] focus:border-[#496a35] focus:ring-2 focus:ring-[#496a35]/10"
              />

            </div>

            {/* SORT */}

            <div className="flex items-center gap-3">

              <span className="hidden text-[13px] text-[#817967] sm:block">
                Sắp xếp:
              </span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 rounded-full border border-[#d8d3c4] bg-white px-5 text-[13px] text-[#4d4c3d] outline-none focus:border-[#496a35]"
              >
                <option value="default">
                  Mặc định
                </option>

                <option value="price-low">
                  Giá thấp đến cao
                </option>

                <option value="price-high">
                  Giá cao đến thấp
                </option>

                <option value="name">
                  Tên A-Z
                </option>
              </select>

            </div>

          </div>

          {/* MOBILE FILTER BUTTON */}

          <div className="mt-6 lg:hidden">

            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#cfc9b9] bg-white text-sm font-semibold text-[#315020]"
            >
              <SlidersIcon />
              Bộ lọc sản phẩm
            </button>

          </div>

          {/* CONTENT */}

          <div className="mt-10 grid gap-10 lg:grid-cols-[230px_1fr]">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="hidden lg:block">

              <div className="sticky top-[105px]">

                {/* CATEGORY */}

                <div>

                  <div className="font-serif text-[18px] font-bold text-[#292c18]">
                    Danh mục
                  </div>

                  <div className="mt-5 space-y-2">

                    <button
                      type="button"
                      onClick={() => setSelectedCategory('')}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                        selectedCategory === ''
                          ? 'bg-[#315020] font-semibold text-white'
                          : 'text-[#676353] hover:bg-[#eeebdf] hover:text-[#315020]'
                      }`}
                    >
                      <span>Tất cả sản phẩm</span>

                      <span>
                        {products.length}
                      </span>
                    </button>

                    {categories.map((category) => {

                      const count = products.filter(
                        (product) =>
                          product.category === category
                      ).length;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() =>
                            setSelectedCategory(category)
                          }
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                            selectedCategory === category
                              ? 'bg-[#315020] font-semibold text-white'
                              : 'text-[#676353] hover:bg-[#eeebdf] hover:text-[#315020]'
                          }`}
                        >
                          <span>{category}</span>

                          <span>{count}</span>
                        </button>
                      );
                    })}

                  </div>

                </div>

                {/* DIVIDER */}

                <div className="my-8 h-px bg-[#ddd7c8]" />

                {/* REGION */}

                <div>

                  <div className="font-serif text-[18px] font-bold text-[#292c18]">
                    Vùng sản xuất
                  </div>

                  <div className="mt-5 space-y-2">

                    <button
                      type="button"
                      onClick={() => setSelectedRegion('')}
                      className={`block w-full rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                        selectedRegion === ''
                          ? 'bg-[#315020] font-semibold text-white'
                          : 'text-[#676353] hover:bg-[#eeebdf] hover:text-[#315020]'
                      }`}
                    >
                      Tất cả vùng
                    </button>

                    {regions.map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() =>
                          setSelectedRegion(region)
                        }
                        className={`block w-full rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                          selectedRegion === region
                            ? 'bg-[#315020] font-semibold text-white'
                            : 'text-[#676353] hover:bg-[#eeebdf] hover:text-[#315020]'
                        }`}
                      >
                        {region}
                      </button>
                    ))}

                  </div>

                </div>

                {/* RESET */}

                {hasFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-8 text-[13px] font-semibold text-[#8a552f] underline underline-offset-4"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}

              </div>

            </aside>

            {/* =================================================
                PRODUCT AREA
            ================================================= */}

            <div>

              {/* RESULT HEADER */}

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

              {/* LOADING */}

              {loading ? (

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="h-[530px] animate-pulse overflow-hidden rounded-2xl border border-[#e2ddcf] bg-white"
                    >
                      <div className="h-[285px] bg-[#e9e6dc]" />

                      <div className="space-y-4 p-5">
                        <div className="h-3 w-24 rounded bg-[#e9e6dc]" />
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
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ))}

                </div>

              ) : (

                /* EMPTY */

                <div className="rounded-2xl border border-dashed border-[#cbc5b5] bg-white py-24 text-center">

                  <div className="text-5xl">
                    🌿
                  </div>

                  <h3 className="mt-5 font-serif text-[24px] font-bold text-[#292c18]">
                    Không tìm thấy sản phẩm
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-[#817967]">
                    Không có sản phẩm nào phù hợp với
                    điều kiện tìm kiếm hoặc bộ lọc hiện tại.
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
          MOBILE FILTER DRAWER
      =================================================== */}

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">

          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Đóng bộ lọc"
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          {/* PANEL */}

          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#fbf8ef] p-6 shadow-2xl">

            <div className="flex items-center justify-between">

              <h2 className="font-serif text-[24px] font-bold text-[#292c18]">
                Bộ lọc
              </h2>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#555546]"
              >
                <XIcon />
              </button>

            </div>

            {/* CATEGORY */}

            <div className="mt-8">

              <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#78502d]">
                Danh mục
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`rounded-xl px-4 py-3 text-left text-sm ${
                    selectedCategory === ''
                      ? 'bg-[#315020] text-white'
                      : 'bg-white text-[#676353]'
                  }`}
                >
                  Tất cả
                </button>

                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(category)
                    }
                    className={`rounded-xl px-4 py-3 text-left text-sm ${
                      selectedCategory === category
                        ? 'bg-[#315020] text-white'
                        : 'bg-white text-[#676353]'
                    }`}
                  >
                    {category}
                  </button>
                ))}

              </div>

            </div>

            {/* REGION */}

            <div className="mt-8">

              <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#78502d]">
                Vùng sản xuất
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() => setSelectedRegion('')}
                  className={`rounded-xl px-4 py-3 text-left text-sm ${
                    selectedRegion === ''
                      ? 'bg-[#315020] text-white'
                      : 'bg-white text-[#676353]'
                  }`}
                >
                  Tất cả vùng
                </button>

                {regions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() =>
                      setSelectedRegion(region)
                    }
                    className={`rounded-xl px-4 py-3 text-left text-sm ${
                      selectedRegion === region
                        ? 'bg-[#315020] text-white'
                        : 'bg-white text-[#676353]'
                    }`}
                  >
                    {region}
                  </button>
                ))}

              </div>

            </div>

            {/* ACTION */}

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
          BENEFITS
      =================================================== */}

      <section className="bg-[#214919] text-white">

        <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-4">

          <div className="border-b border-white/10 px-6 py-7 md:border-b-0 md:border-r">
            <div className="text-[14px] font-semibold">
              Sản phẩm đặc trưng
            </div>

            <div className="mt-1 text-[12px] text-white/55">
              Chọn lọc tại địa phương
            </div>
          </div>

          <div className="border-b border-white/10 px-6 py-7 md:border-b-0 md:border-r">
            <div className="text-[14px] font-semibold">
              Nguồn gốc rõ ràng
            </div>

            <div className="mt-1 text-[12px] text-white/55">
              Thông tin minh bạch
            </div>
          </div>

          <div className="border-b border-white/10 px-6 py-7 md:border-b-0 md:border-r">
            <div className="text-[14px] font-semibold">
              Đóng gói cẩn thận
            </div>

            <div className="mt-1 text-[12px] text-white/55">
              Giữ trọn hương vị
            </div>
          </div>

          <div className="px-6 py-7">
            <div className="text-[14px] font-semibold">
              Giao hàng tận nơi
            </div>

            <div className="mt-1 text-[12px] text-white/55">
              Trên toàn quốc
            </div>
          </div>

        </div>

      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="bg-[#172f11] text-white">

        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">

          <div className="grid gap-10 md:grid-cols-[1.7fr_1fr_1fr_1.1fr]">

            {/* BRAND */}

            <div>

              <Link
                href="/"
                className="inline-flex items-center gap-3"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28551d] text-[#e6bd63]">
                  <LeafIcon />
                </div>

                <div className="leading-none">

                  <div className="font-serif text-[16px] font-bold tracking-[0.1em]">
                    ĐẶC SẢN
                  </div>

                  <div className="mt-1 text-[10px] tracking-[0.27em] text-[#dfb65c]">
                    LÂM ĐỒNG
                  </div>

                </div>

              </Link>

              <p className="mt-6 max-w-[360px] text-[13px] leading-7 text-white/55">
                Mang những sản vật chân thật của cao nguyên
                Lâm Đồng đến gần hơn với mỗi gia đình Việt.
              </p>

            </div>

            {/* EXPLORE */}

            <div>

              <h3 className="font-serif text-[16px] font-bold">
                Khám phá
              </h3>

              <div className="mt-5 space-y-3 text-[13px] text-white/55">

                <Link
                  href="/"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Trang chủ
                </Link>

                <Link
                  href="/products"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Sản phẩm
                </Link>

                <Link
                  href="/stories"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Câu chuyện đặc sản
                </Link>

                <Link
                  href="/about"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Giới thiệu
                </Link>

              </div>

            </div>

            {/* POLICY */}

            <div>

              <h3 className="font-serif text-[16px] font-bold">
                Chính sách
              </h3>

              <div className="mt-5 space-y-3 text-[13px] text-white/55">

                <a
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Giao hàng
                </a>

                <a
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Đổi trả
                </a>

                <a
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Thanh toán
                </a>

                <a
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Bảo mật
                </a>

              </div>

            </div>

            {/* CONTACT */}

            <div>

              <h3 className="font-serif text-[16px] font-bold">
                Liên hệ
              </h3>

              <div className="mt-5 space-y-3 text-[13px] text-white/55">

                <div>
                  Lâm Đồng, Việt Nam
                </div>

                <div>
                  1900 0000
                </div>

                <div>
                  hello@dacsanlamdong.vn
                </div>

              </div>

            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-5 text-center text-[11px] text-white/35">
            © 2026 Đặc Sản Lâm Đồng. Gìn giữ hương vị quê nhà.
          </div>

        </div>

      </footer>

    </main>
  );
}