"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { ContourPattern, LandscapeScene, RidgeDivider, ThemeIcon } from "@/components/Landscape";
import { useCart } from "@/hooks/useCart";
import { regionTheme } from "@/lib/storyFormat";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/orderUtils";

/* =========================
   ICONS
========================= */

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function ArrowLeft({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRight({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

function ShoppingBagIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MapPinIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function LeafIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconBase} strokeWidth={2} className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MinusIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconBase} strokeWidth={2} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconBase} strokeWidth={2} className={className}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function BoxIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

function TruckIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconBase} strokeWidth={1.6} className={className}>
      <path d="M3 6.5h11v9H3z" />
      <path d="M14 10h4l3 3v2.5h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

// Chim bay ngang bầu trời (lớp .bird có sẵn trong globals.css)
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

// "Đà Lạt, Lâm Đồng" -> "Đà Lạt"
function shortRegion(region = "") {
  return region.split(",")[0].trim() || region;
}

// Màu nhãn vùng theo kiểu phong cảnh
const THEME_BADGE = {
  highland: "bg-[#e3eedc] text-[#2f5d2a]",
  forest: "bg-[#f5e2d2] text-[#8a4a24]",
  sea: "bg-[#dcebf1] text-[#1f5d78]",
};

/* =========================
   PAGE
========================= */

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;
  const router = useRouter();
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

  function handleBuyNow() {
    if (!product || !selectedVariant) return;

    const checkoutItem = {
      productId: product.id,
      name: product.name,
      image_url: product.image_url,
      category: product.category,
      region: product.region,
      variantId: selectedVariant.id ?? null,
      variantName: selectedVariant.variant_name ?? "",
      price: Number(selectedVariant.price ?? 0),
      quantity,
    };

    sessionStorage.setItem("checkoutItem", JSON.stringify(checkoutItem));

    router.push("/checkout?buyNow=1");
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
        <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden px-6">
          <ContourPattern
            stroke="#b08b43"
            opacity={0.12}
            className="pointer-events-none absolute -right-32 top-0 w-[640px] max-w-none"
          />
          <div className="relative text-center">
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
        <Footer ridge />
      </main>
    );
  }

  /* =========================
     DATA
  ========================= */
  const startingPrice = getStartingPrice(product);
  const currentPrice = selectedVariant ? Number(selectedVariant.price) : startingPrice;
  const theme = regionTheme(product.region);

  const stockNumber = Number(selectedVariant?.stock);
  const hasStockInfo = selectedVariant?.stock !== undefined && Number.isFinite(stockNumber);
  const soldOut = hasStockInfo && stockNumber <= 0;
  const lowStock = hasStockInfo && stockNumber > 0 && stockNumber <= 5;

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
      <section className="relative overflow-x-clip">
        <ContourPattern
          stroke="#b08b43"
          opacity={0.12}
          className="pointer-events-none absolute -right-40 -top-6 w-[820px] max-w-none"
        />

        <div className="relative mx-auto max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* IMAGE */}
            <div className="fade-up">
              <div className="relative p-3 lg:sticky lg:top-[105px]">
                {/* Bốn góc vàng quanh ảnh */}
                <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-[#b08b43]" />
                <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-[#b08b43]" />
                <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-[#b08b43]" />
                <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#b08b43]" />

                <div className="group relative overflow-hidden bg-[#eee8da] shadow-[0_24px_60px_-24px_rgba(52,71,35,0.45)]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className={`aspect-square h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
                        soldOut ? "grayscale-[55%]" : ""
                      }`}
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-[#8c8d7d]">
                      <div className="text-center">
                        <LeafIcon className="mx-auto mb-3 h-10 w-10" />
                        <p className="text-sm">Chưa có hình ảnh</p>
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#14260f]/50 to-transparent" />

                  <div className="absolute left-5 top-5 bg-[#344723] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    {product.category || "Đặc sản"}
                  </div>

                  {product.region && (
                    <div
                      className={`absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold shadow-md ${THEME_BADGE[theme]}`}
                    >
                      <ThemeIcon theme={theme} className="h-4 w-4" />
                      {shortRegion(product.region)}
                    </div>
                  )}

                  {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1c2412]/35">
                      <span className="rounded-full bg-white/95 px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#9a4528]">
                        Tạm hết hàng
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* INFORMATION */}
            <div className="flex flex-col justify-center">
              <div className="fade-up mb-4 flex items-center gap-3" style={{ animationDelay: "0.08s" }}>
                <span className="h-px w-8 bg-[#b08b43]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">
                  {product.category || "Đặc sản Lâm Đồng"}
                </span>
              </div>

              <h1
                className="fade-up max-w-[650px] font-serif text-4xl font-semibold leading-[1.15] text-[#344723] md:text-5xl"
                style={{ animationDelay: "0.16s" }}
              >
                {product.name}
              </h1>

              {product.region && (
                <div
                  className="fade-up mt-5 flex items-center gap-2 text-sm text-[#707361]"
                  style={{ animationDelay: "0.24s" }}
                >
                  <MapPinIcon className="h-4 w-4 text-[#8c7040]" />
                  <span>{product.region}</span>
                </div>
              )}

              <div
                className="fade-up mt-7 border-y border-[#e1daca] py-5"
                style={{ animationDelay: "0.32s" }}
              >
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#898b79]">Giá</div>
                <div className="mt-1 font-serif text-4xl font-semibold text-[#9b7130]">
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
                    {hasStockInfo && (
                      <span
                        className={`text-xs ${
                          soldOut ? "font-semibold text-[#9a4528]" : lowStock ? "font-semibold text-[#9b7130]" : "text-[#7b7e6d]"
                        }`}
                      >
                        {soldOut
                          ? "Tạm hết hàng"
                          : lowStock
                            ? `Chỉ còn ${stockNumber} sản phẩm`
                            : `Còn ${selectedVariant.stock} sản phẩm`}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
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
                          className={`min-w-[96px] border px-4 py-3 text-sm transition ${
                            isSelected
                              ? "border-[#344723] bg-[#344723] text-white shadow-[0_10px_24px_-10px_rgba(52,71,35,0.7)]"
                              : "border-[#d9d1bf] bg-[#fbf8ef] text-[#4d513e] hover:-translate-y-0.5 hover:border-[#53633c]"
                          }`}
                        >
                          <span className="block font-medium">{label}</span>
                          <span className={`mt-0.5 block text-[11px] ${isSelected ? "text-[#e8c97a]" : "text-[#9b7130]"}`}>
                            {formatPrice(variant.price)}
                          </span>
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

                  {currentPrice > 0 && Number.isFinite(currentPrice) && quantity > 1 && (
                    <span className="ml-5 text-sm text-[#7a7c6c]">
                      Tạm tính:{" "}
                      <span className="font-serif text-lg font-semibold text-[#9b7130]">
                        {formatPrice(currentPrice * quantity)}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || soldOut}
                  className="flex h-14 flex-1 items-center justify-center gap-3 border border-[#344723] bg-[#344723] px-6 text-sm font-semibold text-white transition hover:bg-[#263719] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingBagIcon className="h-5 w-5" />
                  {soldOut
                    ? "Tạm hết hàng"
                    : addedToCart
                      ? "Đã thêm vào giỏ"
                      : addingToCart
                        ? "Đang thêm…"
                        : "Thêm vào giỏ hàng"}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={soldOut}
                  className="shine flex h-14 flex-1 items-center justify-center gap-3 border border-[#b08b43] bg-[#b08b43] px-6 text-sm font-semibold text-white transition hover:bg-[#956d2e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mua ngay
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {addedToCart && (
                <div
                  className="fade-up mt-4 flex items-center gap-2 border border-[#d6dec9] bg-[#edf2e7] px-4 py-3 text-sm text-[#4b5c3b]"
                  role="status"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b6a2a] text-white">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  Sản phẩm đã được thêm vào giỏ hàng.
                  <Link href="/cart" className="ml-auto font-semibold underline underline-offset-4">
                    Xem giỏ hàng
                  </Link>
                </div>
              )}

              <div className="mt-8 grid gap-4 border-t border-[#e1daca] pt-6 sm:grid-cols-3">
                {[
                  {
                    icon: <MapPinIcon className="h-5 w-5" />,
                    title: "Nguồn gốc rõ ràng",
                    text: "Thông tin vùng sản xuất được hiển thị cùng sản phẩm.",
                  },
                  {
                    icon: <BoxIcon />,
                    title: "Đóng gói cẩn thận",
                    text: "Sản phẩm được chuẩn bị phù hợp trước khi giao.",
                  },
                  {
                    icon: <TruckIcon />,
                    title: "Giao hàng",
                    text: `Phí ${formatPrice(SHIPPING_FEE)}, miễn phí đơn trên ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`,
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 sm:block">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef0e3] text-[#53633c] sm:mb-3">
                      {item.icon}
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-semibold text-[#344723]">{item.title}</div>
                      <p className="text-[11px] leading-5 text-[#7a7c6c]">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
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
            {relatedProducts.map((item, index) => {
              const price = getStartingPrice(item);
              const itemTheme = regionTheme(item.region);

              return (
                <Reveal key={item.id} delay={index * 90} className="h-full">
                  <Link
                    href={`/products/${item.id}`}
                    className="group block h-full overflow-hidden border border-[#e1dac8] bg-[#fbf8ef] transition duration-300 hover:-translate-y-1 hover:border-[#d6b765] hover:shadow-[0_18px_40px_-14px_rgba(52,71,35,0.3)]"
                  >
                    <div className="relative overflow-hidden bg-[#ebe5d7]">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          className="aspect-[4/4.3] w-full object-cover transition duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex aspect-[4/4.3] items-center justify-center text-[#858878]">
                          <LeafIcon className="h-8 w-8" />
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#14260f]/45 to-transparent" />

                      {item.region && (
                        <div
                          className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${THEME_BADGE[itemTheme]}`}
                        >
                          <ThemeIcon theme={itemTheme} className="h-3.5 w-3.5" />
                          {shortRegion(item.region)}
                        </div>
                      )}

                      <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fbf8ef] text-[#344723] shadow-sm transition group-hover:bg-[#dfb65c] group-hover:text-[#243219]">
                        <ShoppingBagIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-serif text-lg font-semibold leading-snug text-[#344723] transition group-hover:text-[#8c7040]">
                        {item.name}
                      </h3>
                      <div className="mt-2 text-sm font-medium text-[#9b7130]">
                        Giá từ {formatPrice(price)}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================================================
          TỪ VÙNG ĐẤT LÂM ĐỒNG (khối phong cảnh cuối trang)
      =================================================== */}
      <div className="bg-[#f8f5ec]">
        <RidgeDivider fill="#0c2b25" className="-mb-px" />
      </div>

      <section className="relative isolate overflow-hidden bg-[#0c2b25]">
        <LandscapeScene theme={theme} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f19]/90 via-[#0a1f19]/60 to-[#0a1f19]/20" />
        <div className="mist-drift pointer-events-none absolute -left-[20%] bottom-[18%] h-36 w-[140%] bg-gradient-to-r from-transparent via-[#eef3dd]/25 to-transparent blur-2xl" />
        <Bird top="22%" delay="3s" scale={0.9} />

        <div className="relative mx-auto max-w-[1400px] px-7 py-16 lg:px-10 lg:py-24">
          <Reveal>
            <div className="max-w-[640px]">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#dfb65c]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#e8c97a]">
                  Từ vùng đất Lâm Đồng
                </span>
              </div>

              <h2 className="mt-5 font-serif text-[32px] font-semibold leading-tight text-white md:text-[42px]">
                Mỗi sản phẩm mang theo một câu chuyện
              </h2>

              {product.region && (
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#e8c97a]">
                  <ThemeIcon theme={theme} className="h-4 w-4" />
                  {product.name} · {product.region}
                </div>
              )}

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/stories"
                  className="inline-flex items-center gap-3 bg-[#dfb65c] px-8 py-4 text-sm font-semibold text-[#243219] transition hover:bg-[#ebc975]"
                >
                  Đọc câu chuyện đặc sản
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {product.region && (
                  <Link
                    href={`/products?region=${encodeURIComponent(product.region)}`}
                    className="inline-flex items-center gap-3 border border-white/40 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Đặc sản cùng vùng {shortRegion(product.region)}
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}