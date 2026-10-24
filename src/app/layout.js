import { Lora, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

// Font tiêu đề (có chân, sang trọng)
const lora = Lora({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
});

// Font nội dung: thiết kế riêng cho tiếng Việt nên dấu rõ, dễ đọc ở cỡ chữ nhỏ
const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata = {
  title: "Đặc Sản Lâm Đồng",
  description:
    "Khám phá và mua sắm những đặc sản đến từ các vùng đất Lâm Đồng.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${lora.variable} ${beVietnam.variable}`}>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
