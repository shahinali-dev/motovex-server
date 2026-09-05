import nodemailer, { Transporter } from "nodemailer";
import nunjucks from "nunjucks";
import config from "../../config";

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.APP_EMAIL,
          pass: config.APP_PASSWORD,
        },
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 3,
      });
    }
    return this.transporter;
  }

  // Verify / resend OTP email
  static async sendOTPEmail(
    email: string,
    name: string,
    otp: string,
    isResend: boolean = false
  ): Promise<void> {
    const emailHTML = nunjucks.render("verify-otp-email.html", {
      name,
      otp,
      expiryMinutes: config.OTP_EXPIRES_MIN,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Motovex" <${config.APP_EMAIL}>`,
      to: email,
      subject: isResend
        ? "Resend OTP - Verify your email"
        : "Verify your email - OTP Code",
      html: emailHTML,
    };

    const transporter = this.getTransporter();
    await transporter.sendMail(mailOptions);
  }

  // Password reset OTP email
  static async sendPasswordResetOTPEmail(
    email: string,
    name: string,
    otp: string
  ): Promise<void> {
    const emailHTML = nunjucks.render("password-reset-otp-email.html", {
      name,
      otp,
      expiryMinutes: config.OTP_EXPIRES_MIN,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Motovex" <${config.APP_EMAIL}>`,
      to: email,
      subject: "Reset Your Password - OTP Code",
      html: emailHTML,
    };

    const transporter = this.getTransporter();
    await transporter.sendMail(mailOptions);
  }
}
