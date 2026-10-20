import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ContourPattern, LandscapeScene, RidgeDivider, ThemeIcon } from "@/components/Landscape";

export const metadata = {
  title: "Giới thiệu | Đặc Sản Lâm Đồng",
  description: "Đặc Sản Lâm Đồng mang sản vật của cao nguyên, rừng đất đỏ và biển đến gần hơn với mỗi gia đình Việt.",
};

const REGIONS = [
  {
    theme: "highland",
    title: "Cao nguyên mát lạnh",
    text: "Sương sớm, rừng thông và khí hậu mát quanh năm nuôi lớn cà phê Arabica, trà, dâu tây, atiso cùng những món mứt và trái cây sấy.",
    places: ["Cầu Đất", "Bảo Lộc", "Đà Lạt"],
  },
  {
    theme: "forest",
    title: "Rừng đất đỏ bazan",
    text: "Những triền đất đỏ màu mỡ cho cà phê Robusta đậm đà và hạt tiêu đen cay thơm, thu hoạch rộ vào mùa khô.",
    places: ["Gia Nghĩa", "Đắk Song"],
  },
  {
    theme: "sea",
    title: "Biển nắng gió",
    text: "Vùng ven biển nhiều nắng, nhiều gió cho thanh long ruột đỏ ngọt thanh và nước mắm truyền thống ủ chượp qua nhiều tháng.",
    places: ["Phan Thiết", "Hàm Thuận Nam"],
  },
];

const STEPS = [
  { title: "Chọn đúng vùng", text: "Mỗi sản phẩm gắn với một vùng sản xuất cụ thể, như cà phê Cầu Đất, trà Bảo Lộc hay nước mắm Phan Thiết." },
  { title: "Ghi rõ nguồn gốc", text: "Vùng sản xuất, quy cách và giá được hiển thị minh bạch trên từng sản phẩm." },
  { title: "Đặt hàng dễ dàng", text: "Thanh toán khi nhận hàng, hoặc chuyển khoản bằng mã QR qua MoMo và ứng dụng ngân hàng." },
  { title: "Theo dõi đơn hàng", text: "Xem trạng thái đơn ngay trong tài khoản, từ lúc chờ xác nhận đến khi giao thành công." },
];

const arrow = (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f5ec] text-[#292c18]">
      <Header variant="hero" />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0c2b25]">
        <LandscapeScene theme="highland" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f19]/85 via-[#0a1f19]/45 to-transparent" />

        <div className="relative mx-auto flex min-h-[600px] max-w-[1400px] flex-col justify-center px-7 pb-32 pt-40 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#dfb65c]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#e8c97a]">Giới thiệu</span>
          </div>
          <h1 className="mt-6 max-w-[780px] font-serif text-[44px] font-semibold leading-[1.12] text-white md:text-[62px]">
            Một vùng đất, ba miền hương vị
          </h1>
          <p className="mt-6 max-w-[580px] text-[16px] leading-8 text-white/80">
            Lâm Đồng ngày nay trải dài từ cao nguyên mát lạnh, qua những triền rừng đất đỏ đến bờ biển nắng gió. Đặc Sản
            Lâm Đồng mang những sản vật ấy đến gần hơn với mỗi gia đình Việt, kèm theo câu chuyện của từng vùng.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-[#dfb65c] px-8 py-4 text-sm font-semibold text-[#243219] transition hover:bg-[#ebc975]"
            >
              Khám phá sản phẩm
              {arrow}
            </Link>
            <Link
              href="/stories"
              className="inline-flex items-center gap-3 border border-white/40 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Đọc câu chuyện
            </Link>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-[-1px]">
          <RidgeDivider fill="#f8f5ec" />
        </div>
      </section>

      {/* BA MIỀN */}
      <section className="mx-auto max-w-[1400px] px-7 py-16 lg:px-10 lg:py-24">
        <div className="max-w-[640px]">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#b08b43]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8c7040]">Ba miền đặc sản</span>
          </div>
          <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight text-[#344723] md:text-[42px]">
            Mỗi vùng đất một hương vị riêng
          </h2>
        </div>

        <div className="mt-12 grid gap-7 lg:grid-cols-3">
          {REGIONS.map((region) => (
            <article key={region.theme} className="group flex flex-col overflow-hidden border border-[#e1daca] bg-[#fbf8ef]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#1c3b26]">
                <LandscapeScene theme={region.theme} />
                <div className="absolute left-5 top-5 flex items-center gap-2 bg-black/30 px-3.5 py-2 text-[12px] font-medium text-white backdrop-blur-sm">
                  <ThemeIcon theme={region.theme} className="h-4 w-4" />
                  {region.theme === "highland" ? "Cao nguyên" : region.theme === "forest" ? "Rừng đất đỏ" : "Biển"}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-serif text-[24px] font-semibold text-[#344723]">{region.title}</h3>
                <p className="mt-3 flex-1 text-[15px] leading-7 text-[#676a5b]">{region.text}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {region.places.map((place) => (
                    <Link
                      key={place}
                      href={`/products?q=${encodeURIComponent(place)}`}
                      className="border border-[#d9d1bf] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#4d513e] transition hover:border-[#344723] hover:text-[#344723]"
                    >
                      {place}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CÁCH CHÚNG TÔI LÀM */}
      <section className="relative overflow-hidden bg-[#243219] text-white">
        <ContourPattern className="pointer-events-none absolute -left-24 top-1/2 h-[130%] -translate-y-1/2" stroke="#dfb65c" opacity={0.18} />
        <div className="relative mx-auto max-w-[1400px] px-7 py-20 lg:px-10 lg:py-28">
          <div className="max-w-[620px]">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#dfb65c]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#e8c97a]">Từ vùng đất đến bàn ăn</span>
            </div>
            <h2 className="mt-4 font-serif text-[34px] font-semibold leading-tight md:text-[42px]">
              Chúng tôi làm việc như thế nào
            </h2>
          </div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t border-white/20 pt-6">
                <span className="font-serif text-[44px] font-semibold leading-none text-[#dfb65c]/90">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-serif text-[21px] font-semibold">{step.title}</h3>
                <p className="mt-3 text-[14px] leading-7 text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* LỜI MỜI ĐỌC CÂU CHUYỆN */}
      <section className="relative overflow-hidden bg-[#10303a]">
        <LandscapeScene theme="sea" />
        <div className="absolute inset-0 bg-[#0a1f19]/55" />
        <div className="relative mx-auto max-w-[900px] px-7 py-24 text-center lg:py-32">
          <h2 className="font-serif text-[34px] font-semibold leading-tight text-white md:text-[44px]">
            Mỗi sản phẩm đều có một câu chuyện
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-8 text-white/80">
            Đọc về những vùng đất, những mùa vụ và đôi tay làm nên hương vị bạn đang thưởng thức.
          </p>
          <Link
            href="/stories"
            className="mt-9 inline-flex items-center gap-3 bg-[#dfb65c] px-8 py-4 text-sm font-semibold text-[#243219] transition hover:bg-[#ebc975]"
          >
            Xem câu chuyện đặc sản
            {arrow}
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}