import { Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
});

export const metadata = {
  title: "Đặc Sản Lâm Đồng",
  description:
    "Khám phá và mua sắm những đặc sản đến từ các vùng đất Lâm Đồng.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={lora.variable}>
      <body>{children}</body>
    </html>
  );
}