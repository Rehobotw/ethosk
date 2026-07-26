import type { ResearcherWallet, RespondentWallet } from "@shared/types.js";
import { ApiError } from "./http.js";
import { admin } from "./supabase.js";

/**
 * Money in Ethosk moves in three recorded steps: a researcher deposits, sending a
 * survey reserves what it could cost, and each accepted response pays a
 * respondent out of that reservation.
 *
 * Balances are always derived from those rows — see `researcher_wallet_view` and
 * `respondent_wallet_view` — so there is no stored total that can disagree with
 * the deposits and payouts that explain it.
 */

/**
 * Postgres `numeric` survives a round trip as a string in some driver versions,
 * because a JSON number cannot represent it without risking precision. Every
 * amount is read through here so a string total can never be concatenated onto
 * another one by accident.
 */
function toAmount(value: unknown): number {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Rounds to cents, so repeated arithmetic cannot accumulate a fractional drift. */
export function roundEtb(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function readResearcherWallet(researcherId: string): Promise<ResearcherWallet> {
  const { data, error } = await admin
    .from("researcher_wallet_view")
    .select("deposited_etb, reserved_etb, paid_etb, available_etb")
    .eq("researcher_id", researcherId)
    .maybeSingle();

  if (error) throw new ApiError(500, "WALLET_READ_FAILED", error.message);

  // A researcher who has never deposited has no row in the view rather than a
  // row of zeros, which is not an error — it is an empty wallet.
  return {
    deposited_etb: toAmount(data?.deposited_etb),
    reserved_etb: toAmount(data?.reserved_etb),
    paid_etb: toAmount(data?.paid_etb),
    available_etb: toAmount(data?.available_etb),
  };
}

export async function readRespondentWallet(respondentId: string): Promise<RespondentWallet> {
  const { data, error } = await admin
    .from("respondent_wallet_view")
    .select("available_etb, withdrawn_etb, lifetime_etb, paid_response_count")
    .eq("respondent_id", respondentId)
    .maybeSingle();

  if (error) throw new ApiError(500, "WALLET_READ_FAILED", error.message);

  return {
    available_etb: toAmount(data?.available_etb),
    withdrawn_etb: toAmount(data?.withdrawn_etb),
    lifetime_etb: toAmount(data?.lifetime_etb),
    paid_response_count: Number(data?.paid_response_count ?? 0),
  };
}

/**
 * Credits a respondent for one accepted response and draws the same amount down
 * from the survey's reservation.
 *
 * The payout row carries a unique constraint on `response_id`, so a retry or a
 * double submission cannot pay twice — the second insert is rejected by the
 * database and reported here as already paid.
 *
 * Called after the response row is already committed. A failure to pay must not
 * undo an answer the respondent gave in good faith, so this reports the problem
 * for logging instead of throwing into the submission response.
 */
export async function payForResponse(input: {
  responseId: string;
  surveyId: string;
  respondentId: string;
  researcherId: string;
  amountEtb: number;
}): Promise<{ paid: boolean; reason?: string }> {
  if (input.amountEtb <= 0) return { paid: false, reason: "unpaid survey" };

  const amount = roundEtb(input.amountEtb);

  const { error } = await admin.from("respondent_payouts").insert({
    response_id: input.responseId,
    survey_id: input.surveyId,
    respondent_id: input.respondentId,
    researcher_id: input.researcherId,
    amount_etb: amount,
    status: "available",
  });

  if (error) {
    const alreadyPaid = error.code === "23505" || error.message.includes("duplicate");
    return { paid: false, reason: alreadyPaid ? "already paid" : error.message };
  }

  await drawDownEscrow(input.surveyId, amount);
  return { paid: true };
}

/**
 * Moves `amount` out of the survey's reservation now that it has actually been
 * paid, keeping the researcher's available balance unchanged: the same birr just
 * stops being reserved and starts being spent.
 *
 * Clamped at zero because a survey that received more responses than it reserved
 * for should not report a negative commitment.
 */
async function drawDownEscrow(surveyId: string, amount: number): Promise<void> {
  const { data, error } = await admin
    .from("surveys")
    .select("escrow_etb")
    .eq("id", surveyId)
    .maybeSingle();

  if (error || !data) return;

  const remaining = Math.max(0, roundEtb(toAmount(data.escrow_etb) - amount));
  await admin.from("surveys").update({ escrow_etb: remaining }).eq("id", surveyId);
}
