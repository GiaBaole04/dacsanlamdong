// Quy tắc dữ liệu bài viết "Câu chuyện đặc sản". Dùng chung cho form quản trị (báo lỗi ngay)
// và API (kiểm tra lại ở máy chủ).

const COVER_PATH = /^\/images\/(products|stories)\/[A-Za-z0-9._-]+$/;

// Tạo đường dẫn đẹp từ tiêu đề: "Cầu Đất: cà phê trong sương" -> "cau-dat-ca-phe-trong-suong"
export function slugify(text) {
  const slug = String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || "bai-viet";
}

// Tóm tắt tự động từ đoạn văn đầu tiên (bỏ tiêu đề, trích dẫn, danh sách)
export function deriveExcerpt(content, maxLength = 180) {
  const chunks = String(content ?? "").split(/\n\s*\n/);
  const first = chunks
    .map((c) => c.trim())
    .find((c) => c && !c.startsWith("## ") && !c.startsWith("> ") && !c.startsWith("- "));

  if (!first) return "";

  const flat = first.replace(/\s+/g, " ");

  if (flat.length <= maxLength) return flat;

  const cut = flat.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");

  return `${cut.slice(0, lastSpace > 80 ? lastSpace : maxLength).replace(/[,;:.\s]+$/, "")}…`;
}

export function validateStoryInput(input = {}) {
  const errors = {};

  const title = String(input.title ?? "").trim().replace(/\s+/g, " ");
  const excerpt = String(input.excerpt ?? "").trim();
  const region = String(input.region ?? "").trim();
  const coverUrl = String(input.coverUrl ?? "").trim();
  const content = String(input.content ?? "").replace(/\r\n/g, "\n").trim();
  const isPublished = input.isPublished === undefined ? true : Boolean(input.isPublished);

  if (title.length < 3 || title.length > 200) {
    errors.title = "Tiêu đề cần từ 3 đến 200 ký tự.";
  }

  if (excerpt.length > 400) {
    errors.excerpt = "Tóm tắt tối đa 400 ký tự.";
  }

  if (region.length > 150) {
    errors.region = "Khu vực tối đa 150 ký tự.";
  }

  if (coverUrl && !COVER_PATH.test(coverUrl)) {
    errors.coverUrl = "Ảnh bìa phải được tải lên bằng nút tải ảnh (đường dẫn dạng /images/...).";
  }

  if (content.length > 20000) {
    errors.content = "Nội dung tối đa 20.000 ký tự.";
  } else if (isPublished && content.length < 50) {
    errors.content = "Bài được đăng cần có nội dung (ít nhất 50 ký tự). Hãy lưu thành bản nháp nếu chưa viết xong.";
  }

  return { errors, values: { title, excerpt, region, coverUrl, content, isPublished } };
}