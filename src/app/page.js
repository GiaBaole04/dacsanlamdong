'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const categories = [
  {
    name: 'Cà phê',
    description: 'Hương vị cà phê cao nguyên',
    icon: '☕',
  },
  {
    name: 'Trà',
    description: 'Trà thơm từ vùng Bảo Lộc',
    icon: '🍵',
  },
  {
    name: 'Trái cây tươi',
    description: 'Nông sản tươi theo mùa',
    icon: '🍓',
  },
  {
    name: 'Mứt & Trái cây sấy',
    description: 'Đặc sản Đà Lạt',
    icon: '🍯',
  },
  {
    name: 'Hạt',
    description: 'Các loại hạt đặc sản',
    icon: '🌰',
  },
  {
    name: 'Đặc sản khác',
    description: 'Hương vị địa phương',
    icon: '🌿',
  },
];

const regions = [
  'Đà Lạt',
  'Bảo Lộc',
  'Cầu Đất',
  'Đơn Dương',
  'Đức Trọng',
  'Hàm Thuận Nam',
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error('Không thể tải sản phẩm');
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const featuredProducts = products.slice(0, 8);

  return (
    <main className="min-h-screen bg-[#faf9f5] text-stone-800">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-xl text-white">
              🌿
            </div>

            <div>
              <div className="text-xl font-bold tracking-tight text-emerald-900">
                DaLat Fresh
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
                Đặc sản Lâm Đồng
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="font-medium text-emerald-800"
            >
              Trang chủ
            </Link>

            <Link
              href="/products"
              className="font-medium text-stone-600 transition hover:text-emerald-800"
            >
              Sản phẩm
            </Link>

            <Link
              href="/stories"
              className="font-medium text-stone-600 transition hover:text-emerald-800"
            >
              Câu chuyện
            </Link>

            <Link
              href="/about"
              className="font-medium text-stone-600 transition hover:text-emerald-800"
            >
              Về chúng tôi
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">

            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 sm:block"
            >
              Đăng nhập
            </Link>

            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-lg transition hover:border-emerald-700 hover:text-emerald-800"
              title="Giỏ hàng"
            >
              🛒
            </Link>

          </div>
        </div>
      </header>


      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-[#e8efe5]">

        <div className="mx-auto grid min-h-[580px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">

          {/* Hero text */}
          <div className="relative z-10">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm">
              <span>🌱</span>
              Tinh hoa từ cao nguyên Lâm Đồng
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-emerald-950 md:text-6xl">
              Đặc sản
              <span className="block text-amber-700">
                từ vùng đất cao nguyên
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
              Khám phá những sản vật đặc trưng của Lâm Đồng,
              từ cà phê Cầu Đất, trà Bảo Lộc đến những món quà
              mang hương vị Đà Lạt.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <Link
                href="/products"
                className="rounded-full bg-emerald-800 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-900"
              >
                Khám phá sản phẩm
              </Link>

              <Link
                href="/stories"
                className="rounded-full border border-stone-300 bg-white px-7 py-3.5 font-semibold text-stone-700 transition hover:border-emerald-700 hover:text-emerald-800"
              >
                Khám phá câu chuyện
              </Link>

            </div>

            {/* Small stats */}
            <div className="mt-12 flex gap-10">
              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  18+
                </div>
                <div className="text-sm text-stone-500">
                  Sản phẩm
                </div>
              </div>

              <div className="h-10 w-px bg-stone-300" />

              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  6
                </div>
                <div className="text-sm text-stone-500">
                  Danh mục
                </div>
              </div>

              <div className="h-10 w-px bg-stone-300" />

              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  Lâm Đồng
                </div>
                <div className="text-sm text-stone-500">
                  Vùng đất
                </div>
              </div>
            </div>
          </div>


          {/* Hero visual */}
          <div className="relative flex min-h-[430px] items-center justify-center">

            <div className="absolute h-[400px] w-[400px] rounded-full bg-emerald-200/60 blur-3xl" />

            <div className="relative h-[390px] w-[390px] overflow-hidden rounded-[45%_55%_48%_52%] bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-950 shadow-2xl">

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.18),transparent_30%)]" />

              <div className="absolute left-10 top-12 text-7xl">
                ☕
              </div>

              <div className="absolute right-10 top-20 text-6xl">
                🍓
              </div>

              <div className="absolute bottom-16 left-16 text-7xl">
                🍵
              </div>

              <div className="absolute bottom-10 right-12 text-6xl">
                🌿
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-3xl border border-white/20 bg-white/10 px-8 py-5 text-center backdrop-blur-md">
                  <div className="text-sm uppercase tracking-[0.3em] text-white/70">
                    Lâm Đồng
                  </div>

                  <div className="mt-2 text-3xl font-bold text-white">
                    Farm & Specialty
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ================= CATEGORIES ================= */}
      <section className="mx-auto max-w-7xl px-6 py-20">

        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Khám phá
          </p>

          <h2 className="mt-2 text-3xl font-bold text-emerald-950 md:text-4xl">
            Danh mục đặc sản
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-stone-500">
            Những nhóm sản phẩm đặc trưng được tuyển chọn
            từ các vùng của Lâm Đồng.
          </p>
        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="group rounded-3xl border border-stone-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5"
            >

              <div className="flex items-center gap-5">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl transition group-hover:bg-emerald-800 group-hover:scale-105">
                  {category.icon}
                </div>

                <div>
                  <h3 className="font-bold text-stone-800 group-hover:text-emerald-800">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-sm text-stone-500">
                    {category.description}
                  </p>
                </div>

              </div>

            </Link>
          ))}

        </div>
      </section>


      {/* ================= FEATURED PRODUCTS ================= */}
      <section className="bg-white py-20">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mb-10 flex items-end justify-between gap-4">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                Tuyển chọn
              </p>

              <h2 className="mt-2 text-3xl font-bold text-emerald-950 md:text-4xl">
                Sản phẩm nổi bật
              </h2>
            </div>

            <Link
              href="/products"
              className="hidden font-semibold text-emerald-800 hover:text-emerald-950 sm:block"
            >
              Xem tất cả →
            </Link>

          </div>


          {loading ? (

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-3xl bg-stone-100"
                />
              ))}
            </div>

          ) : featuredProducts.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-stone-300 py-16 text-center text-stone-500">
              Chưa có sản phẩm để hiển thị.
            </div>

          ) : (

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {featuredProducts.map((product) => {

                const firstVariant = product.variants?.[0];

                return (
                  <Link
                    href={`/products/${product.id}`}
                    key={product.id}
                    className="group overflow-hidden rounded-3xl border border-stone-200 bg-[#faf9f5] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* Product image (ảnh thật nếu có, không thì hiện emoji thay thế) */}
                    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 to-stone-100">

                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="text-7xl transition duration-500 group-hover:scale-110">
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

                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm">
                        {product.category}
                      </div>

                    </div>


                    <div className="p-5">

                      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                        {product.region}
                      </p>

                      <h3 className="mt-1 line-clamp-2 min-h-[48px] font-bold text-stone-800 group-hover:text-emerald-800">
                        {product.name}
                      </h3>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-500">
                        {product.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between">

                        <div>
                          <span className="text-lg font-bold text-emerald-900">
                            {firstVariant
                              ? Number(firstVariant.price).toLocaleString('vi-VN')
                              : 'Liên hệ'}
                          </span>

                          {firstVariant && (
                            <span className="ml-1 text-xs text-stone-500">
                              đ
                            </span>
                          )}
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white transition group-hover:scale-110">
                          →
                        </div>

                      </div>

                    </div>

                  </Link>
                );
              })}

            </div>
          )}

        </div>
      </section>


      {/* ================= REGIONS ================= */}
      <section className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Từ vùng đất
            </p>

            <h2 className="mt-3 text-4xl font-bold leading-tight text-emerald-950">
              Mỗi vùng đất,
              <br />
              một hương vị riêng.
            </h2>

            <p className="mt-5 leading-8 text-stone-500">
              Lâm Đồng sở hữu nhiều vùng sản xuất nông nghiệp
              đặc trưng. Chúng tôi giới thiệu những sản phẩm
              gắn liền với từng vùng đất và câu chuyện phía sau chúng.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white transition hover:bg-emerald-900"
            >
              Khám phá đặc sản
            </Link>

          </div>


          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

            {regions.map((region, index) => (
              <Link
                key={region}
                href={`/products?region=${encodeURIComponent(region)}`}
                className="group relative overflow-hidden rounded-3xl bg-emerald-900 p-6 text-white transition hover:-translate-y-1"
              >

                <div className="text-4xl opacity-80">
                  {['🏔️', '🍵', '☕', '🌱', '🥬', '🍓'][index]}
                </div>

                <div className="mt-10 font-bold">
                  {region}
                </div>

                <div className="mt-1 text-sm text-emerald-200">
                  Khám phá →
                </div>

              </Link>
            ))}

          </div>

        </div>
      </section>


      {/* ================= STORY ================= */}
      <section className="bg-emerald-950 text-white">

        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Câu chuyện đặc sản
            </p>

            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Không chỉ là
              <br />
              một món quà.
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-emerald-100/70">
              Mỗi sản phẩm mang theo một phần câu chuyện của
              vùng đất nơi nó được tạo ra. Từ những đồi cà phê,
              vườn dâu đến những vùng trà xanh mát của cao nguyên.
            </p>

            <Link
              href="/stories"
              className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-emerald-900 transition hover:bg-emerald-50"
            >
              Đọc câu chuyện →
            </Link>

          </div>


          <div className="flex justify-center">

            <div className="relative flex h-80 w-80 items-center justify-center rounded-[40%_60%_55%_45%] bg-emerald-800">

              <div className="absolute inset-8 rounded-[55%_45%_40%_60%] border border-emerald-600" />

              <div className="text-center">

                <div className="text-7xl">
                  🌿
                </div>

                <div className="mt-4 text-sm uppercase tracking-[0.35em] text-emerald-300">
                  Lâm Đồng
                </div>

                <div className="mt-2 text-2xl font-bold">
                  Từ cao nguyên
                  <br />
                  đến bàn ăn
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="bg-[#f4f2eb]">

        <div className="mx-auto max-w-7xl px-6 py-14">

          <div className="grid gap-10 md:grid-cols-4">

            <div className="md:col-span-2">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-xl text-white">
                  🌿
                </div>

                <div>
                  <div className="font-bold text-emerald-900">
                    DaLat Fresh
                  </div>

                  <div className="text-xs text-stone-500">
                    Đặc sản Lâm Đồng
                  </div>
                </div>

              </div>

              <p className="mt-5 max-w-md leading-7 text-stone-500">
                Website giới thiệu và kinh doanh các sản phẩm
                đặc sản đến từ những vùng đất của Lâm Đồng.
              </p>

            </div>


            <div>
              <h3 className="font-bold text-stone-800">
                Khám phá
              </h3>

              <div className="mt-4 space-y-3 text-sm text-stone-500">

                <Link href="/products" className="block hover:text-emerald-800">
                  Sản phẩm
                </Link>

                <Link href="/stories" className="block hover:text-emerald-800">
                  Câu chuyện
                </Link>

                <Link href="/about" className="block hover:text-emerald-800">
                  Về chúng tôi
                </Link>

              </div>
            </div>


            <div>
              <h3 className="font-bold text-stone-800">
                Liên hệ
              </h3>

              <div className="mt-4 space-y-3 text-sm text-stone-500">

                <p>📍 Lâm Đồng, Việt Nam</p>
                <p>📧 contact@dalatfresh.vn</p>
                <p>☎ 0123 456 789</p>

              </div>
            </div>

          </div>


          <div className="mt-12 border-t border-stone-200 pt-6 text-center text-sm text-stone-400">
            © 2026 DaLat Fresh. Website đồ án tốt nghiệp.
          </div>

        </div>

      </footer>

    </main>
  );
}