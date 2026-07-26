import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env.js";

/**
 * Service-role client. Bypasses RLS, so it is only ever used for operations that
 * legitimately span users: the matching engine reading `respondent_match_view`,
 * the send route writing `survey_targets`, and admin review queries.
 *
 * This module must never be imported from `src/` (the browser bundle).
 */
export const admin: SupabaseClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * A client scoped to one end user's access token. Requests made through it are
 * subject to RLS exactly as they would be from the browser, which is what we
 * want for any read or write that belongs to a single user.
 */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Exchanges a password for a session on a throwaway client.
 *
 * This must never run on `admin`. supabase-js holds the resulting session in
 * memory even when `persistSession` is false, and sends it as the Authorization
 * bearer on every subsequent request from that instance — so a single sign-in
 * would silently downgrade `admin` from service-role to that one user for the
 * rest of the process's life.
 */
export function signInWithPassword(email: string, password: string) {
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client.auth.signInWithPassword({ email, password });
}
