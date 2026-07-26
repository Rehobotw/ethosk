/**
 * telebirr payment adapter.
 *
 * Covers the H5 / web checkout flow: the server creates an order, telebirr
 * returns a URL to send the payer to, and telebirr later calls back to say what
 * happened. The callback — not the browser returning from checkout — is what
 * credits money, because a redirect can be forged, abandoned, or replayed.
 *
 * WIRE FORMAT CAVEAT: telebirr has shipped several API generations (H5 web pay,
 * SuperApp mini-app, and the newer payment gateway), and the endpoint path and
 * field casing differ between them. Every wire-level detail is confined to
 * `buildOrderFields` and `CHECKOUT_PATH` below so it can be corrected in one
 * place against the merchant pack issued with your credentials. The signing,
 * verification, and idempotency logic around it does not change between
 * generations.
 */
import { createHash, createSign, createVerify, publicEncrypt, randomUUID, constants } from "node:crypto";
import { env } from "../../env.js";

/** Result of asking telebirr to open a checkout. */
export interface TelebirrCheckout {
  /** Where to send the payer's browser. */
  checkoutUrl: string;
  /** Our order number, echoed back on the callback. */
  outTradeNo: string;
  /** True when no credentials are configured and this is the local demo flow. */
  demo: boolean;
}

/** A payment result telebirr has told us about, once it is proven authentic. */
export interface TelebirrNotification {
  outTradeNo: string;
  /** telebirr's own transaction number, kept for reconciliation. */
  tradeNo: string;
  amountEtb: number;
  paid: boolean;
}

export class TelebirrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelebirrError";
  }
}

export function isTelebirrConfigured(): boolean {
  return Boolean(
    env.telebirrBaseUrl &&
      env.telebirrAppId &&
      env.telebirrAppKey &&
      env.telebirrShortCode &&
      env.telebirrPublicKey &&
      env.telebirrPrivateKey,
  );
}

/**
 * Whether payment can be exercised at all: either for real, or through the demo
 * flow that stands in for it when credentials are absent.
 */
export function isTelebirrAvailable(): boolean {
  return isTelebirrConfigured() || env.allowTelebirrDemo;
}

/** Path appended to the configured base URL. See the wire-format caveat above. */
const CHECKOUT_PATH = "/service-openup/toTradeWebPay";

/**
 * An order number of our own making, unique per deposit.
 *
 * This is the key the callback is matched against, and it doubles as the
 * `reference` on the deposit row — which carries a unique constraint per
 * researcher, so a replayed callback cannot create a second credit.
 */
export function newOutTradeNo(): string {
  return `ETHOSK-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

interface CheckoutRequest {
  outTradeNo: string;
  amountEtb: number;
  subject: string;
  /** Where telebirr sends the payer after checkout. */
  returnUrl: string;
  /** Public URL telebirr posts the result to. */
  notifyUrl: string;
}

/**
 * The order fields telebirr expects. Confirm names and casing against your
 * merchant pack — this is the one place they appear.
 */
function buildOrderFields(request: CheckoutRequest): Record<string, string> {
  return {
    appId: env.telebirrAppId!,
    appKey: env.telebirrAppKey!,
    shortCode: env.telebirrShortCode!,
    nonce: randomUUID().replace(/-/g, ""),
    outTradeNo: request.outTradeNo,
    // telebirr expects a decimal string, not a number.
    totalAmount: request.amountEtb.toFixed(2),
    subject: request.subject,
    notifyUrl: request.notifyUrl,
    returnUrl: request.returnUrl,
    receiveName: env.telebirrReceiveName ?? "Ethosk",
    timeoutExpress: "30",
    timestamp: String(Date.now()),
  };
}

export async function createCheckout(request: CheckoutRequest): Promise<TelebirrCheckout> {
  if (!isTelebirrConfigured()) {
    if (!env.allowTelebirrDemo) {
      throw new TelebirrError("telebirr is not configured on this server.");
    }
    return demoCheckout(request);
  }

  const fields = buildOrderFields(request);
  const body = {
    appid: env.telebirrAppId,
    sign: signFields(fields),
    sign_type: "SHA256WithRSA",
    // The order itself travels RSA-encrypted under telebirr's public key.
    ussd: encryptForTelebirr(JSON.stringify(fields)),
  };

  const response = await fetchWithTimeout(`${trimSlash(env.telebirrBaseUrl!)}${CHECKOUT_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new TelebirrError(`telebirr rejected the order (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as {
    code?: number | string;
    message?: string;
    data?: { toPayUrl?: string };
  };

  const checkoutUrl = payload.data?.toPayUrl;
  if (!checkoutUrl) {
    throw new TelebirrError(payload.message ?? "telebirr returned no checkout URL.");
  }

  return { checkoutUrl, outTradeNo: request.outTradeNo, demo: false };
}

/**
 * Reads a callback from telebirr and reports what it says, or throws if it
 * cannot be proven to have come from telebirr.
 *
 * The amount here is *not* authoritative for crediting — the caller compares it
 * against the amount recorded when the order was created, so a tampered callback
 * cannot inflate a deposit.
 */
export function readNotification(payload: Record<string, unknown>): TelebirrNotification {
  const outTradeNo = str(payload.outTradeNo ?? payload.out_trade_no);
  const tradeNo = str(payload.tradeNo ?? payload.trade_no);
  const status = str(payload.tradeStatus ?? payload.trade_status).toLowerCase();
  const amount = Number(str(payload.totalAmount ?? payload.total_amount));

  if (!outTradeNo) throw new TelebirrError("Callback carried no order number.");

  if (isTelebirrConfigured()) {
    if (!verifyNotificationSignature(payload)) {
      throw new TelebirrError("Callback signature did not verify.");
    }
  } else if (!env.allowTelebirrDemo) {
    throw new TelebirrError("telebirr is not configured on this server.");
  }

  return {
    outTradeNo,
    tradeNo: tradeNo || outTradeNo,
    amountEtb: Number.isFinite(amount) ? amount : 0,
    // Anything that is not an explicit success is treated as not paid.
    paid: status === "success" || status === "completed" || status === "paid",
  };
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/**
 * telebirr signs the parameters sorted by key, joined as `k=v&k=v`, with `sign`
 * and empty values excluded. Both directions use that same canonical form.
 */
export function canonicalize(fields: Record<string, unknown>): string {
  return Object.keys(fields)
    .filter((key) => key !== "sign" && key !== "sign_type" && key !== "signType")
    .filter((key) => fields[key] !== undefined && fields[key] !== null && fields[key] !== "")
    .sort()
    .map((key) => `${key}=${String(fields[key])}`)
    .join("&");
}

function signFields(fields: Record<string, unknown>): string {
  const signer = createSign("RSA-SHA256");
  signer.update(canonicalize(fields), "utf8");
  return signer.sign(normalizeKey(env.telebirrPrivateKey!, "PRIVATE"), "base64");
}

export function verifyNotificationSignature(payload: Record<string, unknown>): boolean {
  const signature = str(payload.sign);
  if (!signature) return false;

  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(canonicalize(payload), "utf8");
    return verifier.verify(normalizeKey(env.telebirrPublicKey!, "PUBLIC"), signature, "base64");
  } catch {
    return false;
  }
}

/**
 * RSA-encrypts in blocks.
 *
 * An order payload is comfortably longer than one RSA block, and a single
 * `publicEncrypt` call would throw on anything past `keySize - 11` bytes under
 * PKCS#1 v1.5. Blocks are concatenated as base64 segments joined by `|`, which is
 * how telebirr's own SDKs frame them.
 */
function encryptForTelebirr(plaintext: string): string {
  const key = normalizeKey(env.telebirrPublicKey!, "PUBLIC");
  const blockSize = telebirrKeyBytes() - 11;
  const source = Buffer.from(plaintext, "utf8");
  const segments: string[] = [];

  for (let offset = 0; offset < source.length; offset += blockSize) {
    const chunk = source.subarray(offset, offset + blockSize);
    segments.push(
      publicEncrypt({ key, padding: constants.RSA_PKCS1_PADDING }, chunk).toString("base64"),
    );
  }

  return segments.join("|");
}

/** Block size of the configured public key, defaulting to 2048-bit. */
function telebirrKeyBytes(): number {
  const bits = env.telebirrKeyBits;
  return Math.floor(bits / 8);
}

/**
 * Accepts a key with or without PEM armour and with escaped newlines.
 *
 * Environment files routinely carry keys as a single line with `\n` sequences, or
 * as bare base64 copied out of a merchant portal. Both are repaired here so a
 * working key is not rejected over formatting.
 */
export function normalizeKey(raw: string, kind: "PUBLIC" | "PRIVATE"): string {
  const value = raw.replace(/\\n/g, "\n").trim();
  if (value.includes("-----BEGIN")) return value;

  const body = value.replace(/\s+/g, "").replace(/(.{64})/g, "$1\n").trim();
  const label = kind === "PUBLIC" ? "PUBLIC KEY" : "PRIVATE KEY";
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}

// ---------------------------------------------------------------------------
// Demo flow
// ---------------------------------------------------------------------------

/**
 * Stands in for telebirr when no credentials are configured, so the deposit
 * journey can be demonstrated end to end.
 *
 * Points at a local page that posts the callback the real gateway would have
 * sent. Gated on `ALLOW_TELEBIRR_DEMO`, which must be false anywhere real money
 * is involved — it authorises a credit with no payment behind it.
 */
function demoCheckout(request: CheckoutRequest): TelebirrCheckout {
  const params = new URLSearchParams({
    reference: request.outTradeNo,
    amount: request.amountEtb.toFixed(2),
  });

  return {
    checkoutUrl: `${trimSlash(env.siteUrl)}/researcher/wallet/telebirr-demo?${params.toString()}`,
    outTradeNo: request.outTradeNo,
    demo: true,
  };
}

/** Digest of a demo callback, so the demo path is at least tamper-evident. */
export function demoSignature(outTradeNo: string, amountEtb: number): string {
  return createHash("sha256")
    .update(`${outTradeNo}:${amountEtb.toFixed(2)}:${env.nationalIdPepper}`)
    .digest("hex");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.telebirrTimeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new TelebirrError(aborted ? "telebirr did not respond in time." : "telebirr is unreachable.");
  } finally {
    clearTimeout(timer);
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
