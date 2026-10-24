/**
 * Cách gọi tên phần "lựa chọn kích cỡ" của sản phẩm trên giao diện khách hàng.
 * Khách hàng không quen từ "quy cách", nên tuỳ tên các lựa chọn mà gọi là
 * "Khối lượng" (250g, 1kg), "Dung tích" (chai 500ml) hoặc "Phân loại" (các trường hợp còn lại).
 */

const WEIGHT = /\d+([.,]\d+)?\s*(g|gr|gam|kg)\b/i;
const VOLUME = /\d+([.,]\d+)?\s*(ml|l|lít)\b/i;

export function variantGroupLabel(variants = []) {
  const names = (variants || []).map((v) => String(v?.variant_name ?? v?.variantName ?? ''));

  if (names.length === 0) return 'Phân loại';
  if (names.every((n) => WEIGHT.test(n))) return 'Khối lượng';
  if (names.every((n) => VOLUME.test(n))) return 'Dung tích';
  return 'Phân loại';
}

/** Rút gọn danh sách lựa chọn để hiện trên thẻ sản phẩm, ví dụ "250g · 500g · 1kg +2". */
export function variantSummary(variants = [], max = 3) {
  const names = (variants || []).map((v) => String(v?.variant_name ?? '')).filter(Boolean);
  if (names.length === 0) return '';

  const shown = names.slice(0, max).join(' · ');
  return names.length > max ? `${shown} +${names.length - max}` : shown;
}
