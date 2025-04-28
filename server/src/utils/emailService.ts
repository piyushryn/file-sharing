import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Email service configuration
interface EmailConfig {
  from: string;
  subject: string;
  to: string;
  html: string;
  text?: string;
}

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_API_KEY,
    pass: process.env.EMAIL_API_SECRET,
  },
});

/**
 * Send an email
 * @param config Email configuration
 * @returns Promise resolving to send info
 */
export const sendEmail = async (config: EmailConfig) => {
  try {
    const info = await transporter.sendMail({
      from: config.from || `"File Share App" <${process.env.EMAIL_USER}>`,
      to: config.to,
      subject: config.subject,
      text: config.text || "",
      html: config.html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Send a welcome email to a new user
 * @param email User's email
 * @param name User's name
 * @returns Promise resolving to send info
 */
export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = "Welcome to File Sharing App";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to File Sharing App, ${name}!</h2>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>With our app, you can:</p>
      <ul>
        <li>Share files up to 10GB</li>
        <li>Set expiration dates</li>
        <li>Premium features for file security</li>
      </ul>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Happy sharing!</p>
      <p>Best regards,<br>The File Sharing Team</p>
    </div>
  `;

  return sendEmail({
    from: `${process.env.EMAIL_USER}`,
    to: email,
    subject,
    html,
  });
};

/**
 * Send an email notification when a file is shared
 * @param email Recipient's email
 * @param fileName Name of the shared file
 * @param downloadUrl URL to download the file
 * @param expiresAt Date when the file expires
 * @param senderName Name of the sender (optional)
 * @returns Promise resolving to send info
 */
export const sendFileSharedEmail = async (
  email: string,
  fileName: string,
  downloadUrl: string,
  expiresAt: Date,
  senderName?: string
) => {
  const expiryDate = new Date(expiresAt).toLocaleString();
  const fromText = senderName ? `from ${senderName}` : "";

  const subject = `File Shared: ${fileName} ${fromText}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>A file has been shared with you${fromText}!</h2>
      <p>You have received a file: <strong>${fileName}</strong></p>
      <p>You can download this file using the button below:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${downloadUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Download File
        </a>
      </div>
      <p><strong>Important:</strong> This link will expire on ${expiryDate}.</p>
      <p>If you have any issues accessing the file, please contact our support team.</p>
      <p>Best regards,<br>The File Sharing Team</p>
    </div>
  `;

  return sendEmail({
    from: `${process.env.EMAIL_USER}`,
    to: email,
    subject,
    html,
  });
};

/**
 * Send a payment confirmation email
 * @param email User's email
 * @param amount Payment amount
 * @param currency Currency code
 * @param planName Name of the plan purchased
 * @param transactionId ID of the transaction
 * @returns Promise resolving to send info
 */
export const sendPaymentConfirmationEmail = async (
  email: string,
  amount: number,
  currency: string,
  planName: string,
  transactionId: string
) => {
  const subject = `Payment Confirmation - ${planName} Plan`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Payment Confirmation</h2>
      <p>Thank you for your payment!</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Amount:</strong> ${amount} ${currency}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>Your premium features have been activated and are now available for your use.</p>
      <p>If you have any questions about your payment or subscription, please contact our support team.</p>
      <p>Thank you for choosing our services!</p>
      <p>Best regards,<br>The File Sharing Team</p>
    </div>
  `;

  return sendEmail({
    from: `${process.env.EMAIL_USER}`,
    to: email,
    subject,
    html,
  });
};

/**
 * Send a file expiration notification
 * @param email User's email
 * @param fileName Name of the file
 * @param expiresAt Date when the file expires
 * @returns Promise resolving to send info
 */
export const sendFileExpirationEmail = async (
  email: string,
  fileName: string,
  expiresAt: Date
) => {
  const expiryDate = new Date(expiresAt).toLocaleString();

  const subject = `File Expiration Notice: ${fileName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>File Expiration Notice</h2>
      <p>Your file <strong>${fileName}</strong> will expire soon.</p>
      <p>Expiration date and time: <strong>${expiryDate}</strong></p>
      <p>If you need to keep this file available for longer, you can:</p>
      <ol>
        <li>Log into your account</li>
        <li>Find this file in your uploads</li>
        <li>Extend its availability by upgrading to a premium plan</li>
      </ol>
      <p>Thank you for using our file sharing service!</p>
      <p>Best regards,<br>The File Sharing Team</p>
    </div>
  `;

  return sendEmail({
    from: `${process.env.EMAIL_USER}`,
    to: email,
    subject,
    html,
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendFileSharedEmail,
  sendPaymentConfirmationEmail,
  sendFileExpirationEmail,
};
