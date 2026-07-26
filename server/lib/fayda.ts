import { env } from "../env.js";

/**
 * Fayda (Ethiopian National ID) verification.
 *
 * The respondent types their FIN and we ask Fayda whether it is a real, active
 * identity. We deliberately do not retrieve or store demographic data from
 * Fayda — the only thing we need is yes/no, plus a hash of the FIN so the same
 * identity cannot register twice. Everything else stays with the issuer.
 */

/** A Fayda Identification Number is 12 digits. */
const FIN_PATTERN = /^\d{12}$/;

export type FaydaOutcome =
  | { status: "verified"; verifiedAt: string }
  | { status: "not_found" }
  | { status: "inactive" }
  | { status: "unavailable"; detail: string };

export function isFaydaConfigured(): boolean {
  return Boolean(env.faydaBaseUrl && env.faydaApiKey);
}

export function normalizeFin(input: string): string {
  // Operators and respondents commonly type the number in spaced groups.
  return input.replace(/[\s-]/g, "");
}

export function isValidFinFormat(fin: string): boolean {
  return FIN_PATTERN.test(normalizeFin(fin));
}

/**
 * Verifies a FIN against Fayda.
 *
 * Any outcome that is not an explicit confirmation from Fayda returns
 * `unavailable` or `not_found` — never `verified`. A verification failure must
 * never fail open, because the resulting tier is what researchers pay for.
 */
export async function verifyFayda(rawFin: string): Promise<FaydaOutcome> {
  const fin = normalizeFin(rawFin);

  if (!isValidFinFormat(fin)) {
    return { status: "not_found" };
  }

  if (!isFaydaConfigured()) {
    return verifyWithoutCredentials(fin);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.faydaTimeoutMs);

  try {
    const response = await fetch(`${env.faydaBaseUrl!.replace(/\/$/, "")}/idauthentication/v1/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.faydaApiKey}`,
        ...(env.faydaPartnerId ? { "x-partner-id": env.faydaPartnerId } : {}),
      },
      body: JSON.stringify({
        individualId: fin,
        individualIdType: "FIN",
        // We are asserting identity existence only; no KYC attributes requested.
        consentObtained: true,
      }),
      signal: controller.signal,
    });

    if (response.status === 404) return { status: "not_found" };

    if (!response.ok) {
      return {
        status: "unavailable",
        detail: `Fayda returned HTTP ${response.status}`,
      };
    }

    return interpretFaydaBody(await response.json());
  } catch (error) {
    const detail =
      error instanceof Error && error.name === "AbortError"
        ? "Fayda did not respond in time"
        : error instanceof Error
          ? error.message
          : String(error);
    return { status: "unavailable", detail };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fayda's response envelope differs slightly between partner environments, so we
 * read the fields we care about defensively and treat anything unrecognized as
 * unavailable rather than guessing.
 */
function interpretFaydaBody(body: unknown): FaydaOutcome {
  if (!body || typeof body !== "object") {
    return { status: "unavailable", detail: "Unrecognized response from Fayda" };
  }

  const envelope = body as Record<string, unknown>;
  const payload = (envelope.response ?? envelope) as Record<string, unknown>;

  const errors = envelope.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown> | undefined;
    const code = String(first?.errorCode ?? "");
    // MOSIP-family error codes for "no such identity".
    if (code.includes("IDA-MLC-002") || code.toLowerCase().includes("invalid_id")) {
      return { status: "not_found" };
    }
    return {
      status: "unavailable",
      detail: String(first?.errorMessage ?? "Fayda rejected the request"),
    };
  }

  const verified = payload.authStatus ?? payload.verified ?? payload.status;

  if (verified === true || verified === "VERIFIED" || verified === "ACTIVE") {
    return { status: "verified", verifiedAt: new Date().toISOString() };
  }

  if (verified === "INACTIVE" || verified === "BLOCKED" || verified === "DEACTIVATED") {
    return { status: "inactive" };
  }

  if (verified === false) return { status: "not_found" };

  return { status: "unavailable", detail: "Unrecognized response from Fayda" };
}

/**
 * Demo FINs, accepted only when Fayda is unconfigured *and* the stub is enabled.
 *
 * These are reserved test-range numbers, not real identities. With the stub off
 * an unconfigured integration reports `unavailable`, so a misconfigured
 * deployment refuses verification instead of handing out verified tiers.
 */
const DEMO_FINS = new Set([
  "300000000001",
  "300000000002",
  "300000000003",
  "300000000004",
  "300000000005",
]);

function verifyWithoutCredentials(fin: string): FaydaOutcome {
  if (!env.allowFaydaStub) {
    return { status: "unavailable", detail: "Fayda verification is not configured" };
  }
  if (DEMO_FINS.has(fin)) {
    return { status: "verified", verifiedAt: new Date().toISOString() };
  }
  return { status: "not_found" };
}

export const FAYDA_DEMO_FINS = [...DEMO_FINS];
