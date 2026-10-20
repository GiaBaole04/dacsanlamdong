"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import { ContourPattern, LandscapeScene, RidgeDivider, ThemeIcon } from "@/components/Landscape";
import { regionTheme } from "@/lib/storyFormat";

export default function StoriesPage() {
  const [stories, setStories] = useState(null);
  const [error, setError] = useState("");
  const [region, setRegion] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/stories", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Không tải được các câu chuyện.");
        if (!cancelled) setStories(json.stories);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const regions = useMemo(() => {
    const seen = new Map();
    for (const s of stories || []) {
      if (s.region && !seen.has(s.region)) seen.set(s.region, regionTheme(s.region));
    }
    return [...seen.entries()].map(([name, theme]) => ({ name, theme }));
  }, [stories]);

  const visible = useMemo(
    () => (stories || []).filter((s) => region === "all" || s.region === region),
    [stories, region]
  );

  const [featured, ...rest] = visible;

  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header variant="hero" />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0c2b25]">
        <LandscapeScene theme="highland" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f19]/85 via-[#0a1f19]/45 to-transparent" />

        <div className="relative mx-auto flex min-h-[540px] max-w-[1400px] flex-col justify-center px-7 pb-28 pt-40 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#dfb65c]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e8c97a]">Câu chuyện đặc sản</span>
          </div>
          <h1 className="mt-6 max-w-[760px] font-serif text-[42px] font-semibold leading-[1.15] text-white md:text-[56px]">
            Mỗi đặc sản là một câu chuyện của núi, rừng và biển
          </h1>
          <p className="mt-6 max-w-[560px] text-[16px] leading-8 text-white/80">
            Từ sương sớm Cầu Đất đến những vườn thanh long thắp đèn bên biển, hãy biết đặc sản bạn ăn hôm nay lớn lên ở
            đâu, bằng đôi tay của ai.
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-[-1px]">
          <RidgeDivider fill="#f8f5ec" />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-7 pb-20 lg:px-10">
        {/* BỘ LỌC THEO VÙNG */}
        {regions.length > 1 && (
          <div className="-mt-2 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Lọc theo vùng">
            <button
              type="button"
              onClick={() => setRegion("all")}
              aria-pressed={region === "all"}
              className={`flex-shrink-0 border px-5 py-2.5 text-sm font-medium transition ${
                region === "all"
                  ? "border-[#344723] bg-[#344723] text-white"
                  : "border-[#d9d1bf] bg-[#fbf8ef] text-[#4d513e] hover:border-[#344723]"
              }`}
            >
              Tất cả
            </button>
            {regions.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => setRegion(r.name)}
                aria-pressed={region === r.name}
                className={`flex flex-shrink-0 items-center gap-2 border px-5 py-2.5 text-sm font-medium transition ${
                  region === r.name
                    ? "border-[#344723] bg-[#344723] text-white"
                    : "border-[#d9d1bf] bg-[#fbf8ef] text-[#4d513e] hover:border-[#344723]"
                }`}
              >
                <ThemeIcon theme={r.theme} className="h-4 w-4" />
                {r.name.replace(/, Lâm Đồng$/, "")}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-10 border border-[#e6cfc4] bg-[#faf0ea] px-5 py-4 text-sm text-[#a04a2e]" role="alert">
            {error}
          </p>
        )}

        {!stories && !error && (
          <div className="mt-10 space-y-8" aria-busy="true">
            <div className="h-[420px] animate-pulse bg-[#ebe4d5]" />
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[380px] animate-pulse bg-[#ebe4d5]" />
              ))}
            </div>
          </div>
        )}

        {stories && visible.length === 0 && !error && (
          <div className="mt-16 text-center">
            <p className="font-serif text-2xl font-semibold text-[#344723]">Chưa có câu chuyện nào</p>
            <p className="mt-3 text-sm text-[#6f715f]">Các câu chuyện về đặc sản sẽ sớm được cập nhật.</p>
          </div>
        )}

        {featured && (
          <div className="mt-10">
            <StoryCard story={featured} featured />
          </div>
        )}

        {rest.length > 0 && (
          <div className="mt-9 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* LỜI MỜI */}
      <section className="relative overflow-hidden bg-[#243219] text-white">
        <ContourPattern className="pointer-events-none absolute -right-20 top-1/2 h-[120%] -translate-y-1/2" stroke="#dfb65c" opacity={0.2} />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-7 py-16 lg:flex-row lg:items-center lg:px-10">
          <div className="max-w-[620px]">
            <h2 className="font-serif text-[32px] font-semibold leading-tight">Muốn nếm thử hương vị của từng vùng?</h2>
            <p className="mt-3 text-[15px] leading-7 text-white/70">
              Mỗi sản phẩm trên cửa hàng đều ghi rõ vùng sản xuất, để bạn biết hương vị ấy đến từ đâu.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-3 bg-[#dfb65c] px-8 py-4 text-sm font-semibold text-[#243219] transition hover:bg-[#ebc975]"
          >
            Khám phá sản phẩm
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}