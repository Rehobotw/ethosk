import "./loadEnv.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
      return name.includes("URL") ? "http://localhost:54321" : "test-mock-key";
    }
    if (process.env.NODE_ENV !== "production") {
      return name.includes("URL") ? "https://placeholder.supabase.co" : "placeholder-dummy-key";
    }
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function numeric(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: numeric("API_PORT", 4000),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  supabaseUrl: required("VITE_SUPABASE_URL"),
  supabaseAnonKey: required("VITE_SUPABASE_ANON_KEY"),
  /**
   * Server-only. Used exclusively by routes that must legitimately read across
   * users (the matching engine) or write on a respondent's behalf (targeting).
   * Never imported outside `server/` — enforced by `npm run check:service-role`.
   */
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),

  anthropicApiKey: optional("ANTHROPIC_API_KEY"),
  addisAiApiKey: optional("ADDIS_AI_API_KEY"),
  addisAiBaseUrl: process.env.ADDIS_AI_API_BASE_URL ?? "https://api.addisai.com/v1",

  /** Pepper for national-ID hashing, so a leaked hash is not brute-forceable. */
  nationalIdPepper: process.env.NATIONAL_ID_PEPPER ?? "ethosk-dev-pepper",

  fraudMinSecondsPerQuestion: numeric("FRAUD_MIN_SECONDS_PER_QUESTION", 8),
  fraudStraightLineThreshold: numeric("FRAUD_STRAIGHT_LINE_THRESHOLD", 0.7),
  fraudLongTextMinChars: numeric("FRAUD_LONG_TEXT_MIN_CHARS", 80),
  fraudMaxTypingCharsPerSecond: numeric("FRAUD_MAX_TYPING_CHARS_PER_SECOND", 15),
  matchPowerWarningThreshold: numeric("MATCH_POWER_WARNING_THRESHOLD", 20),

  documentsBucket: process.env.SUPABASE_DOCUMENTS_BUCKET ?? "documents",

  /**
   * Fayda (Ethiopian National ID) verification. When `faydaBaseUrl` and
   * `faydaApiKey` are both set, the respondent's FIN is verified against the live
   * Fayda service; otherwise verification is refused rather than assumed.
   */
  faydaBaseUrl: optional("FAYDA_API_BASE_URL"),
  faydaApiKey: optional("FAYDA_API_KEY"),
  faydaPartnerId: optional("FAYDA_PARTNER_ID"),
  faydaTimeoutMs: numeric("FAYDA_TIMEOUT_MS", 10_000),

  /**
   * Lets an unconfigured Fayda integration accept a small set of seeded demo FINs
   * so the flow is demoable without live credentials. Must be false in any real
   * deployment — it is a demo affordance, not an auth path.
   */
  allowFaydaStub: (process.env.ALLOW_FAYDA_STUB ?? "true") === "true",

  /**
   * telebirr merchant credentials. All six are needed for live payment: without
   * them the deposit flow falls back to the demo path below, or to manual
   * reference entry.
   */
  telebirrBaseUrl: optional("TELEBIRR_BASE_URL"),
  telebirrAppId: optional("TELEBIRR_APP_ID"),
  telebirrAppKey: optional("TELEBIRR_APP_KEY"),
  telebirrShortCode: optional("TELEBIRR_SHORT_CODE"),
  /** telebirr's key, used to encrypt the order and verify their callbacks. */
  telebirrPublicKey: optional("TELEBIRR_PUBLIC_KEY"),
  /** Ours, used to sign orders. Server-only, like any private key. */
  telebirrPrivateKey: optional("TELEBIRR_PRIVATE_KEY"),
  telebirrReceiveName: optional("TELEBIRR_RECEIVE_NAME"),
  telebirrKeyBits: numeric("TELEBIRR_KEY_BITS", 2048),
  telebirrTimeoutMs: numeric("TELEBIRR_TIMEOUT_MS", 15_000),
  /**
   * Public base URL telebirr posts payment results to. Must be reachable from the
   * internet, so a tunnel is needed in local development — a callback that cannot
   * arrive leaves every deposit stuck pending.
   */
  telebirrNotifyBaseUrl: optional("TELEBIRR_NOTIFY_BASE_URL"),

  /**
   * Lets an unconfigured telebirr integration complete a deposit through a local
   * simulated checkout, so the funding journey is demoable. Must be false
   * anywhere real money is involved: it credits a balance with no payment behind
   * it.
   */
  allowTelebirrDemo: (process.env.ALLOW_TELEBIRR_DEMO ?? "true") === "true",

  /**
   * verify.et transaction verification credentials (v4 §4.6.1, §3.5, §7.4 item 12).
   * Used server-side to reconcile researcher escrow deposits and
   * respondent payout confirmations across CBE, Telebirr, BOA, Dashen, Awash, etc.
   * If unconfigured in production, deposit transactions are safely refused.
   */
  verifyEtApiKey: optional("VERIFY_ET_API_KEY"),
  verifyEtBaseUrl: process.env.VERIFY_ET_BASE_URL ?? "https://api.verify.et/v1",
  verifyEtTimeoutMs: numeric("VERIFY_ET_TIMEOUT_MS", 10_000),
  /**
   * In production, stubs are strictly disabled so all deposits must be verified
   * via the live verify.et production endpoint. In development/testing, stubs allow
   * local simulation when live API credentials are not set.
   */
  allowVerifyEtStub:
    process.env.NODE_ENV === "production"
      ? (process.env.ALLOW_VERIFY_ET_STUB === "true")
      : (process.env.ALLOW_VERIFY_ET_STUB ?? "true") === "true",

  /**
   * Platform receiving accounts for deposits & verify.et reconciliation.
   */
  receiverTelebirr: process.env.RECEIVER_TELEBIRR_PHONE ?? "0974688397",
  receiverCbe: process.env.RECEIVER_CBE_ACCOUNT ?? "1000307620522",
  receiverCbeBirr: process.env.RECEIVER_CBE_BIRR ?? "0974688397",
  receiverAwash: optional("RECEIVER_AWASH_ACCOUNT"),
  receiverBoa: optional("RECEIVER_BOA_ACCOUNT"),
  receiverDashen: optional("RECEIVER_DASHEN_ACCOUNT"),
} as const;

export const fraudThresholds = {
  minSecondsPerQuestion: env.fraudMinSecondsPerQuestion,
  straightLineThreshold: env.fraudStraightLineThreshold,
  longTextMinChars: env.fraudLongTextMinChars,
  maxTypingCharsPerSecond: env.fraudMaxTypingCharsPerSecond,
};
