import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const BRAND_NAME = process.env.MAIL_BRAND_NAME || "Sport Ecommerce";
const BRAND_LOGO_URL =
  process.env.MAIL_LOGO_URL || process.env.WEBSITE_LOGO_URL || "";
const WEBSITE_URL = process.env.CLIENT_URL || process.env.WEBSITE_URL || "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const getMailContentByPurpose = (purpose = "reset_password") => {
  if (purpose === "sign_up") {
    return {
      subject: "Xác thực đăng ký tài khoản",
      title: "Xác nhận đăng ký tài khoản",
      description:
        "Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhập mã xác thực bên dưới để hoàn tất đăng ký.",
    };
  }

  return {
    subject: "Mã OTP đặt lại mật khẩu",
    title: "Xác thực đặt lại mật khẩu",
    description:
      "Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhập mã xác thực bên dưới để tiếp tục.",
  };
};

const buildOtpTemplate = ({
  otp,
  title,
  description,
  expiresInMinutes = 5,
}) => {
  const logoHtml = BRAND_LOGO_URL
    ? `<img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-height:56px; max-width:200px; object-fit:contain;" />`
    : `<div style="display:inline-block; font-size:22px; font-weight:700; color:#111827;">${BRAND_NAME}</div>`;

  const websiteHtml = WEBSITE_URL
    ? `<p style="font-size:13px; color:#6b7280; margin:16px 0 0;">Website: <a href="${WEBSITE_URL}" style="color:#111827; text-decoration:none;">${WEBSITE_URL}</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;background:#f3f4f6;padding:24px 12px;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:24px 24px 8px;text-align:center;">
          ${logoHtml}
        </div>
        <div style="padding:8px 24px 24px;">
          <h2 style="margin:0 0 12px;font-size:20px;color:#111827;text-align:center;">${title}</h2>
          <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;text-align:center;">
            ${description}
          </p>
          <div style="text-align:center;margin:20px 0;">
            <span style="display:inline-block;letter-spacing:10px;font-size:32px;font-weight:700;color:#111827;padding:10px 18px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb;">
              ${otp}
            </span>
          </div>
          <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
            Mã xác thực có hiệu lực trong ${expiresInMinutes} phút.
          </p>
          <p style="margin:12px 0 0;font-size:13px;color:#6b7280;text-align:center;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.
          </p>
          ${websiteHtml}
        </div>
      </div>
    </div>
  `;
};

const sendEmail = async (to, otp, options = {}) => {
  const { purpose = "reset_password", expiresInMinutes = 5 } = options;
  const { subject, title, description } = getMailContentByPurpose(purpose);

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html: buildOtpTemplate({
        otp,
        title,
        description,
        expiresInMinutes,
      }),
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
