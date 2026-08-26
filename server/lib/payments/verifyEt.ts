/**
 * verify.et payment & transaction reconciliation layer (Spec v4 §4.6.1, §3.5, §7.4 item 12).
 *
 * Reconciles wallet deposits and escrow funding across Ethiopian banks and mobile wallets:
 * Commercial Bank of Ethiopia (CBE), Telebirr, Bank of Abyssinia (BOA), Dashen, Awash,
 * CBE Birr, Siinqee, and Kaafi Ebirr.
 */

import { env } from "../../env.js";
import type { DepositMethod } from "@shared/types.js";

export interface VerifyTransactionParams {
  provider: DepositMethod;
  reference: string;
  expectedAmount: number;
  senderDetail?: string;
  idempotencyKey?: string;
}

export type VerifyStatus =
  | "MATCH"
  | "MISMATCH"
  | "NOT_FOUND"
  | "UNSUPPORTED_PROVIDER"
  | "INVALID_SENDER"
  | "ERROR";

export interface VerifyTransactionResult {
  status: VerifyStatus;
  verified: boolean;
  actualAmount?: number;
  claimedAmount: number;
  providerRef?: string | null;
  sender?: string | null;
  rawResponse?: Record<string, unknown> | null;
  message: string;
  requiresManualReview?: boolean;
}

/**
 * List of providers natively supported by verify.et automated reconciliation API.
 * Providers outside this list (such as generic direct wire/bank_transfer) soft-fail
 * to manual administrative reconciliation.
 */
export const VERIFY_ET_SUPPORTED_PROVIDERS: readonly DepositMethod[] = [
  "telebirr",
  "cbe",
  "cbe_birr",
  "boa",
  "dashen",
  "awash",
  "siinqee",
  "kaafi_ebirr",
] as const;

export function isVerifyEtSupportedProvider(provider: DepositMethod): boolean {
  return VERIFY_ET_SUPPORTED_PROVIDERS.includes(provider);
}

export function isVerifyEtConfigured(): boolean {
  return Boolean(env.verifyEtApiKey && env.verifyEtBaseUrl);
}

/**
 * Verifies a transaction reference against verify.et.
 */
export async function verifyTransaction(
  params: VerifyTransactionParams,
): Promise<VerifyTransactionResult> {
  const { provider, reference, expectedAmount, senderDetail, idempotencyKey } = params;

  // 1. Check if provider is supported by verify.et API
  if (!isVerifyEtSupportedProvider(provider)) {
    return {
      status: "UNSUPPORTED_PROVIDER",
      verified: false,
      claimedAmount: expectedAmount,
      requiresManualReview: true,
      message: `The payment method "${provider}" is not automated via verify.et and has been queued for manual administrative reconciliation.`,
    };
  }

  // 2. If running in live mode (stubs disabled)
  if (!env.allowVerifyEtStub) {
    if (!isVerifyEtConfigured()) {
      return {
        status: "ERROR",
        verified: false,
        claimedAmount: expectedAmount,
        message: "Automated deposit verification is not configured on this server. Please contact support or use local bank transfer.",
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.verifyEtTimeoutMs);

      const response = await fetch(`${env.verifyEtBaseUrl}/transactions/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.verifyEtApiKey}`,
          ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
        },
        body: JSON.stringify({
          provider,
          reference: reference.trim(),
          amount: expectedAmount,
          sender_detail: senderDetail?.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return {
          status: "NOT_FOUND",
          verified: false,
          claimedAmount: expectedAmount,
          message: "Transaction reference was not found on the payment network. Please verify your reference number.",
        };
      }

      if (!response.ok) {
        const errJson = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          status: "ERROR",
          verified: false,
          claimedAmount: expectedAmount,
          rawResponse: errJson,
          message: typeof errJson.message === "string" ? errJson.message : "Verification service returned an error.",
        };
      }

      const data = (await response.json()) as {
        status?: string;
        amount?: number;
        provider_ref?: string;
        sender?: string;
      };

      const actualAmount = typeof data.amount === "number" ? data.amount : expectedAmount;
      const isMatch = Math.abs(actualAmount - expectedAmount) < 0.01;

      if (!isMatch) {
        return {
          status: "MISMATCH",
          verified: false,
          actualAmount,
          claimedAmount: expectedAmount,
          providerRef: data.provider_ref ?? null,
          sender: data.sender ?? null,
          rawResponse: data,
          message: `Transaction record amount (${actualAmount} ETB) does not match claimed amount (${expectedAmount} ETB).`,
        };
      }

      return {
        status: "MATCH",
        verified: true,
        actualAmount,
        claimedAmount: expectedAmount,
        providerRef: data.provider_ref ?? `VET-${reference.trim().toUpperCase()}`,
        sender: data.sender ?? senderDetail ?? null,
        rawResponse: data,
        message: "Transaction verified successfully via verify.et.",
      };
    } catch (err: unknown) {
      // Network/timeout error: soft-fail to manual review rather than dropping
      const isAbort = (err as { name?: string })?.name === "AbortError";
      return {
        status: "UNSUPPORTED_PROVIDER",
        verified: false,
        claimedAmount: expectedAmount,
        requiresManualReview: true,
        message: isAbort
          ? "Verification service timed out. Transaction has been flagged for manual verification."
          : "Verification service temporarily unavailable. Transaction queued for manual review.",
      };
    }
  }

  // 3. Demo / Sandbox Stub Mode (§4.6.1 Sandbox Environment)
  return simulateVerifyEtStub(params);
}

/**
 * Sandbox stub for test suites and development environments.
 */
function simulateVerifyEtStub(params: VerifyTransactionParams): VerifyTransactionResult {
  const ref = params.reference.trim().toUpperCase();

  if (ref.startsWith("NOTFOUND") || ref.startsWith("FAIL") || ref.startsWith("404")) {
    return {
      status: "NOT_FOUND",
      verified: false,
      claimedAmount: params.expectedAmount,
      message: "Transaction reference was not found on the payment network. Please check the reference number and try again.",
    };
  }

  if (ref.startsWith("MISMATCH")) {
    const fakeActual = Math.round(params.expectedAmount * 0.5);
    return {
      status: "MISMATCH",
      verified: false,
      actualAmount: fakeActual,
      claimedAmount: params.expectedAmount,
      providerRef: `VET-${ref}`,
      message: `Transaction record amount (${fakeActual} ETB) does not match claimed deposit (${params.expectedAmount} ETB).`,
    };
  }

  if (ref.startsWith("INVALID")) {
    return {
      status: "INVALID_SENDER",
      verified: false,
      claimedAmount: params.expectedAmount,
      message: "Sender details do not match the account record on file.",
    };
  }

  return {
    status: "MATCH",
    verified: true,
    actualAmount: params.expectedAmount,
    claimedAmount: params.expectedAmount,
    providerRef: `VET-${ref}`,
    sender: params.senderDetail || "Demo Sender",
    rawResponse: { stub: true, verified_at: new Date().toISOString() },
    message: "Transaction verified successfully via verify.et.",
  };
}
