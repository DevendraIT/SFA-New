import transporter from "./transporter.js";
import config from "../../config/env.js";

class EmailService {
  async sendMail({ to, subject, html }) {
    return transporter.sendMail({
      from: `"${config.EMAIL.fromName}" <${config.EMAIL.fromAddress}>`,
      to,
      subject,
      html,
    });
  }

  async sendForgotPasswordEmail(email, resetLink) {
    return this.sendMail({
      to: email,
      subject: "Reset Your Password",
      html: `
        <h2>Reset Password</h2>

        <p>You requested to reset your password.</p>

        <p>
          <a href="${resetLink}">
            Click here to reset your password
          </a>
        </p>

        <p>If you didn't request this, ignore this email.</p>
      `,
    });
  }

  async sendVerificationEmail(email, verificationLink) {
    return this.sendMail({
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Email Verification</h2>

        <p>Please verify your email.</p>

        <a href="${verificationLink}">
            Verify Email
        </a>
      `,
    });
  }

  async sendDeliveryOtpEmail(email, customerName, otp, taskTitle = "Product Delivery") {
    const nameStr = customerName || "Customer";
    return this.sendMail({
      to: email,
      subject: `[IT360 SFA] Delivery Scheduled Today - Your Delivery OTP: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px;">IT360 Sales Force Automation</h2>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Delivery Verification Notice</p>
          </div>
          <div style="padding: 20px 0;">
            <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${nameStr}</strong>,</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.5;">Your product will be delivered today by our Sales Executive / Delivery Representative.</p>
            <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 20px; border-radius: 10px; text-align: center; margin: 24px 0;">
              <p style="color: #9a3412; font-size: 12px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Your Delivery Verification OTP</p>
              <h1 style="color: #ea580c; font-size: 38px; letter-spacing: 6px; margin: 0; font-family: monospace;">${otp}</h1>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Please share this OTP with the Sales Executive and delivery person upon arrival to complete your delivery verification.</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">This is an automated notification from IT360 SFA. Please do not reply directly to this email.</p>
          </div>
        </div>
      `,
    });
  }
}

export default new EmailService();