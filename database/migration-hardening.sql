-- =========================================================
-- NÂNG CẤP RÀNG BUỘC DỮ LIỆU (ĐẶC SẢN LÂM ĐỒNG)
--
-- CÁCH DÙNG: chạy MỘT lần trong HeidiSQL (hoặc phpMyAdmin) SAU KHI đã import sqldoan-moi.sql.
-- File chạy lại nhiều lần vẫn an toàn (dùng IF NOT EXISTS).
-- Yêu cầu: MariaDB 10.3 trở lên (XAMPP đời mới đều đạt).
--
-- Mục đích: ngoài việc code kiểm tra dữ liệu, chính DATABASE cũng chặn dữ liệu vô lý
-- (giá âm, tồn kho âm, số lượng 0...) dù có ai ghi thẳng vào bảng hoặc code có lỗi.
-- =========================================================

USE dacsanlamdong;

-- 1. Dọn dữ liệu không hợp lệ (nếu có) trước khi thêm ràng buộc, nếu không lệnh ALTER sẽ báo lỗi
UPDATE cart_items SET quantity = 999 WHERE quantity > 999;
DELETE FROM cart_items WHERE quantity < 1;
UPDATE product_variants SET stock = 0 WHERE stock < 0;
UPDATE product_variants SET price = 0 WHERE price < 0;

-- 2. Ràng buộc CHECK
ALTER TABLE product_variants
  ADD CONSTRAINT IF NOT EXISTS chk_variants_price_nonneg CHECK (price >= 0),
  ADD CONSTRAINT IF NOT EXISTS chk_variants_stock_nonneg CHECK (stock >= 0);

ALTER TABLE cart_items
  ADD CONSTRAINT IF NOT EXISTS chk_cart_quantity_range CHECK (quantity BETWEEN 1 AND 999);

ALTER TABLE orders
  ADD CONSTRAINT IF NOT EXISTS chk_orders_total_nonneg CHECK (total_amount >= 0),
  ADD CONSTRAINT IF NOT EXISTS chk_orders_shipping_nonneg CHECK (shipping_fee >= 0);

ALTER TABLE order_items
  ADD CONSTRAINT IF NOT EXISTS chk_order_items_quantity_pos CHECK (quantity >= 1),
  ADD CONSTRAINT IF NOT EXISTS chk_order_items_price_nonneg CHECK (price_at_order >= 0);

-- 3. Chỉ mục giúp trang thống kê và danh sách đơn nhanh hơn khi dữ liệu lớn
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users (role, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_published_created ON stories (is_published, created_at);

-- 4. Kiểm tra nhanh kết quả (hiện danh sách ràng buộc đã có)
SELECT table_name AS bang, constraint_name AS rang_buoc, check_clause AS dieu_kien
FROM information_schema.check_constraints
WHERE constraint_schema = 'dacsanlamdong'
ORDER BY table_name, constraint_name;
