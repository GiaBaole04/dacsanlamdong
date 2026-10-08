// Kiểm tra dữ liệu sản phẩm. Dùng chung cho form quản trị (báo lỗi ngay)
// và API (kiểm tra lại ở máy chủ).

const IMAGE_PATH = /^\/images\/products\/[A-Za-z0-9._-]+$/;

export function validateProductInput(input = {}) {
  const errors = {};

  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  const description = String(input.description ?? "").trim();
  const region = String(input.region ?? "").trim();
  const imageUrl = String(input.imageUrl ?? "").trim();
  const categoryId = Number(input.categoryId);
  const isActive = input.isActive === undefined ? true : Boolean(input.isActive);

  if (name.length < 2 || name.length > 255) {
    errors.name = "Tên sản phẩm cần từ 2 đến 255 ký tự.";
  }

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    errors.categoryId = "Chọn danh mục cho sản phẩm.";
  }

  if (description.length > 2000) {
    errors.description = "Mô tả tối đa 2000 ký tự.";
  }

  if (region.length > 150) {
    errors.region = "Khu vực tối đa 150 ký tự.";
  }

  if (imageUrl && !IMAGE_PATH.test(imageUrl)) {
    errors.imageUrl = "Đường dẫn ảnh phải có dạng /images/products/ten-anh.jpg (hãy dùng nút tải ảnh lên).";
  }

  const rawVariants = Array.isArray(input.variants) ? input.variants : [];
  const variants = [];
  const seen = new Set();

  if (rawVariants.length < 1 || rawVariants.length > 20) {
    errors.variants = "Sản phẩm cần có từ 1 đến 20 quy cách.";
  } else {
    for (const [index, raw] of rawVariants.entries()) {
      const variantName = String(raw?.name ?? "").trim().replace(/\s+/g, " ");
      const price = Number(raw?.price);
      const stock = Number(raw?.stock);
      const id = raw?.id === undefined || raw?.id === null || raw?.id === "" ? null : Number(raw.id);
      const row = index + 1;

      if (variantName.length < 1 || variantName.length > 100) {
        errors.variants = `Quy cách thứ ${row}: nhập tên quy cách (ví dụ 250g, 1kg, chai 500ml).`;
        break;
      }

      if (seen.has(variantName.toLowerCase())) {
        errors.variants = `Quy cách "${variantName}" bị trùng tên.`;
        break;
      }
      seen.add(variantName.toLowerCase());

      if (!Number.isInteger(price) || price < 1 || price > 999999999) {
        errors.variants = `Quy cách "${variantName}": giá phải là số nguyên đồng từ 1 trở lên.`;
        break;
      }

      if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
        errors.variants = `Quy cách "${variantName}": tồn kho phải là số nguyên từ 0 trở lên.`;
        break;
      }

      if (id !== null && (!Number.isInteger(id) || id < 1)) {
        errors.variants = `Quy cách "${variantName}" có mã không hợp lệ.`;
        break;
      }

      variants.push({ id, name: variantName, price, stock });
    }
  }

  return {
    errors,
    values: { name, categoryId, description, region, imageUrl, isActive, variants },
  };
}