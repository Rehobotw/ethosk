import type { SupabaseClientOptions } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import WebSocket from "ws";

const auth = { autoRefreshToken: false, persistSession: false } as const;

/**
 * Server-side Supabase clients never subscribe to Realtime channels, but
 * `@supabase/supabase-js` still constructs a Realtime client on startup.
 * Node.js only exposes a global WebSocket from v22 onward, so older runtimes
 * need the `ws` transport.
 */
export function serverSupabaseClientOptions(): SupabaseClientOptions<'public'> {
  const hasNativeWebSocket = typeof globalThis.WebSocket !== "undefined";

  if (hasNativeWebSocket) {
    return { auth };
  }

  return {
    auth,
    realtime: {
      transport: WebSocket as unknown as WebSocketLikeConstructor,
    },
  };
}
