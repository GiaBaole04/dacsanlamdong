// Đổi lỗi kỹ thuật của trình duyệt thành câu tiếng Việt dễ hiểu để hiện cho người dùng.
//  - SyntaxError : máy chủ trả về nội dung không phải JSON (ví dụ "Unexpected end of JSON input")
//  - TypeError   : không kết nối được máy chủ (ví dụ "Failed to fetch": mất mạng, server tắt)
//  - Lỗi khác    : giữ nguyên thông báo tiếng Việt đã được API trả về
export function friendlyError(err, fallback = "Có lỗi xảy ra, vui lòng thử lại sau.") {
  if (err instanceof SyntaxError) {
    return "Máy chủ đang gặp sự cố, vui lòng thử lại sau.";
  }

  if (err instanceof TypeError) {
    return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  }

  const message = String(err?.message ?? "").trim();
  return message || fallback;
}
