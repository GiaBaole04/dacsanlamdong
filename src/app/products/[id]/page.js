"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";

/* =========================
   ICONS
========================= */

function ArrowLeft({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRight({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function ShoppingBagIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MapPinIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function LeafIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MinusIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

/* =========================
   HELPERS
========================= */

function formatPrice(price) {
  const number = Number(price);
  if (!Number.isFinite(number)) return "Liên hệ";
  return `${number.toLocaleString("vi-VN")}đ`;
}

function getStartingPrice(product) {
  const prices = (product?.variants || [])
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price));
  if (!prices.length) return null;
  return Math.min(...prices);
}

/* =========================
   PAGE
========================= */

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!productId) return;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) throw new Error("Không thể tải dữ liệu sản phẩm.");

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Dữ liệu sản phẩm không hợp lệ.");

        setAllProducts(data);

        const foundProduct = data.find((item) => String(item.id) === String(productId));

        if (!foundProduct) {
          setError("Không tìm thấy sản phẩm.");
          setProduct(null);
          return;
        }

        setProduct(foundProduct);

        if (foundProduct.variants?.length > 0) {
          setSelectedVariant(foundProduct.variants[0]);
        }
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((item) => String(item.id) !== String(product.id))
      .filter((item) => (!product.category ? true : item.category === product.category))
      .slice(0, 4);
  }, [allProducts, product]);

  const increaseQuantity = () => {
    const maxStock = selectedVariant?.stock;
    if (Number.isFinite(Number(maxStock)) && quantity >= Number(maxStock)) return;
    setQuantity((current) => current + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  async function handleAddToCart() {
    if (!product || !selectedVariant || addingToCart) return;

    setAddingToCart(true);
    try {
      await addItem(product, selectedVariant, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    } catch (err) {
      console.error("Không thêm được vào giỏ:", err);
    } finally {
      setAddingToCart(false);
    }
  }

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
        <Header />
        <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-[4px] bg-[#e8e1d2]" />
            <div className="space-y-5 pt-4">
              <div className="h-4 w-32 animate-pulse rounded bg-[#e8e1d2]" />
              <div className="h-12 w-3/4 animate-pulse rounded bg-[#e8e1d2]" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-[#e8e1d2]" />
              <div className="h-24 w-full animate-pulse rounded bg-[#e8e1d2]" />
              <div className="h-14 w-full animate-pulse rounded bg-[#e8e1d2]" />
              <div className="h-14 w-full animate-pulse rounded bg-[#e8e1d2]" />
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */
  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
        <Header />
        <section className="flex min-h-[55vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#ebe4d5] text-[#53633c]">
              <LeafIcon className="h-9 w-9" />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
              Sản phẩm
            </p>
            <h1 className="font-serif text-3xl font-semibold text-[#344723] md:text-4xl">
              Không tìm thấy sản phẩm
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#6f715f]">
              Sản phẩm bạn đang tìm kiếm có thể không tồn tại hoặc đã được thay đổi.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-3 bg-[#344723] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#263719]"
            >
              <ArrowLeft className="h-4 w-4" />
              Xem tất cả sản phẩm
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  /* =========================
     DATA
  ========================= */
  const startingPrice = getStartingPrice(product);
  const currentPrice = selectedVariant ? Number(selectedVariant.price) : startingPrice;

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header />

      {/* BREADCRUMB */}
      <div className="border-b border-[#e7e0d1] bg-[#f8f5ec]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-5 text-[12px] lg:px-10">
          <Link href="/" className="text-[#7a7d6b] transition hover:text-[#344723]">Trang chủ</Link>
          <span className="text-[#b4ad9b]">/</span>
          <Link href="/products" className="text-[#7a7d6b] transition hover:text-[#344723]">Sản phẩm</Link>
          <span className="text-[#b4ad9b]">/</span>
          <span className="max-w-[220px] truncate font-medium text-[#344723]">{product.name}</span>
        </div>
      </div>

      {/* PRODUCT DETAIL */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* IMAGE */}
          <div>
            <div className="relative overflow-hidden bg-[#eee8da]">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="aspect-square h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-[#8c8d7d]">
                  <div className="text-center">
                    <LeafIcon className="mx-auto mb-3 h-10 w-10" />
                    <p className="text-sm">Chưa có hình ảnh</p>
                  </div>
                </div>
              )}
              <div className="absolute left-5 top-5 bg-[#344723] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                {product.category || "Đặc sản"}
              </div>
            </div>
          </div>

          {/* INFORMATION */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-[#b08b43]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
                {product.category || "Đặc sản Lâm Đồng"}
              </span>
            </div>

            <h1 className="max-w-[650px] font-serif text-4xl font-semibold leading-[1.15] text-[#344723] md:text-5xl">
              {product.name}
            </h1>

            {product.region && (
              <div className="mt-5 flex items-center gap-2 text-sm text-[#707361]">
                <MapPinIcon className="h-4 w-4 text-[#8c7040]" />
                <span>{product.region}</span>
              </div>
            )}

            <div className="mt-7 border-y border-[#e1daca] py-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#898b79]">Giá</div>
              <div className="mt-1 font-serif text-3xl font-semibold text-[#9b7130]">
                {formatPrice(currentPrice)}
              </div>
            </div>

            {product.description && (
              <div className="mt-7">
                <h2 className="font-serif text-xl font-semibold text-[#344723]">Về sản phẩm</h2>
                <p className="mt-3 text-[14px] leading-7 text-[#676a5b]">{product.description}</p>
              </div>
            )}

            {product.variants?.length > 0 && (
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#344723]">Quy cách</span>
                  {selectedVariant?.stock !== undefined && (
                    <span className="text-xs text-[#7b7e6d]">Còn {selectedVariant.stock} sản phẩm</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, index) => {
                    const variantId = variant.id ?? index;
                    const isSelected = String(selectedVariant?.id ?? "") === String(variantId);
                    const label = variant.variant_name ?? `Loại ${index + 1}`;

                    return (
                      <button
                        key={variantId}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        className={`min-w-[90px] border px-4 py-3 text-sm transition ${
                          isSelected
                            ? "border-[#344723] bg-[#344723] text-white"
                            : "border-[#d9d1bf] bg-[#fbf8ef] text-[#4d513e] hover:border-[#53633c]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-7">
              <div className="mb-3 text-sm font-semibold text-[#344723]">Số lượng</div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  className="flex h-11 w-11 items-center justify-center border border-[#d8d0bd] bg-[#fbf8ef] text-[#53633c] transition hover:bg-[#eee8d9]"
                  aria-label="Giảm số lượng"
                >
                  <MinusIcon />
                </button>
                <div className="flex h-11 w-14 items-center justify-center border-y border-[#d8d0bd] bg-[#fbf8ef] text-sm font-medium">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={increaseQuantity}
                  className="flex h-11 w-11 items-center justify-center border border-[#d8d0bd] bg-[#fbf8ef] text-[#53633c] transition hover:bg-[#eee8d9]"
                  aria-label="Tăng số lượng"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex h-14 flex-1 items-center justify-center gap-3 border border-[#344723] bg-[#344723] px-6 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:opacity-60"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                {addedToCart ? "Đã thêm vào giỏ" : addingToCart ? "Đang thêm…" : "Thêm vào giỏ hàng"}
              </button>

              <button
                type="button"
                className="flex h-14 flex-1 items-center justify-center gap-3 border border-[#b08b43] bg-[#b08b43] px-6 text-sm font-semibold text-white transition hover:bg-[#956d2e]"
              >
                Mua ngay
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {addedToCart && (
              <div className="mt-4 flex items-center gap-2 border border-[#d6dec9] bg-[#edf2e7] px-4 py-3 text-sm text-[#4b5c3b]">
                <CheckIcon className="h-4 w-4" />
                Sản phẩm đã được thêm vào giỏ hàng.
                <Link href="/cart" className="ml-auto font-semibold underline underline-offset-4">
                  Xem giỏ hàng
                </Link>
              </div>
            )}

            <div className="mt-8 grid gap-3 border-t border-[#e1daca] pt-6 sm:grid-cols-3">
              <div>
                <div className="mb-1 text-xs font-semibold text-[#344723]">Nguồn gốc rõ ràng</div>
                <p className="text-[11px] leading-5 text-[#7a7c6c]">
                  Thông tin vùng sản xuất được hiển thị cùng sản phẩm.
                </p>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-[#344723]">Đóng gói cẩn thận</div>
                <p className="text-[11px] leading-5 text-[#7a7c6c]">
                  Sản phẩm được chuẩn bị phù hợp trước khi giao.
                </p>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-[#344723]">Giao hàng</div>
                <p className="text-[11px] leading-5 text-[#7a7c6c]">
                  Hỗ trợ giao sản phẩm đến khách hàng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY / ORIGIN */}
      <section className="border-y border-[#e3dccd] bg-[#f1eadb]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr] md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#b08b43]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
                  Từ vùng đất Lâm Đồng
                </span>
              </div>
              <h2 className="mt-4 max-w-sm font-serif text-3xl font-semibold leading-tight text-[#344723]">
                Mỗi sản phẩm mang theo một câu chuyện
              </h2>
            </div>
            <div>
              <p className="max-w-3xl text-[14px] leading-8 text-[#656858]">
                {product.description ||
                  "Những sản phẩm đặc sản được lựa chọn từ các vùng đất Lâm Đồng, mang đến hương vị và nét riêng của từng địa phương."}
              </p>
              {product.region && (
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[#53633c]">
                  <MapPinIcon className="h-4 w-4 text-[#8c7040]" />
                  {product.region}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#b08b43]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
                  Có thể bạn sẽ thích
                </span>
              </div>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#344723]">Sản phẩm liên quan</h2>
            </div>
            <Link
              href="/products"
              className="hidden items-center gap-2 text-sm font-medium text-[#53633c] transition hover:text-[#344723] sm:flex"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const price = getStartingPrice(item);
              return (
                <Link href={`/products/${item.id}`} key={item.id} className="group block">
                  <div className="relative overflow-hidden bg-[#ebe5d7]">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="aspect-[4/4.3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex aspect-[4/4.3] items-center justify-center text-[#858878]">
                        <LeafIcon className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#fbf8ef] text-[#344723] shadow-sm transition group-hover:bg-[#344723] group-hover:text-white">
                      <ShoppingBagIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="pt-4">
                    {item.region && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#858878]">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {item.region}
                      </div>
                    )}
                    <h3 className="mt-2 font-serif text-lg font-semibold text-[#344723] transition group-hover:text-[#8c7040]">
                      {item.name}
                    </h3>
                    <div className="mt-2 text-sm font-medium text-[#9b7130]">
                      Giá từ {formatPrice(price)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}