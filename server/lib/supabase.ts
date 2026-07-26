import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env.js";
import { createMockSupabaseClient } from "./mockSupabaseClient.js";

const isMock =
  !env.supabaseUrl ||
  env.supabaseUrl.includes("placeholder") ||
  env.supabaseServiceRoleKey.includes("dummy") ||
  process.env.USE_MOCK_DB === "true";

if (isMock) {
  console.log("[ethosk] Running in Local Demo Mode with mock Database store.");
}

/**
 * Service-role client. Bypasses RLS, so it is only ever used for operations that
 * legitimately span users.
 */
export const admin: SupabaseClient = isMock
  ? // The mock implements the subset of the client this app actually calls, not
    // the full surface, so it is asserted through `unknown` rather than claiming
    // structural compatibility it does not have.
    (createMockSupabaseClient() as unknown as SupabaseClient)
  : createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

/**
 * A client scoped to one end user's access token.
 */
export function userClient(accessToken: string): SupabaseClient {
  if (isMock) {
    return createMockSupabaseClient() as unknown as SupabaseClient;
  }
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Exchanges a password for a session on a throwaway client.
 */
export function signInWithPassword(email: string, password: string) {
  if (isMock) {
    return createMockSupabaseClient().auth.signInWithPassword({ email, password });
  }
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client.auth.signInWithPassword({ email, password });
}

