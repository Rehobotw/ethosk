import { createHash } from "node:crypto";
import { env } from "../env.js";
import { admin } from "./supabase.js";

export type ConsentEventType =
  | "document_upload"
  | "survey_response"
  | "data_erasure_request"
  | "fayda_verification";

/**
 * Writes the consent audit trail that maps onto the data-subject-rights language
 * in Proclamation 1321/2024 (§17.7). Every document upload, survey response, and
 * Fayda verification must produce one of these rows.
 *
 * Logged rather than thrown on failure: losing the audit row is a problem worth
 * surfacing, but it must not roll back the user's actual action.
 */
export async function recordConsentEvent(
  userId: string,
  eventType: ConsentEventType,
  details: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await admin.from("consent_events").insert({
    user_id: userId,
    event_type: eventType,
    details,
  });

  if (error) {
    console.error(`[consent] failed to record ${eventType} for ${userId}:`, error.message);
  }
}

/**
 * Hashes a national ID with a server-side pepper. Enough to detect duplicate
 * registrations without ever retaining the sensitive value itself (§17.6).
 */
export function hashNationalId(nationalId: string): string {
  return createHash("sha256").update(`${env.nationalIdPepper}:${nationalId.trim()}`).digest("hex");
}
