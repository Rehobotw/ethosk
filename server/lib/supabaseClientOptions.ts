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

  // #region agent log
  fetch("http://127.0.0.1:7633/ingest/c9e0799e-dbd9-4f3c-a083-52abf8426277", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "fc5c0e" },
    body: JSON.stringify({
      sessionId: "fc5c0e",
      runId: "pre-fix",
      hypothesisId: "A,B",
      location: "server/lib/supabaseClientOptions.ts:serverSupabaseClientOptions",
      message: "Resolving server Supabase client options",
      data: {
        nodeVersion: process.versions.node,
        hasNativeWebSocket,
        willUseWsTransport: !hasNativeWebSocket,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
