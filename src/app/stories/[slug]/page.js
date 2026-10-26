"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import StoryContent from "@/components/StoryContent";
import { LandscapeScene, RidgeDivider, ThemeIcon } from "@/components/Landscape";
import { THEME_LABEL, formatStoryDate, regionTheme } from "@/lib/storyFormat";

import { friendlyError } from "@/lib/friendlyError";
function formatPrice(price) {
  const number = Number(price);
  return Number.isFinite(number) ? `${number.toLocaleString("vi-VN")}đ` : "Liên hệ";
}

const shortRegion = (region) => String(region || "").replace(/, Lâm Đồng$/, "");

export default function StoryDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/stories/${encodeURIComponent(slug)}`, { cache: "no-store" });

        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Không tải được bài viết.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(friendlyError(err));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* ===== TRẠNG THÁI CHỜ / KHÔNG TÌM THẤY / LỖI ===== */
  if (notFound || error || !data) {
    return (
      <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
        <Header />
        <section className="mx-auto flex min-h-[60vh] max-w-[760px] flex-col items-center justify-center px-7 py-16 text-center">
          {notFound || error ? (
            <>
              <ThemeIcon theme="highland" className="h-12 w-12 text-[#b08b43]" />
              <h1 className="mt-6 font-serif text-[34px] font-semibold text-[#344723]">
                {notFound ? "Không tìm thấy câu chuyện" : "Không tải được bài viết"}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#6f715f]">
                {notFound ? "Bài viết có thể đã được gỡ hoặc đường dẫn chưa đúng." : error}
              </p>
              <Link
                href="/stories"
                className="mt-8 inline-flex items-center gap-3 bg-[#344723] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#263719]"
              >
                Xem tất cả câu chuyện
              </Link>
            </>
          ) : (
            <div className="w-full space-y-4" aria-busy="true">
              <div className="mx-auto h-8 w-2/3 animate-pulse bg-[#ebe4d5]" />
              <div className="h-72 animate-pulse bg-[#ebe4d5]" />
            </div>
          )}
        </section>
        <Footer />
      </main>
    );
  }

  const { story, related, products } = data;
  const theme = regionTheme(story.region);

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header variant="hero" />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0c2b25]">
        {story.coverUrl ? (
          <img src={story.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <LandscapeScene theme={theme} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f19]/90 via-[#0a1f19]/45 to-[#0a1f19]/20" />

        <div className="relative mx-auto flex min-h-[520px] max-w-[1100px] flex-col justify-end px-7 pb-28 pt-40 lg:px-10">
          <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-[12px] text-white/70">
            <Link href="/" className="transition hover:text-white">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link href="/stories" className="transition hover:text-white">Câu chuyện đặc sản</Link>
          </nav>

          {story.region && (
            <div className="mt-6 flex w-fit items-center gap-2 border border-white/25 bg-black/20 px-4 py-2 text-[13px] font-medium text-[#f3d98f] backdrop-blur-sm">
              <ThemeIcon theme={theme} className="h-4 w-4" />
              {story.region}
            </div>
          )}

          <h1 className="mt-5 max-w-[860px] font-serif text-[36px] font-semibold leading-[1.18] text-white md:text-[52px]">
            {story.title}
          </h1>

          <div className="mt-6 flex items-center gap-3 text-[13px] text-white/75">
            <span>{formatStoryDate(story.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{story.readingMinutes} phút đọc</span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-[-1px]">
          <RidgeDivider fill="#f8f5ec" />
        </div>
      </section>

      {/* BÀI VIẾT */}
      <section className="mx-auto max-w-[1100px] px-7 pb-16 pt-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="max-w-[720px]">
            <StoryContent content={story.content} />
          </article>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-[#e1daca] bg-[#fbf8ef] p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c7040]">Về vùng đất này</h2>
              <dl className="mt-5 space-y-4 text-sm">
                {story.region && (
                  <div>
                    <dt className="text-xs text-[#8c8d7d]">Vùng</dt>
                    <dd className="mt-0.5 font-medium text-[#344723]">{story.region}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-[#8c8d7d]">Địa hình</dt>
                  <dd className="mt-0.5 flex items-center gap-2 font-medium text-[#344723]">
                    <ThemeIcon theme={theme} className="h-4 w-4 text-[#53633c]" />
                    {THEME_LABEL[theme]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8c8d7d]">Đăng ngày</dt>
                  <dd className="mt-0.5 font-medium text-[#344723]">{formatStoryDate(story.createdAt)}</dd>
                </div>
              </dl>
              {story.region && (
                <Link
                  href={`/products?q=${encodeURIComponent(shortRegion(story.region))}`}
                  className="mt-6 block bg-[#344723] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#263719]"
                >
                  Xem sản phẩm vùng này
                </Link>
              )}
              <Link href="/stories" className="mt-3 block text-center text-sm font-medium text-[#53633c] transition hover:text-[#344723]">
                ← Tất cả câu chuyện
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* SẢN PHẨM CÙNG VÙNG */}
      {products.length > 0 && (
        <section className="border-y border-[#e3dccd] bg-[#f1eadb]">
          <div className="mx-auto max-w-[1100px] px-7 py-16 lg:px-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#b08b43]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">Từ vùng đất này</span>
            </div>
            <h2 className="mt-3 font-serif text-[30px] font-semibold text-[#344723]">
              Sản phẩm từ {shortRegion(story.region)}
            </h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="group block">
                  <div className="aspect-[4/4.2] overflow-hidden bg-[#ebe5d7]">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#858878]">
                        <ThemeIcon theme={theme} className="h-9 w-9" />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 font-serif text-[18px] font-semibold text-[#344723] transition group-hover:text-[#8c7040]">{p.name}</h3>
                  <div className="mt-1 text-sm font-medium text-[#9b7130]">Từ {formatPrice(p.minPrice)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ĐỌC THÊM */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-7 py-16 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-serif text-[30px] font-semibold text-[#344723]">Đọc thêm</h2>
            <Link href="/stories" className="text-sm font-semibold text-[#8c7040] transition hover:text-[#344723]">
              Xem tất cả →
            </Link>
          </div>
          <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <StoryCard key={r.id} story={r} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}