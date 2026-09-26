'use client';
import { useCartCount } from '@/hooks/useCartCount';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* =========================================================
   DATA TĨNH CHO PHẦN GIAO DIỆN
   Hình ảnh sẽ ưu tiên lấy từ image_url trong database.
========================================================= */

const categoryData = [
  {
    name: 'Cà phê',
    description: 'Hương vị cà phê cao nguyên',
    icon: '☕',
  },
  {
    name: 'Trà',
    description: 'Tinh hoa trà Bảo Lộc',
    icon: '🍵',
  },
  {
    name: 'Trái cây tươi',
    description: 'Nông sản tươi theo mùa',
    icon: '🍓',
  },
  {
    name: 'Mứt & Trái cây sấy',
    description: 'Đặc sản mang hương vị Đà Lạt',
    icon: '🍯',
  },
  {
    name: 'Hạt',
    description: 'Các loại hạt từ cao nguyên',
    icon: '🌰',
  },
  {
    name: 'Đặc sản khác',
    description: 'Những hương vị địa phương',
    icon: '🌿',
  },
];

const regionData = [
  {
    name: 'Đà Lạt',
    keyword: 'Đà Lạt',
    description: 'Dâu tây · Atiso',
    icon: '🍓',
  },
  {
    name: 'Cầu Đất',
    keyword: 'Cầu Đất',
    description: 'Cà phê Arabica',
    icon: '☕',
  },
  {
    name: 'Bảo Lộc',
    keyword: 'Bảo Lộc',
    description: 'Trà · Cà phê',
    icon: '🍵',
  },
  {
    name: 'Gia Nghĩa',
    keyword: 'Gia Nghĩa',
    description: 'Hạt mắc ca',
    icon: '🌰',
  },
  {
    name: 'Hàm Thuận Nam',
    keyword: 'Hàm Thuận Nam',
    description: 'Thanh long',
    icon: '🌱',
  },
  {
    name: 'Đắk Song',
    keyword: 'Đắk Song',
    description: 'Tiêu · Cà phê',
    icon: '🌿',
  },
];

const storyData = [
  {
    title: 'Mùa cà phê chín đỏ trên cao nguyên Cầu Đất',
    category: 'CHUYỆN TỪ NÔNG TRẠI',
    description:
      'Theo chân người nông dân trong hành trình hái lựa từng quả cà phê chín mọng giữa sương sớm.',
    keyword: 'Cầu Đất',
  },
  {
    title: 'Giữ hương trà Bảo Lộc qua từng thế hệ',
    category: 'NGHỀ TRUYỀN THỐNG',
    description:
      'Những đôi bàn tay lành nghề và bí quyết làm trà đã được gìn giữ qua nhiều mùa vụ.',
    keyword: 'Bảo Lộc',
  },
  {
    title: 'Vị ngọt từ vườn dâu Đà Lạt',
    category: 'NGƯỜI VUN TRỒNG',
    description:
      'Khí hậu mát lành cùng cách chăm sóc tỉ mỉ làm nên những trái dâu căng mọng, thơm lành.',
    keyword: 'Đà Lạt',
  },
];


/* =========================================================
   ICON SVG
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


/* =========================================================
   COMPONENT ẢNH
========================================================= */

function SmartImage({
  src,
  alt,
  className = '',
  overlay = false,
}) {
  if (!src) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#dfe7d8] ${className}`}
      >
        <LeafIcon />
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
      />

      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      )}
    </div>
  );
}


/* =========================================================
   HOME PAGE
========================================================= */

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const cartCount = useCartCount();

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


  /* -------------------------------------------------------
     Sản phẩm nổi bật
  ------------------------------------------------------- */

  const featuredProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);


  /* -------------------------------------------------------
     Lấy ảnh theo khu vực
  ------------------------------------------------------- */

  function getRegionImage(keyword, fallbackIndex) {
    const product = products.find((item) =>
      item.region?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (product?.image_url) {
      return product.image_url;
    }

    return products[fallbackIndex]?.image_url || '';
  }


  /* -------------------------------------------------------
     Ảnh hero
  ------------------------------------------------------- */

  const heroImage =
    products.find((item) =>
      item.category?.toLowerCase().includes('cà phê')
    )?.image_url ||
    products[0]?.image_url ||
    '';


  /* -------------------------------------------------------
     Format tiền
  ------------------------------------------------------- */

  function formatPrice(price) {
    if (!price) return 'Liên hệ';

    return `${Number(price).toLocaleString('vi-VN')}đ`;
  }


  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="absolute left-0 right-0 top-0 z-50 text-white">

        <div className="border-b border-white/10 bg-black/10 backdrop-blur-[3px]">

          <div className="mx-auto flex h-[82px] max-w-[1400px] items-center justify-between px-7 lg:px-10">

            {/* LOGO */}

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28551d] text-[#e6bd63] shadow-lg">
                <LeafIcon />
              </div>

              <div className="leading-none">
                <div className="font-serif text-[17px] font-bold tracking-[0.12em]">
                  ĐẶC SẢN
                </div>

                <div className="mt-1 text-[11px] font-medium tracking-[0.28em] text-[#e1b85e]">
                  LÂM ĐỒNG
                </div>
              </div>
            </Link>


            {/* MENU */}

            <nav className="hidden items-center gap-9 lg:flex">

              <Link
                href="/"
                className="relative py-3 text-sm font-medium text-[#e8bd5c]"
              >
                Trang chủ
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#dcb55b]" />
              </Link>

              <Link
                href="/products"
                className="py-3 text-sm font-medium text-white/90 transition hover:text-[#e8bd5c]"
              >
                Sản phẩm
              </Link>

              <Link
                href="/stories"
                className="py-3 text-sm font-medium text-white/90 transition hover:text-[#e8bd5c]"
              >
                Câu chuyện đặc sản
              </Link>

              <Link
                href="/about"
                className="py-3 text-sm font-medium text-white/90 transition hover:text-[#e8bd5c]"
              >
                Giới thiệu
              </Link>

            </nav>


            {/* ACTIONS */}

            <div className="flex items-center gap-4">

              <button
                type="button"
                className="hidden text-white/90 transition hover:text-[#e8bd5c] sm:block"
                aria-label="Tìm kiếm"
              >
                <SearchIcon />
              </button>

              <Link
                href="/cart"
                className="relative text-white/90 transition hover:text-[#e8bd5c]"
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
                className="hidden items-center gap-2 text-sm text-white/90 transition hover:text-[#e8bd5c] md:flex"
              >
                <UserIcon />
                Đăng nhập
              </Link>

            </div>

          </div>
        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative min-h-[760px] overflow-hidden">

        {/* Ảnh hero */}

        <div className="absolute inset-0">

          {heroImage ? (
            <img
              src={heroImage}
              alt="Đặc sản Lâm Đồng"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[#345229]" />
          )}

          {/* Lớp màu */}

          <div className="absolute inset-0 bg-gradient-to-r from-[#10270d]/90 via-[#1c3b14]/65 to-[#1b3213]/20" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#172b11]/55 via-transparent to-black/10" />

        </div>


        {/* Nội dung hero */}

        <div className="relative mx-auto flex min-h-[760px] max-w-[1400px] items-center px-7 pb-16 pt-32 lg:px-10">

          <div className="max-w-[690px] text-white">

            <div className="mb-6 flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.25em] text-[#e4ba5c]">

              <span className="text-lg">
                ♧
              </span>

              Tinh hoa từ cao nguyên

            </div>


            <h1 className="font-serif text-[48px] font-bold leading-[1.04] tracking-[-0.025em] sm:text-[58px] lg:text-[66px]">

              Đặc sản Lâm Đồng

              <span className="block">
                Từ vùng đất đến bàn ăn
              </span>

            </h1>


            <p className="mt-7 max-w-[620px] text-[16px] leading-7 text-white/85 sm:text-[17px]">

              Khám phá những sản vật đặc trưng từ các vùng đất
              của Lâm Đồng, được tuyển chọn bằng sự tận tâm
              và niềm tự hào địa phương.

            </p>


            <div className="mt-8">

              <Link
                href="/products"
                className="inline-flex items-center gap-4 rounded-full bg-[#dfb65c] px-7 py-4 text-[14px] font-semibold text-[#1d2c13] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#e8c56e]"
              >
                Khám phá sản phẩm

                <ArrowRight />
              </Link>

            </div>

          </div>


          {/* Thông tin góc hero */}

          <div className="absolute bottom-0 right-0 hidden w-[345px] bg-[#1b3213]/95 text-white md:block">

            <div className="grid grid-cols-2 px-8 py-5">

              <div>
                <div className="font-serif text-[25px] font-bold text-[#dfb65c]">
                  100%
                </div>

                <div className="mt-0.5 text-[12px] text-white/65">
                  Sản vật địa phương
                </div>
              </div>

              <div className="border-l border-white/20 pl-8">

                <div className="font-serif text-[25px] font-bold text-[#dfb65c]">
                  6
                </div>

                <div className="mt-0.5 text-[12px] text-white/65">
                  Vùng tuyển chọn
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PRODUCT SECTION
      ===================================================== */}

      <section className="bg-[#fbf8ef] py-24">

        <div className="mx-auto max-w-[1400px] px-7 lg:px-10">

          <div className="mb-12 text-center">

            <p className="text-[12px] font-semibold uppercase tracking-[0.27em] text-[#78502d]">
              Chọn lọc cho bạn
            </p>

            <h2 className="mt-3 font-serif text-[39px] font-bold text-[#292c18]">
              Sản phẩm nổi bật
            </h2>

            <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-7 text-[#77735f]">
              Những hương vị tiêu biểu, mang trong mình khí hậu
              và thổ nhưỡng riêng của miền cao nguyên.
            </p>

            <div className="mx-auto mt-6 h-[2px] w-12 bg-[#d5a94d]" />

          </div>


          {loading ? (

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-[495px] animate-pulse rounded-xl bg-[#eee9dc]"
                />
              ))}

            </div>

          ) : featuredProducts.length > 0 ? (

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {featuredProducts.map((product, index) => {

                const firstVariant = product.variants?.[0];

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group overflow-hidden rounded-xl border border-[#ded8c8] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(48,55,28,.12)]"
                  >

                    {/* ẢNH */}

                    <div className="relative h-[310px] overflow-hidden bg-[#e7eadf]">

                      {product.image_url ? (

                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center bg-[#e3e8db] text-7xl">
                          {index === 0
                            ? '☕'
                            : index === 1
                              ? '🍵'
                              : index === 2
                                ? '🍓'
                                : '🌿'}
                        </div>

                      )}


                      {/* Badge */}

                      <div className="absolute left-4 top-4 rounded-full bg-[#f8f7ef]/95 px-3 py-1.5 text-[11px] font-semibold text-[#315020] shadow-sm">

                        {index === 0
                          ? 'Bán chạy'
                          : index === 1
                            ? 'Được yêu thích'
                            : index === 2
                              ? 'Mới'
                              : 'Theo mùa'}

                      </div>


                      {/* Icon giỏ */}

                      <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f1df] text-[#30471e] shadow-md transition group-hover:bg-[#d9ad50]">

                        <ShoppingBagIcon />

                      </div>

                    </div>


                    {/* THÔNG TIN */}

                    <div className="p-5">

                      <div className="flex items-center gap-1.5 text-[12px] text-[#817967]">

                        <MapPinIcon />

                        <span>
                          {product.region || 'Lâm Đồng'}
                        </span>

                      </div>


                      <h3 className="mt-2 min-h-[50px] font-serif text-[18px] font-bold leading-6 text-[#2d301d] transition group-hover:text-[#355824]">

                        {product.name}

                      </h3>


                      <div className="mt-6 flex items-center justify-between">

                        <div>

                          <span className="text-[12px] text-[#8c8574]">
                            Giá từ
                          </span>

                          <span className="ml-1.5 text-[17px] font-semibold text-[#754522]">

                            {formatPrice(firstVariant?.price)}

                          </span>

                        </div>

                      </div>


                      <div className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-[#2e5a24]">

                        Xem chi tiết

                        <ArrowRight />

                      </div>

                    </div>

                  </Link>
                );
              })}

            </div>

          ) : (

            <div className="rounded-xl border border-dashed border-[#ccc4b1] py-20 text-center text-[#817967]">
              Chưa có sản phẩm để hiển thị.
            </div>

          )}


          {/* BUTTON */}

          <div className="mt-12 text-center">

            <Link
              href="/products"
              className="inline-flex items-center gap-3 rounded-full border border-[#385527] px-7 py-3 text-[13px] font-semibold text-[#315020] transition hover:bg-[#315020] hover:text-white"
            >
              Xem tất cả sản phẩm

              <ArrowRight />

            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          REGION
      ===================================================== */}

      <section className="bg-[#f8eecf] py-24">

        <div className="mx-auto max-w-[1400px] px-7 lg:px-10">

          <div className="mb-12 text-center">

            <p className="text-[12px] font-semibold uppercase tracking-[0.27em] text-[#78502d]">
              Khám phá cao nguyên
            </p>

            <h2 className="mt-3 font-serif text-[39px] font-bold text-[#292c18]">
              Đặc sản theo vùng
            </h2>

            <p className="mx-auto mt-4 max-w-[620px] text-[15px] text-[#716b58]">
              Mỗi vùng đất là một câu chuyện, một hương vị không thể trộn lẫn.
            </p>

            <div className="mx-auto mt-6 h-[2px] w-12 bg-[#d5a94d]" />

          </div>


          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

            {regionData.map((region, index) => {

              const image = getRegionImage(region.keyword, index);

              return (
                <Link
                  key={region.name}
                  href={`/products?region=${encodeURIComponent(region.keyword)}`}
                  className="group relative h-[208px] overflow-hidden rounded-lg"
                >

                  {image ? (

                    <img
                      src={image}
                      alt={region.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />

                  ) : (

                    <div className="absolute inset-0 bg-[#617051]" />

                  )}


                  <div className="absolute inset-0 bg-gradient-to-t from-[#17220e]/90 via-[#17220e]/25 to-transparent" />


                  <div className="absolute bottom-4 left-4 right-4 text-white">

                    <h3 className="font-serif text-[18px] font-bold">
                      {region.name}
                    </h3>

                    <p className="mt-1 text-[11px] text-white/75">
                      {region.description}
                    </p>

                  </div>

                </Link>
              );
            })}

          </div>

        </div>

      </section>


      {/* =====================================================
          STORY
      ===================================================== */}

      <section className="bg-[#fbf8ef] py-24">

        <div className="mx-auto max-w-[1400px] px-7 lg:px-10">

          <div className="mb-12 text-center">

            <p className="text-[12px] font-semibold uppercase tracking-[0.27em] text-[#78502d]">
              Từ đất & người
            </p>

            <h2 className="mt-3 font-serif text-[39px] font-bold text-[#292c18]">
              Câu chuyện đặc sản
            </h2>

            <p className="mx-auto mt-4 max-w-[650px] text-[15px] text-[#716b58]">
              Hiểu thêm về người làm ra sản vật và hành trình
              gìn giữ hương vị quê nhà.
            </p>

            <div className="mx-auto mt-6 h-[2px] w-12 bg-[#d5a94d]" />

          </div>


          <div className="grid gap-6 md:grid-cols-3">

            {storyData.map((story, index) => {

              const image = getRegionImage(story.keyword, index);

              return (
                <article
                  key={story.title}
                  className="group"
                >

                  <Link
                    href="/stories"
                    className="block overflow-hidden rounded-lg"
                  >

                    <div className="h-[270px] overflow-hidden">

                      {image ? (

                        <img
                          src={image}
                          alt={story.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center bg-[#dfe5d5] text-6xl">
                          {index === 0
                            ? '☕'
                            : index === 1
                              ? '🍵'
                              : '🍓'}
                        </div>

                      )}

                    </div>

                  </Link>


                  <div className="pt-5">

                    <p className="text-[11px] font-bold tracking-[0.18em] text-[#8b572e]">
                      {story.category}
                    </p>

                    <h3 className="mt-3 font-serif text-[20px] font-bold leading-7 text-[#292c18]">
                      {story.title}
                    </h3>

                    <p className="mt-3 text-[14px] leading-7 text-[#756f5f]">
                      {story.description}
                    </p>

                    <Link
                      href="/stories"
                      className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#315020]"
                    >
                      Đọc câu chuyện
                      <ArrowRight />
                    </Link>

                  </div>

                </article>
              );
            })}

          </div>

        </div>

      </section>


      {/* =====================================================
          BENEFITS
      ===================================================== */}

      <section className="bg-[#214919] text-white">

        <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-4">

          <div className="flex items-center gap-4 border-b border-white/15 px-6 py-8 md:border-b-0 md:border-r">

            <div className="text-2xl text-[#dfb65c]">
              ♧
            </div>

            <div>

              <div className="text-[14px] font-semibold">
                Sản phẩm đặc trưng
              </div>

              <div className="mt-1 text-[12px] text-white/60">
                Chọn lọc tại địa phương
              </div>

            </div>

          </div>


          <div className="flex items-center gap-4 border-b border-white/15 px-6 py-8 md:border-b-0 md:border-r">

            <div className="text-2xl text-[#dfb65c]">
              ✓
            </div>

            <div>

              <div className="text-[14px] font-semibold">
                Nguồn gốc rõ ràng
              </div>

              <div className="mt-1 text-[12px] text-white/60">
                Thông tin minh bạch
              </div>

            </div>

          </div>


          <div className="flex items-center gap-4 border-r-0 px-6 py-8 md:border-r md:border-white/15">

            <div className="text-2xl text-[#dfb65c]">
              □
            </div>

            <div>

              <div className="text-[14px] font-semibold">
                Đóng gói cẩn thận
              </div>

              <div className="mt-1 text-[12px] text-white/60">
                Giữ trọn hương vị
              </div>

            </div>

          </div>


          <div className="flex items-center gap-4 px-6 py-8">

            <div className="text-2xl text-[#dfb65c]">
              ♧
            </div>

            <div>

              <div className="text-[14px] font-semibold">
                Giao hàng tận nơi
              </div>

              <div className="mt-1 text-[12px] text-white/60">
                Trên toàn quốc
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#172f11] text-white">

        <div className="mx-auto max-w-[1400px] px-7 py-16 lg:px-10">

          <div className="grid gap-12 md:grid-cols-[1.7fr_1fr_1fr_1.1fr]">


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


              <p className="mt-7 max-w-[360px] text-[14px] leading-7 text-white/60">
                Mang những sản vật chân thật của cao nguyên
                Lâm Đồng đến gần hơn với mỗi gia đình Việt.
              </p>


              <div className="mt-6 flex gap-3">

                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs transition hover:border-[#dcb55b] hover:text-[#dcb55b]"
                >
                  f
                </a>

                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-xs transition hover:border-[#dcb55b] hover:text-[#dcb55b]"
                >
                  ◎
                </a>

              </div>

            </div>


            {/* KHÁM PHÁ */}

            <div>

              <h3 className="font-serif text-[16px] font-bold">
                Khám phá
              </h3>

              <div className="mt-6 space-y-4 text-[13px] text-white/60">

                <Link
                  href="/products"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Sản phẩm
                </Link>

                <Link
                  href="/products"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Đặc sản theo vùng
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
                  Về chúng tôi
                </Link>

              </div>

            </div>


            {/* CHÍNH SÁCH */}

            <div>

              <h3 className="font-serif text-[16px] font-bold">
                Chính sách
              </h3>

              <div className="mt-6 space-y-4 text-[13px] text-white/60">

                <Link
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Giao hàng
                </Link>

                <Link
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Đổi trả
                </Link>

                <Link
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Thanh toán
                </Link>

                <Link
                  href="#"
                  className="block transition hover:text-[#dfb65c]"
                >
                  Bảo mật
                </Link>

              </div>

            </div>


            {/* LIÊN HỆ */}

            <div>

              <h3 className="font-serif text-[16px] font-bold">
                Liên hệ
              </h3>

              <div className="mt-6 space-y-4 text-[13px] text-white/60">

                <div className="flex gap-3">

                  <span className="text-[#dfb65c]">
                    ⌖
                  </span>

                  <span>
                    Lâm Đồng, Việt Nam
                  </span>

                </div>


                <div className="flex gap-3">

                  <span className="text-[#dfb65c]">
                    ☎
                  </span>

                  <span>
                    1900 0000
                  </span>

                </div>


                <div className="flex gap-3">

                  <span className="text-[#dfb65c]">
                    ✉
                  </span>

                  <span>
                    hello@dacsanlamdong.vn
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* COPYRIGHT */}

          <div className="mt-14 border-t border-white/10 pt-6 text-center text-[12px] text-white/40">

            © 2026 Đặc Sản Lâm Đồng. Gìn giữ hương vị quê nhà.

          </div>

        </div>

      </footer>

    </main>
  );
}