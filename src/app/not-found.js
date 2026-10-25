import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LandscapeScene } from "@/components/Landscape";

export const metadata = {
  title: "Không tìm thấy trang",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header />

      <section className="relative isolate overflow-hidden bg-[#0c2b25]">
        <div className="absolute inset-0 -z-10">
          <LandscapeScene theme="highland" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#07201a]/70 via-[#07201a]/35 to-[#07201a]/75" />

        <div className="mx-auto flex min-h-[520px] max-w-[760px] flex-col items-center justify-center px-6 py-24 text-center">
          <span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#e8c97a]">
            Lỗi 404
          </span>
          <h1 className="mt-5 font-serif text-[64px] font-semibold leading-none text-white sm:text-[96px]">
            404
          </h1>
          <p className="mt-6 font-serif text-[26px] font-semibold text-white sm:text-[32px]">
            Trang bạn tìm không còn ở đây
          </p>
          <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-white/80">
            Có thể đường dẫn đã thay đổi hoặc bạn nhập chưa đúng. Hãy quay lại trang chủ hoặc tiếp tục khám phá đặc sản của ba vùng đất Lâm Đồng.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-full bg-[#dfb65c] px-8 py-3.5 text-[14px] font-semibold text-[#1d2c13] shadow-[0_14px_34px_-10px_rgba(223,182,92,0.8)] transition hover:-translate-y-0.5 hover:bg-[#ebc975]"
            >
              Về trang chủ
            </Link>
            <Link
              href="/products"
              className="rounded-full border border-white/40 bg-white/5 px-8 py-3.5 text-[14px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
