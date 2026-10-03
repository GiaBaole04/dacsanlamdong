// Tạo chuỗi mã QR chuyển khoản theo chuẩn VietQR (Napas 247).
// Mã tạo ra quét được bằng MoMo và ứng dụng của nhiều ngân hàng, tự điền sẵn
// số tài khoản, số tiền và nội dung. Không cần dịch vụ bên ngoài.

const NAPAS_GUID = "A000000727";

function tlv(tag, value) {
  const text = String(value);

  if (text.length > 99) {
    throw new Error(`Trường ${tag} quá dài`);
  }

  return `${tag}${String(text.length).padStart(2, "0")}${text}`;
}

// CRC-16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF) — mã kiểm tra ở cuối chuỗi QR
export function crc16(text) {
  let crc = 0xffff;

  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;

    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Nội dung chuyển khoản chỉ nên gồm chữ không dấu, số, khoảng trắng (nhiều ngân hàng loại bỏ ký tự lạ)
export function sanitizeTransferContent(text, maxLength = 25) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

// Nội dung chuyển khoản của 1 đơn hàng, ví dụ đơn 42 -> "DS000042"
export function orderTransferContent(orderId) {
  return `DS${String(orderId).padStart(6, "0")}`;
}

/**
 * @param bin            Mã BIN 6 số của ngân hàng nhận tiền (ví dụ MB Bank = 970422)
 * @param accountNumber  Số tài khoản nhận tiền
 * @param amount         Số tiền (đồng, số nguyên). Bỏ trống thì khách tự nhập số tiền
 * @param content        Nội dung chuyển khoản
 */
export function buildVietQR({ bin, accountNumber, amount, content }) {
  if (!/^\d{6}$/.test(String(bin ?? ""))) {
    throw new Error("Mã BIN ngân hàng phải gồm đúng 6 chữ số.");
  }

  if (!/^[0-9A-Za-z]{1,19}$/.test(String(accountNumber ?? ""))) {
    throw new Error("Số tài khoản không hợp lệ (tối đa 19 ký tự, chỉ gồm chữ và số).");
  }

  const hasAmount = amount !== undefined && amount !== null && Number(amount) > 0;

  if (hasAmount && (!Number.isInteger(Number(amount)) || String(amount).length > 13)) {
    throw new Error("Số tiền phải là số nguyên (đồng).");
  }

  const beneficiary = tlv("00", bin) + tlv("01", accountNumber);
  const merchantInfo = tlv("00", NAPAS_GUID) + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");

  let payload =
    tlv("00", "01") + // phiên bản
    tlv("01", hasAmount ? "12" : "11") + // 12 = mã động (có sẵn số tiền), 11 = mã tĩnh
    tlv("38", merchantInfo) +
    tlv("53", "704"); // VND

  if (hasAmount) {
    payload += tlv("54", String(Number(amount)));
  }

  payload += tlv("58", "VN");

  const purpose = sanitizeTransferContent(content);

  if (purpose) {
    payload += tlv("62", tlv("08", purpose));
  }

  payload += "6304";

  return payload + crc16(payload);
}