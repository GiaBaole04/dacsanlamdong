import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `"Đặc Sản Lâm Đồng" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Mã xác thực đăng ký tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#344723; margin-bottom: 8px;">Xác thực tài khoản Đặc Sản Lâm Đồng</h2>
        <p style="color:#4d513e;">Mã xác thực (OTP) của bạn là:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color:#344723; margin: 16px 0;">${otp}</p>
        <p style="color:#6f715f; font-size: 13px;">Mã có hiệu lực trong <strong>3 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      </div>
    `,
  });
}

export async function sendResetOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `"Đặc Sản Lâm Đồng" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Mã đặt lại mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#344723; margin-bottom: 8px;">Đặt lại mật khẩu Đặc Sản Lâm Đồng</h2>
        <p style="color:#4d513e;">Mã xác thực (OTP) để đặt lại mật khẩu của bạn là:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color:#344723; margin: 16px 0;">${otp}</p>
        <p style="color:#6f715f; font-size: 13px;">Mã có hiệu lực trong <strong>3 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này và không chia sẻ mã cho bất kỳ ai.</p>
      </div>
    `,
  });
}

/* =========================================================
   EMAIL XÁC NHẬN ĐƠN HÀNG
========================================================= */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function vnd(value) {
  return `${Number(value).toLocaleString('vi-VN')}đ`;
}

/**
 * Dựng nội dung email xác nhận đơn hàng (hàm thuần, dễ kiểm tra).
 * order: { id, receiverName, phone, address, note, paymentMethod, shippingFee, total, items: [{ name, variant, quantity, price }] }
 * Mọi chữ do khách nhập (tên, địa chỉ, ghi chú) đều được mã hóa để không chèn được mã HTML vào email.
 */
export function buildOrderEmail(order, siteUrl = '') {
  const code = `DS-${String(order.id).padStart(6, '0')}`;
  const subtotal = Number(order.total) - Number(order.shippingFee);
  const isBank = order.paymentMethod === 'bank';
  const orderLink = siteUrl ? `${siteUrl.replace(/\/$/, '')}/orders/${order.id}` : '';

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee8d8;color:#292c18;">
            ${escapeHtml(item.name)}
            <div style="color:#8c8d7d;font-size:12px;margin-top:2px;">${escapeHtml(item.variant)} × ${Number(item.quantity)}</div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee8d8;text-align:right;color:#754522;white-space:nowrap;">${vnd(Number(item.price) * Number(item.quantity))}</td>
        </tr>`
    )
    .join('');

  const paymentNote = isBank
    ? `<p style="margin:16px 0 0;padding:12px 14px;background:#fbf1d9;border-radius:8px;color:#6b551f;font-size:13px;line-height:20px;">
         Bạn đã chọn <strong>chuyển khoản ngân hàng</strong>. Đơn hàng sẽ được xử lý sau khi cửa hàng nhận được tiền.
         Mã QR và nội dung chuyển khoản có ở trang chi tiết đơn hàng${orderLink ? ` (<a href="${escapeHtml(orderLink)}" style="color:#344723;">xem đơn hàng</a>)` : ''}.
       </p>`
    : `<p style="margin:16px 0 0;color:#6f715f;font-size:13px;">Bạn thanh toán bằng tiền mặt khi nhận hàng (COD).</p>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8f5ec;">
      <div style="background:#ffffff;border:1px solid #e4dfd2;border-radius:12px;padding:28px;">
        <h2 style="color:#344723;margin:0 0 6px;">Cảm ơn bạn đã đặt hàng!</h2>
        <p style="color:#4d513e;margin:0 0 20px;font-size:14px;">Đơn hàng <strong>${code}</strong> của bạn đã được ghi nhận.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>

        <table style="width:100%;margin-top:14px;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:3px 0;color:#6f715f;">Tạm tính</td><td style="text-align:right;">${vnd(subtotal)}</td></tr>
          <tr><td style="padding:3px 0;color:#6f715f;">Phí vận chuyển</td><td style="text-align:right;">${Number(order.shippingFee) === 0 ? 'Miễn phí' : vnd(order.shippingFee)}</td></tr>
          <tr><td style="padding:8px 0 0;font-weight:bold;color:#344723;">Tổng cộng</td><td style="padding:8px 0 0;text-align:right;font-weight:bold;color:#9b7130;font-size:16px;">${vnd(order.total)}</td></tr>
        </table>

        <div style="margin-top:22px;padding-top:16px;border-top:1px solid #eee8d8;font-size:13px;line-height:20px;color:#4d513e;">
          <div><strong>Người nhận:</strong> ${escapeHtml(order.receiverName)}</div>
          <div><strong>Điện thoại:</strong> ${escapeHtml(order.phone)}</div>
          <div><strong>Địa chỉ:</strong> ${escapeHtml(order.address)}</div>
          ${order.note ? `<div><strong>Ghi chú:</strong> ${escapeHtml(order.note)}</div>` : ''}
        </div>

        ${paymentNote}
      </div>
      <p style="text-align:center;color:#8c8d7d;font-size:12px;margin:16px 0 0;">Đặc Sản Lâm Đồng. Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>`;

  return { subject: `Xác nhận đơn hàng ${code}`, html };
}

/**
 * Gửi email xác nhận đơn hàng. Chưa cấu hình GMAIL_USER thì bỏ qua (trả về false),
 * nên môi trường chưa có mail vẫn đặt hàng bình thường.
 */
export async function sendOrderConfirmationEmail(to, order) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('mail: chưa cấu hình GMAIL_USER/GMAIL_APP_PASSWORD, bỏ qua email xác nhận đơn hàng.');
    return false;
  }

  const { subject, html } = buildOrderEmail(order, process.env.SITE_URL || '');

  await transporter.sendMail({
    from: `"Đặc Sản Lâm Đồng" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return true;
}
