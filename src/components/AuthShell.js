import Link from "next/link";
import { LandscapeScene } from "@/components/Landscape";

// Muốn dùng ảnh thật làm nền: bỏ ảnh vào public/images/ rồi điền đường dẫn, ví dụ "/images/login-bg.jpg".
// Để trống thì dùng tranh cao nguyên Lâm Đồng (rừng thông, núi, sương sớm) vẽ sẵn của website.
const BACKGROUND_PHOTO = "";

function LeafIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 4C11 4 5 7 5 13c0 4 3 7 7 7 6 0 8-6 8-16Z" />
      <path d="M5 20c2.5-4.5 6-7.5 11-10" />
    </svg>
  );
}

function ScenicBackground() {
  if (BACKGROUND_PHOTO) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={BACKGROUND_PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return <LandscapeScene theme="highland" />;
}

/**
 * Khung chung cho các trang tài khoản (đăng nhập, đăng ký, quên mật khẩu).
 * Màn hình lớn: cột trái là cảnh cao nguyên Lâm Đồng, cột phải là form (children).
 * Màn hình nhỏ: có dải cảnh nhỏ ở đầu trang.
 */
export default function AuthShell({ eyebrow, title, text, children }) {
  return (
    <main className="grid min-h-screen bg-[#f8f5ec] text-[#292c18] lg:grid-cols-[1.1fr_1fr]">
      {/* CỘT TRÁI: CẢNH LÂM ĐỒNG (chỉ hiện trên màn hình lớn) */}
      <div className="relative hidden overflow-hidden bg-[#0c2b25] lg:block">
        <ScenicBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07201a]/80 via-[#07201a]/25 to-[#07201a]/70" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8c97a]/60 bg-white/5 text-[#f3e3b3] backdrop-blur-sm">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[18px] font-semibold tracking-[0.13em] text-white">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#e8c97a]">LÂM ĐỒNG</div>
            </div>
          </Link>

          <div className="max-w-[460px]">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#dfb65c]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e8c97a]">{eyebrow}</span>
            </div>
            <h2 className="mt-6 font-serif text-[34px] font-semibold leading-[1.2] text-white xl:text-[40px]">{title}</h2>
            <p className="mt-5 text-[15px] leading-7 text-white/80">{text}</p>
          </div>

          <div className="flex gap-10 border-t border-white/20 pt-6">
            <div>
              <div className="font-serif text-[26px] font-semibold text-white">18+</div>
              <div className="mt-0.5 text-xs text-white/70">Sản phẩm</div>
            </div>
            <div>
              <div className="font-serif text-[26px] font-semibold text-white">6</div>
              <div className="mt-0.5 text-xs text-white/70">Vùng đặc sản</div>
            </div>
            <div>
              <div className="font-serif text-[26px] font-semibold text-white">100%</div>
              <div className="mt-0.5 text-xs text-white/70">Nguồn gốc rõ ràng</div>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: FORM */}
      <div className="flex flex-col">
        <div className="relative h-[150px] overflow-hidden bg-[#0c2b25] sm:h-[190px] lg:hidden">
          <ScenicBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07201a]/70 via-[#07201a]/20 to-[#07201a]/50" />
          <Link href="/" className="relative flex h-full items-start gap-3 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8c97a]/60 bg-white/5 text-[#f3e3b3] backdrop-blur-sm">
              <LeafIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-serif text-[17px] font-semibold tracking-[0.13em] text-white">ĐẶC SẢN</div>
              <div className="text-[9px] font-medium tracking-[0.3em] text-[#e8c97a]">LÂM ĐỒNG</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:py-14">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </main>
  );
}
