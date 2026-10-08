// Quy tắc chuyển trạng thái đơn hàng. Dùng chung cho giao diện (hiện nút nào)
// và API (kiểm tra lại lần nữa ở máy chủ, không tin giao diện).

export const NEXT_STATUS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const STATUS_ACTION = {
  processing: { label: "Xác nhận đơn", tone: "primary" },
  shipped: { label: "Giao cho đơn vị vận chuyển", tone: "primary" },
  delivered: { label: "Đã giao thành công", tone: "primary" },
  cancelled: { label: "Hủy đơn", tone: "danger" },
};

/**
 * Kiểm tra có được chuyển đơn sang trạng thái `to` không.
 * Trả về chuỗi lỗi (tiếng Việt) nếu không được, hoặc null nếu hợp lệ.
 * order: { status, paymentMethod, paymentStatus }
 */
export function checkTransition(order, to) {
  const allowed = NEXT_STATUS[order.status];

  if (!allowed) {
    return "Trạng thái hiện tại của đơn không hợp lệ.";
  }

  if (!allowed.includes(to)) {
    return "Không thể chuyển đơn sang trạng thái này từ trạng thái hiện tại.";
  }

  if (to === "processing" && order.paymentMethod === "bank" && order.paymentStatus !== "paid") {
    return "Đơn chuyển khoản cần xác nhận đã nhận tiền trước khi xử lý.";
  }

  return null;
}