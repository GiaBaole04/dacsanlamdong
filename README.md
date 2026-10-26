# Đặc Sản Lâm Đồng

Website giới thiệu và bán đặc sản của ba vùng đất Lâm Đồng, Đắk Nông và Bình Thuận, nay hợp nhất thành tỉnh Lâm Đồng (từ 01/07/2025). Đồ án tốt nghiệp, viết bằng JavaScript.

> Sinh viên thực hiện: Lê Huỳnh gia Bảo, K15THO0003, K15THO1

## Tính năng

### Khách hàng
- Đăng ký tài khoản có xác thực email bằng mã OTP, đăng nhập (có "Ghi nhớ đăng nhập"), quên mật khẩu bằng OTP.
- Xem sản phẩm theo danh mục và theo vùng, tìm kiếm, xem chi tiết và chọn khối lượng.
- Giỏ hàng (tự gộp giỏ khi đăng nhập), "Mua ngay", đặt hàng với hai cách thanh toán: tiền mặt khi nhận hàng hoặc chuyển khoản qua mã QR VietQR.
- Phí vận chuyển 30.000đ, miễn phí cho đơn trên 500.000đ. Email xác nhận đơn hàng gửi sau khi đặt.
- Lịch sử đơn hàng, theo dõi trạng thái, hủy đơn khi còn được phép.
- Chuyên mục "Câu chuyện đặc sản" kể về các vùng đất và sản vật.

### Quản trị và nhân viên
- Trang tổng quan thống kê, quản lý đơn hàng, sản phẩm, câu chuyện và (riêng quản trị viên) tài khoản.
- Phân quyền theo vai trò: quản trị viên, nhân viên, khách hàng.

### Gợi ý thông minh
| Tính năng | Cách hoạt động | Mã nguồn |
| --- | --- | --- |
| Sản phẩm tương tự | Độ giống = 45% nội dung chữ (TF-IDF và cosine similarity) + 25% danh mục + 15% vùng + 15% mức giá | `src/lib/similarity.js` |
| Khách mua sản phẩm này cũng mua | Luật kết hợp trên lịch sử đơn hàng: đếm các sản phẩm nằm chung đơn, tính độ tin cậy (confidence) | `src/app/api/products/[id]/also-bought/route.js` |
| Chatbot tư vấn | Gemini nhận câu hỏi cùng danh mục sản phẩm, chỉ trả về mã sản phẩm; tên, ảnh, giá luôn lấy lại từ cơ sở dữ liệu; lọc theo ngân sách; giới hạn số lần hỏi | `src/lib/chatbot.js`, `src/app/api/chat/route.js` |

## Công nghệ
Next.js 16 (App Router), React 19, Tailwind CSS 4, MariaDB (thư viện `mysql2`), `jose` (JWT), `bcryptjs`, `nodemailer` (Gmail), `qrcode`, Google Gemini API.

## Cài đặt và chạy

Yêu cầu: Node.js 20.9 trở lên và MariaDB (hoặc MySQL).

1. Cài thư viện:
   ```
   npm install
   ```
2. Tạo cơ sở dữ liệu `dacsanlamdong` rồi nhập file SQL của đồ án (`sqldoan-moi.sql`, nộp kèm báo cáo). File này tạo các bảng và dữ liệu mẫu. Sau đó chạy tiếp, theo thứ tự (cần MariaDB 10.3 trở lên):
   - `database/migration-hardening.sql`: thêm ràng buộc CHECK (giá, tồn kho, số lượng không âm) và chỉ mục.
   - `database/seed-demo-data.sql` (tùy chọn): thêm khoảng 400 đơn hàng và 30 khách trong 12 tháng gần nhất để trang Thống kê có biểu đồ khi demo. Chạy lại nhiều lần vẫn an toàn.
3. Tạo file `.env` từ mẫu rồi điền giá trị thật:
   ```
   copy .env.example .env
   ```
   (trên macOS/Linux dùng `cp .env.example .env`)
4. Chạy chế độ phát triển:
   ```
   npm run dev
   ```
   Mở http://localhost:3000.
5. Chạy bản chính thức:
   ```
   npm run build
   npm start
   ```

## Tài liệu API
Toàn bộ 40 thao tác của 27 endpoint được mô tả trong thư mục `docs/`:

| File | Dùng để |
|---|---|
| `docs/openapi.yaml` | Tài liệu chuẩn OpenAPI 3 (Swagger). Mở bằng https://editor.swagger.io (File → Import file) để xem và thử API |
| `docs/postman/DacSanLamDong.postman_collection.json` | Bộ request + kiểm thử tự động cho Postman (78 request, 200+ phép kiểm tra) |
| `docs/postman/Local.postman_environment.json` | Biến môi trường cho Postman (địa chỉ server, tài khoản mẫu) |
| `docs/HUONG-DAN-API-POSTMAN.md` | Hướng dẫn từng bước dùng Postman |

Quy ước chung: xác thực bằng cookie `session_token` (cấp bởi `POST /api/auth/login`); ba vai trò `customer`, `staff`, `admin`; mọi lỗi đều là JSON `{ "error": "thông báo tiếng Việt" }` kèm mã HTTP phù hợp (400, 401, 403, 404, 409, 429, 500).

## Biến môi trường

| Biến | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Có | Kết nối cơ sở dữ liệu |
| `JWT_SECRET` | Có | Khóa ký phiên đăng nhập, chuỗi ngẫu nhiên từ 32 ký tự |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Có, để gửi OTP | Tài khoản Gmail và "Mật khẩu ứng dụng" dùng gửi email |
| `SITE_URL` | Không | Địa chỉ website, dùng cho liên kết trong email |
| `SHOP_BANK_NAME`, `SHOP_BANK_BIN`, `SHOP_BANK_ACCOUNT`, `SHOP_BANK_ACCOUNT_NAME` | Không | Thông tin ngân hàng để tạo mã QR chuyển khoản |
| `GEMINI_API_KEY` | Không | Khóa API của Google Gemini; thiếu thì chatbot báo chưa bật, phần còn lại vẫn chạy |
| `GEMINI_MODEL` | Không | Đổi mô hình Gemini (mặc định `gemini-3.5-flash-lite`) |
| `CHAT_IP_LIMIT`, `CHAT_DAILY_LIMIT` | Không | Giới hạn số câu hỏi chatbot |

Không đưa file `.env` lên GitHub. Khóa API chỉ dùng ở phía máy chủ.

## Cấu trúc thư mục

```
src/
  app/            Các trang và API (App Router)
    api/          auth, products, cart, orders, stories, chat, admin
    admin/        Khu vực quản trị và nhân viên
  components/     Header, Footer, ChatWidget, tranh phong cảnh SVG, hiệu ứng
  hooks/          useAuth, useCart
  lib/            Truy cập cơ sở dữ liệu, xác thực, gửi mail, quy tắc đơn hàng, thuật toán gợi ý, chatbot,
                  apiHandler (bọc lỗi cho mọi API), friendlyError (thông báo lỗi thân thiện ở giao diện)
public/           Ảnh sản phẩm và tài nguyên tĩnh
database/         Nâng cấp ràng buộc CSDL và dữ liệu demo (chạy sau file SQL chính)
docs/             Tài liệu API: OpenAPI (Swagger) và Postman collection
```

## Lưu ý và hạn chế
- Chatbot dùng gói miễn phí của Gemini nên có giới hạn lượt dùng, và theo điều khoản gói miễn phí Google có thể dùng nội dung để cải thiện sản phẩm. Chatbot chỉ gửi câu hỏi và danh mục sản phẩm công khai, không gửi thông tin cá nhân.
- Bộ đếm giới hạn số lần hỏi chatbot lưu trong bộ nhớ máy chủ, khởi động lại là đếm lại.
- Gợi ý "cũng mua" cần có đơn hàng; chưa có dữ liệu thì mục này tự ẩn.
