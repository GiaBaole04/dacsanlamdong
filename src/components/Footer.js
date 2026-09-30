import Link from "next/link";

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

export default function Footer() {
  return (
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
  );
}