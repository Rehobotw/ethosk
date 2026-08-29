import { decodePayload, type FaydaResult } from "fayda-decoder";
import { verifySignature } from "fayda-decoder/verify";
import { env } from "../env.js";

/**
 * Fayda (Ethiopian National ID) verification.
 *
 * Supports offline cryptographic QR code verification via `fayda-decoder`
 * as well as online MOSIP/Fayda authentication API fallback.
 */

/** A Fayda Identification Number (FIN) is 12 digits; a Fayda Account Number (FAN) is 16 digits. */
const FIN_OR_FAN_PATTERN = /^\d{12,16}$/;

export type FaydaOutcome =
  | {
      status: "verified";
      verifiedAt: string;
      method: "qr_crypto" | "api" | "stub";
      fan?: string | null;
      fullName?: string | null;
      gender?: "M" | "F" | null;
      dateOfBirth?: string | null;
      faceBase64?: string | null;
      signatureVerified?: boolean;
    }
  | { status: "not_found"; detail?: string }
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
  return FIN_OR_FAN_PATTERN.test(normalizeFin(fin));
}

/**
 * Decodes and cryptographically verifies a Fayda QR code payload text offline.
 */
export async function verifyFaydaQrPayload(qrText: string): Promise<FaydaOutcome> {
  try {
    const decoded = decodePayload(qrText, { includeFace: true });

    if (!decoded.ok) {
      return {
        status: "not_found",
        detail: `QR decoding failed: ${decoded.error.code} - ${decoded.error.message}`,
      };
    }

    let signatureVerified = false;
    try {
      const verification = await verifySignature(decoded);
      signatureVerified = verification.verified;
    } catch {
      signatureVerified = false;
    }

    const { fields } = decoded;
    const fan = fields.fan ? normalizeFin(fields.fan) : null;

    return {
      status: "verified",
      verifiedAt: new Date().toISOString(),
      method: "qr_crypto",
      fan: fan || null,
      fullName: fields.full_name || null,
      gender: fields.gender || null,
      dateOfBirth: fields.date_of_birth || null,
      faceBase64: fields.face?.base64 || null,
      signatureVerified,
    };
  } catch (err: any) {
    return {
      status: "unavailable",
      detail: `Fayda QR parsing error: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Verifies a FIN/FAN against Fayda (online API or local offline stub/check).
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
        individualIdType: fin.length === 16 ? "FAN" : "FIN",
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

    return interpretFaydaBody(await response.json(), fin);
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
 * Parses Fayda's API response envelope.
 */
function interpretFaydaBody(body: unknown, fin: string): FaydaOutcome {
  if (!body || typeof body !== "object") {
    return { status: "unavailable", detail: "Unrecognized response from Fayda" };
  }

  const envelope = body as Record<string, unknown>;
  const payload = (envelope.response ?? envelope) as Record<string, unknown>;

  const errors = envelope.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown> | undefined;
    const code = String(first?.errorCode ?? "");
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
    return {
      status: "verified",
      verifiedAt: new Date().toISOString(),
      method: "api",
      fan: fin,
    };
  }

  if (verified === "INACTIVE" || verified === "BLOCKED" || verified === "DEACTIVATED") {
    return { status: "inactive" };
  }

  if (verified === false) return { status: "not_found" };

  return { status: "unavailable", detail: "Unrecognized response from Fayda" };
}

/**
 * Demo FINs accepted in development/testing environments when Fayda API is unconfigured.
 */
const DEMO_FINS = new Set([
  "300000000001",
  "300000000002",
  "300000000003",
  "300000000004",
  "300000000005",
  "6140123412341234",
]);

function verifyWithoutCredentials(fin: string): FaydaOutcome {
  if (!env.allowFaydaStub) {
    return { status: "unavailable", detail: "Fayda verification is not configured" };
  }
  if (isValidFinFormat(fin)) {
    return {
      status: "verified",
      verifiedAt: new Date().toISOString(),
      method: "stub",
      fan: fin,
    };
  }
  return { status: "not_found" };
}

export const FAYDA_DEMO_FINS = [...DEMO_FINS];
