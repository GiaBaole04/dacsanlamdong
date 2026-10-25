# PROGRESS.md — Website Đặc Sản Lâm Đồng

> Đọc file này TRƯỚC, rồi chỉ đọc những file liên quan trực tiếp đến yêu cầu. Không đọc cả repo.
> Schema database KHÔNG nằm trên GitHub: người dùng gửi riêng trong chat. Cần tên bảng/cột mà chưa có thì HỎI, không đoán.
> Phần admin và nhân viên (xem mục "Không được sửa") đang do AI khác làm, không chỉnh sửa.

## Đề tài
Website giới thiệu và bán đặc sản Lâm Đồng, tích hợp gợi ý sản phẩm thông minh. Ngôn ngữ: JavaScript.
Stack: Next.js (App Router), React, Tailwind CSS 4, MariaDB (thư viện mysql2). Cấu hình kết nối nằm trong `.env` (không có trên GitHub).
Bối cảnh: từ 01/07/2025 ba tỉnh Lâm Đồng, Đắk Nông, Bình Thuận hợp nhất thành tỉnh Lâm Đồng. Giao diện lấy ý tưởng "ba vùng đất, một Lâm Đồng": cao nguyên, rừng đất đỏ, biển.

## Quy ước
- Màu chủ đạo: xanh rêu `#344723` / `#243219`, vàng `#dfb65c`, nền kem `#f8f5ec`. Tiêu đề font serif (Lora), nội dung Be Vietnam Pro.
- Trang người dùng là client component, lấy dữ liệu qua `/api/...`.
- Tranh phong cảnh vẽ bằng SVG trong `components/Landscape.js` (theme: highland, forest, sea). Hiệu ứng dùng `components/Reveal.js`, `components/CountUp.js` và các lớp CSS trong `app/globals.css`.

## Đã xong
- Đăng ký (OTP email), đăng nhập, đăng xuất, quên mật khẩu (OTP email, tối đa 5 lần nhập sai).
- Trang chủ (hero động, mục ba tỉnh một Lâm Đồng, sản phẩm nổi bật, câu chuyện), giới thiệu, danh sách sản phẩm, chi tiết sản phẩm.
- Giỏ hàng (có gộp giỏ khi đăng nhập), thanh toán (COD hoặc chuyển khoản QR), lịch sử đơn hàng, hủy đơn.
- Câu chuyện đặc sản (danh sách và chi tiết).
- Gợi ý sản phẩm tương tự (TF-IDF + cosine, kết hợp danh mục, vùng, giá): `lib/similarity.js`, hiển thị ở chi tiết sản phẩm.
- Gợi ý "khách mua sản phẩm này cũng mua" (luật kết hợp từ lịch sử đơn): `api/products/[id]/also-bought/route.js`, hiển thị ở chi tiết sản phẩm. Tự ẩn khi chưa có đơn.

- Hoàn thiện: README dự án, `.env.example` (chỉ có tên biến, không có giá trị thật), trang 404 (`app/not-found.js`) và trang lỗi (`app/error.js`), `app/robots.js`, tiêu đề tab riêng cho từng nhóm trang (layout con chỉ có metadata, tiêu đề sản phẩm/câu chuyện lấy từ database), email xác nhận đơn hàng (`lib/mailer.js`, gửi sau khi đặt; chưa cấu hình Gmail thì bỏ qua, không làm hỏng đơn), OTP đăng ký dùng `crypto.randomInt`, `lib/auth.js` báo lỗi rõ khi thiếu `JWT_SECRET`.

## Việc tiếp theo (dự kiến)
- Hoàn thiện báo cáo: giải thích thuật toán gợi ý, ghi rõ dữ liệu đơn hàng mẫu (nếu dùng để demo) là dữ liệu tự tạo.

- Chatbot tư vấn đặc sản dùng Gemini (`api/chat/route.js`, `lib/chatbot.js`, `components/ChatWidget.js`, nút chat nổi gắn trong `app/layout.js`). Mô hình chỉ trả MÃ sản phẩm; tên, ảnh, giá luôn lấy lại từ database. Có lọc ngân sách ("dưới 300 nghìn"), giới hạn số lần hỏi theo IP và theo ngày. Biến môi trường trong `.env` (không có trên GitHub, xem `.env.example`): `GEMINI_API_KEY` (bắt buộc), `GEMINI_MODEL` (tùy chọn, mặc định `gemini-3.5-flash-lite`), `CHAT_IP_LIMIT` và `CHAT_DAILY_LIMIT` (tùy chọn). Khóa API chỉ dùng ở server, không để trong biến `NEXT_PUBLIC_`.

## Cấu trúc `src/` (không gồm admin)
- `app/page.js` trang chủ · `app/about` giới thiệu · `app/products` danh sách + `[id]` chi tiết · `app/stories` câu chuyện + `[slug]`
- `app/cart` · `app/checkout` · `app/orders` + `[id]` · `app/login` · `app/register` · `app/forgot-password`
- `app/api/auth/*` đăng nhập, đăng ký, OTP, quên/đặt lại mật khẩu, `me`, `logout`
- `app/api/products` (danh sách kèm các lựa chọn khối lượng) · `app/api/products/[id]/also-bought` · `app/api/chat` (chatbot Gemini) · `app/api/stories` · `app/api/cart` + `merge` · `app/api/orders` + `[id]` + `[id]/cancel`
- `components/`: `Header`, `Footer`, `UserMenu`, `Landscape` (tranh SVG), `Reveal`, `CountUp`, `StoryCard`, `StoryContent`, `AuthShell` (khung chung trang đăng nhập/đăng ký/quên mật khẩu), `ChatWidget`
- `hooks/`: `useAuth`, `useCart`, `useCartCount`
- `lib/`: `db` (kết nối MariaDB), `auth`, `mailer` (gửi email OTP), `orderRules`, `orderUtils`, `productRules`, `storyRules`, `storyFormat`, `shopBank` + `vietqr` (QR thanh toán), `similarity` (gợi ý tương tự), `chatbot` (logic chatbot), `variantLabel` (cách gọi khối lượng/dung tích)
- `proxy.js` chặn truy cập khu vực quản trị khi chưa đủ quyền

## Không được sửa (AI khác đang làm)
- Toàn bộ `app/admin/**`, `app/api/admin/**`, `components/admin/**`, `lib/adminAuth.js` (trang quản lý, thống kê cho admin và nhân viên).
- Không sửa logic `app/api/orders/**` trừ khi người dùng yêu cầu rõ.

## Cách làm việc
- Không tạo máy ảo, không chạy thử. Chỉ viết code, người dùng tự chạy `npm run dev` và dán lỗi nếu có.
- Mỗi lần giao file: ghi rõ đường dẫn đầy đủ, file nào mới, file nào sửa. Sửa trên bản mới nhất trong repo.
- Cuối mỗi chức năng: cập nhật mục "Đã xong" trong file này.
