// Báo cho công cụ tìm kiếm không lập chỉ mục các trang riêng tư hoặc không có nội dung công khai.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/cart", "/checkout", "/orders", "/login", "/register", "/forgot-password"],
      },
    ],
  };
}
