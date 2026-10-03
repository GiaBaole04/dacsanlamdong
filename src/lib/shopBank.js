// Thông tin tài khoản NHẬN TIỀN của cửa hàng (chỉ dùng ở phía máy chủ).
// Điền trong file .env.local để số tài khoản thật không bị đẩy lên GitHub.
//
//   SHOP_BANK_BIN=970422
//   SHOP_BANK_NAME=MB Bank
//   SHOP_BANK_ACCOUNT=số-tài-khoản-thật
//   SHOP_BANK_ACCOUNT_NAME=TEN CHU TAI KHOAN KHONG DAU
//
// Chưa điền SHOP_BANK_ACCOUNT thì hệ thống dùng tài khoản MẪU (isSample = true)
// và giao diện sẽ cảnh báo "không chuyển tiền thật".

const SAMPLE_BANK = {
  bin: "970422",
  bankName: "MB Bank",
  accountNumber: "0123456789",
  accountName: "DAC SAN LAM DONG",
  isSample: true,
};

export function getShopBank() {
  const accountNumber = (process.env.SHOP_BANK_ACCOUNT || "").trim();

  if (!accountNumber) {
    return SAMPLE_BANK;
  }

  const bin = (process.env.SHOP_BANK_BIN || "").trim();

  if (!/^\d{6}$/.test(bin) || !/^[0-9A-Za-z]{1,19}$/.test(accountNumber)) {
    console.error(
      "Cấu hình tài khoản nhận tiền không hợp lệ: SHOP_BANK_BIN phải gồm 6 số, SHOP_BANK_ACCOUNT chỉ gồm chữ và số."
    );
    return null;
  }

  return {
    bin,
    bankName: (process.env.SHOP_BANK_NAME || "Ngân hàng").trim(),
    accountNumber,
    accountName: (process.env.SHOP_BANK_ACCOUNT_NAME || "").trim().toUpperCase(),
    isSample: false,
  };
}