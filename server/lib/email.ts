import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env.js";

let transporter: Transporter | null = null;
let loggedMissingConfigWarning = false;

/**
 * True once SMTP_HOST/SMTP_USER/SMTP_PASS are all set. Without all three,
 * `sendEmail` cannot actually deliver anything — it only logs.
 */
export function isEmailConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
}

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

/**
 * Sends an email via the configured SMTP transport. Returns `false` (and never
 * throws) whenever the message could not be delivered, whether SMTP is simply
 * unconfigured or the send itself failed — either way the caller must not
 * assume the recipient received anything.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    if (!loggedMissingConfigWarning) {
      console.warn(
        "[email] SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS) — " +
          "no emails can be delivered. Codes are only visible in the server log.",
      );
      loggedMissingConfigWarning = true;
    }
    console.warn(`[email] Not sent (SMTP unconfigured): "${params.subject}" to ${params.to}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: env.smtpFrom,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error(
      `[email] Failed to send "${params.subject}" to ${params.to}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/** Shared 6-digit-code email, used by signup verification, resend, and password reset. */
export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: "verify_email" | "reset_password",
): Promise<boolean> {
  const subject =
    purpose === "reset_password" ? "Your Ethosk password reset code" : "Your Ethosk verification code";
  const intro =
    purpose === "reset_password"
      ? "Use the code below to reset your Ethosk password."
      : "Use the code below to verify your Ethosk account email address.";

  const text = `${intro}\n\nYour code: ${code}\n\nThis code expires in 15 minutes. If you did not request this, you can safely ignore this email.`;

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #0D253A;">
      <h2 style="margin-bottom: 4px;">Ethosk</h2>
      <p>${intro}</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 24px 0;">${code}</p>
      <p style="color: #64748B; font-size: 12px;">
        This code expires in 15 minutes. If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `.trim();

  return sendEmail({ to, subject, text, html });
}
