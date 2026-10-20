// Đọc nội dung bài viết viết theo cú pháp đơn giản và nhận diện vùng (núi / rừng / biển).
// Mọi thứ được hiển thị bằng React (không dùng HTML thô) nên nội dung do người dùng nhập luôn an toàn.
//
// Cú pháp: các đoạn cách nhau bằng 1 dòng trống.
//   ## Tiêu đề phụ
//   > Câu trích dẫn
//   - Dòng danh sách (mỗi dòng bắt đầu bằng "- ")
// Địa chỉ web (https://...) tự thành liên kết.

export function parseStoryContent(text) {
  const chunks = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  return chunks.map((chunk) => {
    const lines = chunk.split("\n").map((l) => l.trim());

    if (lines.length === 1 && lines[0].startsWith("## ")) {
      return { type: "h2", text: lines[0].slice(3).trim() };
    }

    if (lines.every((l) => l.startsWith("- "))) {
      return { type: "ul", items: lines.map((l) => l.slice(2).trim()) };
    }

    if (lines.every((l) => l.startsWith("> "))) {
      return { type: "quote", text: lines.map((l) => l.slice(2).trim()).join(" ") };
    }

    return { type: "p", text: lines.join(" ") };
  });
}

// Tách đoạn chữ thành các phần "chữ thường" và "liên kết" (chỉ nhận http/https)
export function tokenizeInline(text) {
  const parts = [];
  const pattern = /https?:\/\/[^\s]+/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    let url = match[0];
    // bỏ dấu câu dính ở cuối địa chỉ
    const trailing = url.match(/[).,;:!?]+$/);
    if (trailing) url = url.slice(0, -trailing[0].length);

    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    parts.push({ type: "link", value: url });
    last = match.index + url.length;
    pattern.lastIndex = last;
  }

  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });

  return parts;
}

export function readingMinutes(text) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function plain(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

const SEA = ["phan thiet", "ham thuan", "binh thuan", "mui ne", "ke ga", "tuy phong", "bac binh", "la gi", "ham tan", "phu quy", "bien"];
const FOREST = ["dak", "gia nghia", "tuy duc", "krong no", "cu jut", "nam nung", "bazan", "rung"];

// Khu vực -> kiểu phong cảnh: "sea" (biển), "forest" (rừng đất đỏ), mặc định "highland" (cao nguyên)
export function regionTheme(region) {
  const text = plain(region);

  if (SEA.some((k) => text.includes(k))) return "sea";
  if (FOREST.some((k) => text.includes(k))) return "forest";
  return "highland";
}

export const THEME_LABEL = {
  highland: "Cao nguyên",
  forest: "Rừng đất đỏ",
  sea: "Biển",
};

// Ngày đăng dạng 07/10/2026
export function formatStoryDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}