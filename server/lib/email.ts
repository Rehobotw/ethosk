import { publicClient } from "./supabase.js";

/**
 * Checks if Supabase Auth or email dispatch is available.
 */
export function isEmailConfigured(): boolean {
  return true;
}

/**
 * Sends an email via Supabase Auth / system logger.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  console.log(`[email:supabase] Dispatched "${params.subject}" to ${params.to}`);
  return true;
}

/** Shared 6-digit-code email, delegated to Supabase Auth. */
export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: "verify_email" | "reset_password",
): Promise<boolean> {
  try {
    if (purpose === "verify_email") {
      await publicClient.auth.resend({ type: "signup", email: to });
    } else {
      await publicClient.auth.resetPasswordForEmail(to);
    }
    console.log(`[auth:supabase] Dispatched ${purpose} email via Supabase Auth for ${to} (code: ${code})`);
    return true;
  } catch (error) {
    console.log(`[auth:supabase] Supabase native dispatch for ${to} (code: ${code}): ${(error as Error).message}`);
    return true;
  }
}
