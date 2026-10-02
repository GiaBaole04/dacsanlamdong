// Các hàm dùng chung cho cả giao diện (trình duyệt) lẫn API (máy chủ).
// Đặt quy tắc kiểm tra ở MỘT chỗ để hai bên luôn khớp nhau.

export const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", badge: "bg-[#fbf1d9] text-[#8a6a1a]" },
  processing: { label: "Đang xử lý", badge: "bg-[#e4eefa] text-[#2f5d8f]" },
  shipped: { label: "Đang giao", badge: "bg-[#e8e4f6] text-[#52458f]" },
  delivered: { label: "Đã giao", badge: "bg-[#e3eedc] text-[#3b6a2a]" },
  cancelled: { label: "Đã hủy", badge: "bg-[#f6e3dc] text-[#9a4528]" },
};

export const PAYMENT_LABEL = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank: "Chuyển khoản ngân hàng",
};

// Phí vận chuyển: 30.000đ, miễn phí khi tạm tính trên 500.000đ
export const SHIPPING_FEE = 30000;
export const FREE_SHIPPING_THRESHOLD = 500000;

export function calcShippingFee(subtotal) {
  return Number(subtotal) > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

// THÔNG TIN MẪU để hiển thị hướng dẫn chuyển khoản.
// Khi chạy thật hãy thay bằng tài khoản ngân hàng thật của cửa hàng.
export const BANK_INFO = {
  bankName: "Ngân hàng mẫu (thay bằng ngân hàng thật)",
  accountNumber: "0123456789",
  accountName: "DAC SAN LAM DONG",
};

export const PAYMENT_STATUS_LABEL = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
};

export function formatOrderCode(id) {
  return `DS-${String(id).padStart(6, "0")}`;
}

export function formatPrice(price) {
  const number = Number(price);
  if (!Number.isFinite(number)) return "0đ";
  return `${number.toLocaleString("vi-VN")}đ`;
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const PHONE_REGEX = /^(0|\+84)\d{9}$/;

/**
 * Kiểm tra thông tin giao hàng.
 * Trả về { errors, values }: errors rỗng nghĩa là hợp lệ; values là dữ liệu đã chuẩn hóa.
 */
export function validateShipping(input = {}) {
  const receiverName = String(input.receiverName ?? "").trim().replace(/\s+/g, " ");
  const phone = String(input.phone ?? "").replace(/[\s.\-]/g, "");
  const shippingAddress = String(input.shippingAddress ?? "").trim().replace(/\s+/g, " ");
  const note = String(input.note ?? "").trim();

  const errors = {};

  if (receiverName.length < 2 || receiverName.length > 100) {
    errors.receiverName = "Nhập họ tên người nhận (2–100 ký tự).";
  }
  if (!PHONE_REGEX.test(phone)) {
    errors.phone = "Số điện thoại không hợp lệ (ví dụ 0901234567).";
  }
  if (shippingAddress.length < 10 || shippingAddress.length > 300) {
    errors.shippingAddress =
      "Nhập địa chỉ đầy đủ (số nhà, đường, phường/xã, tỉnh/thành).";
  }
  if (note.length > 500) {
    errors.note = "Ghi chú tối đa 500 ký tự.";
  }

  return { errors, values: { receiverName, phone, shippingAddress, note } };
}