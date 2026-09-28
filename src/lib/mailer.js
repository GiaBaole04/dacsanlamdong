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
