# Hướng dẫn dùng Postman cho API Đặc Sản Lâm Đồng

Bộ Postman này gồm **78 request** và hơn **200 phép kiểm tra tự động**: đăng nhập 3 vai trò, giỏ hàng, đặt hàng, xử lý đơn, quản trị sản phẩm / bài viết / tài khoản, và thử các trường hợp sai (thiếu quyền, dữ liệu xấu).

## Bước 0: Chuẩn bị
1. Chạy website: mở terminal trong thư mục dự án, gõ `npm run dev` (địa chỉ mặc định `http://localhost:3000`).
2. Database đã nhập `sqldoan-moi.sql` (và `database/migration-hardening.sql`). Tài khoản mẫu, mật khẩu đều là `123456`:
   - Khách: `khacha@gmail.com`
   - Nhân viên: `staff@dacsanlamdong.vn`
   - Admin: `admin@dacsanlamdong.vn`

## Bước 1: Nhập (Import) vào Postman
1. Mở Postman → bấm **Import** (góc trên bên trái).
2. Kéo thả **cả 2 file** trong thư mục `docs/postman/`:
   - `DacSanLamDong.postman_collection.json`
   - `Local.postman_environment.json`
3. Bạn sẽ thấy bộ **"Đặc Sản Lâm Đồng - API"** ở thanh bên trái (tab *Collections*) và environment **"Local (localhost:3000)"** (tab *Environments*).

## Bước 2: Chọn môi trường
Góc trên bên phải Postman có ô chọn environment (mặc định ghi *No Environment*) → chọn **Local (localhost:3000)**.

> Nếu website của bạn chạy cổng khác (ví dụ 3001), mở tab *Environments* → Local → sửa giá trị `baseUrl` → Save.

## Bước 3: Chạy thử một request
1. Mở thư mục **1. Công khai** → request **Danh sách sản phẩm** → bấm **Send**.
2. Bên dưới sẽ hiện phản hồi JSON, mã `200 OK`. Chuyển sang tab **Test Results** để xem các dấu ✔ PASS.

## Bước 4: Chạy TOÀN BỘ tự động (cách nhanh nhất để demo)
1. Bấm chuột phải vào bộ **Đặc Sản Lâm Đồng - API** → **Run collection** (hoặc nút ▶ Run).
2. Trong cửa sổ Runner, **bỏ tick thư mục "7. Thủ công"** (thư mục này cần Gmail / chọn file ảnh nên không chạy tự động).
3. Bấm **Run Đặc Sản Lâm Đồng - API**.
4. Postman chạy lần lượt từng request, cuối cùng hiện bảng tổng kết. **Kết quả đúng: toàn bộ PASS, 0 Failed.**

Thư mục chạy theo thứ tự, và Postman tự giữ cookie đăng nhập:

| Thư mục | Nội dung |
|---|---|
| 1. Công khai | Sản phẩm, câu chuyện, chatbot (không cần đăng nhập) |
| 2. Xác thực & đăng ký | Các trường hợp đăng nhập / đăng ký / quên mật khẩu **sai** phải bị từ chối đúng cách |
| 3. Khách hàng | Đăng nhập khách → giỏ hàng → đặt hàng → hủy đơn |
| 4. Quản trị: nhân viên | Đăng nhập nhân viên → thống kê, xử lý đơn chuyển khoản, tạo / sửa / ẩn sản phẩm và bài viết |
| 5. Quản trị: admin | Đăng nhập admin → quản lý tài khoản, xóa sản phẩm / bài viết |
| 6. Kiểm thử phân quyền | Khách cố vào trang quản trị phải bị chặn (403); sau đăng xuất phải bị chặn (401) |
| 7. Thủ công | Gửi OTP qua email, tải ảnh: tự chạy từng cái khi cần |

> Có thể chạy lại bao nhiêu lần tùy ý. Mỗi lần chạy tự tạo rồi tự dọn dữ liệu thử (sản phẩm, bài viết, đơn hủy).

## Bước 5: Lưu kết quả cho báo cáo
- Sau khi chạy xong, chụp màn hình bảng tổng kết (số Passed / Failed).
- Hoặc bấm **Export Results** để lưu file kết quả đính kèm báo cáo.

## Bước 6 (tùy chọn): Xem tài liệu dạng Swagger
1. Vào https://editor.swagger.io
2. Menu **File → Import file** → chọn `docs/openapi.yaml`.
3. Bên phải hiện tài liệu đầy đủ: mô tả từng endpoint, dữ liệu gửi lên, các mã phản hồi và ví dụ.

## Các request thủ công (thư mục 7)
- **Đăng ký / Quên mật khẩu (gửi OTP):** cần điền `GMAIL_USER`, `GMAIL_APP_PASSWORD` trong `.env`. Đổi email trong body thành email thật của bạn, bấm Send, lấy mã trong hộp thư rồi gọi tiếp request xác thực OTP.
- **Tải ảnh lên:** đăng nhập nhân viên trước (chạy request "Đăng nhập (nhân viên)" ở thư mục 4), mở request tải ảnh → tab **Body** → ô `file` đổi kiểu thành **File** → chọn ảnh JPG/PNG/WEBP ≤ 3MB → Send.

## Xử lý sự cố thường gặp
| Hiện tượng | Cách xử lý |
|---|---|
| `Could not get response` / ECONNREFUSED | Website chưa chạy hoặc sai `baseUrl`. Chạy `npm run dev` |
| Nhiều request báo 401 | Chưa chạy request đăng nhập của thư mục đó. Hãy chạy cả thư mục theo thứ tự thay vì chạy lẻ |
| Đăng nhập báo 423 (khóa) | Gõ sai mật khẩu 5 lần sẽ khóa 15 phút. Mở khóa bằng SQL: `UPDATE users SET failed_attempts=0, locked_until=NULL;` |
| "Không tìm thấy quy cách còn hàng" | Request đầu tiên không tìm được sản phẩm còn ≥ 20 hàng. Nhập thêm tồn kho hoặc chạy lại `sqldoan-moi.sql` |
