import Link from "next/link";
import { ContourPattern, RidgeDivider } from "@/components/Landscape";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  formatPrice,
} from "@/lib/orderUtils";

/* =========================================================
   THÔNG TIN LIÊN HỆ CỦA CỬA HÀNG
   >>> Đổi thành thông tin thật của bạn ở đây. <<<
   Để chuỗi rỗng "" thì dòng đó sẽ tự ẩn khỏi footer.
========================================================= */
const CONTACT = {
  address: "Lâm Đồng, Việt Nam",
  phone: "1900 0000",
  email: "hello@dacsanlamdong.vn",
  hours: "Hỗ trợ 8:00 – 20:00 mỗi ngày",
};

/* =========================================================
   DANH MỤC & VÙNG
   Khớp đúng với dữ liệu trong database (bảng categories và
   cột products.region) vì trang /products lọc theo đúng chữ này.
========================================================= */
const CATEGORIES = [
  "Cà phê",
  "Trà",
  "Trái cây tươi",
  "Mứt / Trái cây sấy",
  "Hạt",
  "Đặc sản khác",
];

const REGIONS = [
  { label: "Đà Lạt", value: "Đà Lạt, Lâm Đồng" },
  { label: "Cầu Đất", value: "Cầu Đất, Lâm Đồng" },
  { label: "Bảo Lộc", value: "Bảo Lộc, Lâm Đồng" },
  { label: "Đắk Song", value: "Đắk Song, Lâm Đồng" },
  { label: "Gia Nghĩa", value: "Gia Nghĩa, Lâm Đồng" },
  { label: "Hàm Thuận Nam", value: "Hàm Thuận Nam, Lâm Đồng" },
  { label: "Phan Thiết", value: "Phan Thiết, Lâm Đồng" },
];

const EXPLORE_LINKS = [
  { href: "/products", label: "Tất cả sản phẩm" },
  { href: "/stories", label: "Câu chuyện đặc sản" },
  { href: "/about", label: "Giới thiệu" },
  { href: "/cart", label: "Giỏ hàng" },
  { href: "/orders", label: "Đơn hàng của tôi" },
];

/* =========================================================
   BIỂU TƯỢNG (SVG nhỏ, không cần thư viện ngoài)
========================================================= */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

function LeafIcon({ className = "h-6 w-6" }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 9-6 10-15Z" />
      <path d="M4 20c3-5 7-8 13-11" />
    </svg>
  );
}

function TruckIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M3 6.5h11v9H3z" />
      <path d="M14 10h4l3 3v2.5h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function QrIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
      <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM18 14h2.5M14 18v2.5" />
    </svg>
  );
}

function MapPinIcon({ className = "h-5 w-5" }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

function PhoneIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M5 4h3.5l1.7 4.2-2.2 1.4a11 11 0 0 0 5.4 5.4l1.4-2.2L19 14.5V18a1.5 1.5 0 0 1-1.6 1.5C9.6 19 5 14.4 4.5 6.6A1.5 1.5 0 0 1 5 4Z" />
    </svg>
  );
}

function MailIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function ArrowUpIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" />
    </svg>
  );
}

/* =========================================================
   CÁC KHỐI NHỎ DÙNG LẠI
========================================================= */
function FooterHeading({ children }) {
  return (
    <div>
      <h3 className="font-serif text-[16px] font-bold text-white">{children}</h3>
      <span className="mt-3 block h-px w-9 bg-[#dfb65c]/70" />
    </div>
  );
}

function FooterLink({ href, children }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-[13.5px] text-white/65 transition hover:text-[#dfb65c]"
    >
      <span className="h-px w-0 bg-[#dfb65c] transition-all duration-300 group-hover:w-3" />
      {children}
    </Link>
  );
}

function PromiseItem({ icon, title, text }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dfb65c]/30 bg-[#dfb65c]/10 text-[#e6bd63]">
        {icon}
      </div>
      <div>
        <div className="font-serif text-[15px] font-semibold text-white">
          {title}
        </div>
        <p className="mt-1 text-[13px] leading-6 text-white/60">{text}</p>
      </div>
    </div>
  );
}

function ContactRow({ icon, children, href }) {
  const content = (
    <>
      <span className="mt-0.5 shrink-0 text-[#dfb65c]">{icon}</span>
      <span>{children}</span>
    </>
  );

  const className =
    "flex items-start gap-3 text-[13.5px] leading-6 text-white/65";

  if (href) {
    return (
      <a href={href} className={`${className} transition hover:text-[#dfb65c]`}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

/* =========================================================
   FOOTER
========================================================= */
// ridge = true: thêm dải núi phía trên footer. Chỉ bật ở trang có NỀN KEM ngay phía trên footer
// (sản phẩm, giỏ hàng, thanh toán, đơn hàng...). Các trang kết thúc bằng khối xanh đậm
// (trang chủ, giới thiệu, câu chuyện) thì để mặc định (tắt) cho liền mạch.
export default function Footer({ ridge = false }) {
  const year = new Date().getFullYear();

  return (
    <div>
      {ridge && <RidgeDivider fill="#172f11" className="-mb-px" />}

      <footer className="relative overflow-hidden bg-[#172f11] text-white">
        {/* Đường vàng mảnh ở mép trên */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#dfb65c]/60 to-transparent" />

        {/* Họa tiết đường đồng mức (địa hình cao nguyên), rất mờ */}
        <ContourPattern
          stroke="#dfb65c"
          opacity={0.09}
          className="pointer-events-none absolute -right-40 top-24 w-[760px] max-w-none"
        />

        <div className="relative mx-auto max-w-[1400px] px-7 lg:px-10">
          {/* ---------- 3 CAM KẾT (lấy từ quy tắc thật của cửa hàng) ---------- */}
          <div className="grid gap-8 border-b border-white/10 py-12 md:grid-cols-3 md:gap-10">
            <PromiseItem
              icon={<TruckIcon />}
              title="Giao hàng tận nơi"
              text={`Phí vận chuyển ${formatPrice(SHIPPING_FEE)}, miễn phí cho đơn trên ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`}
            />
            <PromiseItem
              icon={<QrIcon />}
              title="Thanh toán linh hoạt"
              text="Thanh toán khi nhận hàng (COD) hoặc chuyển khoản nhanh bằng mã QR VietQR."
            />
            <PromiseItem
              icon={<MapPinIcon />}
              title="Nguồn gốc rõ ràng"
              text="Mỗi sản phẩm gắn với một vùng sản xuất cụ thể, từ Cầu Đất, Bảo Lộc đến Phan Thiết."
            />
          </div>

          {/* ---------- NỘI DUNG CHÍNH ---------- */}
          <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.05fr_1fr_1.35fr]">
            {/* THƯƠNG HIỆU */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#28551d] text-[#e6bd63] ring-1 ring-[#dfb65c]/30">
                  <LeafIcon />
                </div>

                <div className="leading-none">
                  <div className="font-serif text-[17px] font-bold tracking-[0.1em]">
                    ĐẶC SẢN
                  </div>
                  <div className="mt-1.5 text-[10px] tracking-[0.27em] text-[#dfb65c]">
                    LÂM ĐỒNG
                  </div>
                </div>
              </Link>

              <p className="mt-7 max-w-[360px] text-[14px] leading-7 text-white/65">
                Mang những sản vật chân thật của cao nguyên Lâm Đồng đến gần hơn
                với mỗi gia đình Việt.
              </p>

              <p className="mt-5 font-serif text-[15px] italic text-[#dfb65c]">
                Gìn giữ hương vị quê nhà.
              </p>
            </div>

            {/* DANH MỤC */}
            <div>
              <FooterHeading>Danh mục</FooterHeading>
              <ul className="mt-6 space-y-3.5">
                {CATEGORIES.map((name) => (
                  <li key={name}>
                    <FooterLink
                      href={`/products?category=${encodeURIComponent(name)}`}
                    >
                      {name}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* ĐẶC SẢN THEO VÙNG */}
            <div>
              <FooterHeading>Đặc sản theo vùng</FooterHeading>
              <ul className="mt-6 space-y-3.5">
                {REGIONS.map((region) => (
                  <li key={region.value}>
                    <FooterLink
                      href={`/products?region=${encodeURIComponent(region.value)}`}
                    >
                      {region.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* KHÁM PHÁ */}
            <div>
              <FooterHeading>Khám phá</FooterHeading>
              <ul className="mt-6 space-y-3.5">
                {EXPLORE_LINKS.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* LIÊN HỆ */}
            <div>
              <FooterHeading>Liên hệ</FooterHeading>
              <div className="mt-6 space-y-4">
                {CONTACT.address && (
                  <ContactRow icon={<MapPinIcon className="h-4 w-4" />}>
                    {CONTACT.address}
                  </ContactRow>
                )}

                {CONTACT.phone && (
                  <ContactRow
                    icon={<PhoneIcon />}
                    href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`}
                  >
                    {CONTACT.phone}
                  </ContactRow>
                )}

                {CONTACT.email && (
                  <ContactRow icon={<MailIcon />} href={`mailto:${CONTACT.email}`}>
                    {CONTACT.email}
                  </ContactRow>
                )}

                {CONTACT.hours && (
                  <ContactRow icon={<ClockIcon />}>{CONTACT.hours}</ContactRow>
                )}
              </div>
            </div>
          </div>

          {/* ---------- THANH BẢN QUYỀN ---------- */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-[12px] text-white/45 sm:flex-row">
            <p>© {year} Đặc Sản Lâm Đồng. Bảo lưu mọi quyền.</p>

            <div className="flex items-center gap-5">
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] tracking-wide text-white/55">
                COD
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] tracking-wide text-white/55">
                VietQR
              </span>

              <a
                href="#"
                className="inline-flex items-center gap-2 text-white/55 transition hover:text-[#dfb65c]"
              >
                Lên đầu trang
                <ArrowUpIcon />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}