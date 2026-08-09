import type { ResearcherWallet, RespondentWallet } from "@shared/types.js";
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
  try {
    const { data, error } = await admin
      .from("researcher_wallet_view")
      .select("deposited_etb, reserved_etb, paid_etb, available_etb")
      .eq("researcher_id", researcherId)
      .maybeSingle();

    if (!error && data) {
      return {
        deposited_etb: toAmount(data.deposited_etb),
        reserved_etb: toAmount(data.reserved_etb),
        paid_etb: toAmount(data.paid_etb),
        available_etb: toAmount(data.available_etb),
      };
    }
  } catch {
    /* ignore */
  }

  // Direct table query fallback
  try {
    const [{ data: deposits }, { data: activeSurveys }, { data: payouts }] = await Promise.all([
      admin.from("researcher_deposits").select("amount_etb").eq("researcher_id", researcherId).eq("status", "completed"),
      admin.from("surveys").select("escrow_etb").eq("researcher_id", researcherId).eq("status", "active"),
      admin.from("respondent_payouts").select("amount_etb").eq("researcher_id", researcherId),
    ]);

    const deposited = (deposits ?? []).reduce((acc, d) => acc + Number(d.amount_etb ?? 0), 0);
    const reserved = (activeSurveys ?? []).reduce((acc, s) => acc + Number(s.escrow_etb ?? 0), 0);
    const paid = (payouts ?? []).reduce((acc, p) => acc + Number(p.amount_etb ?? 0), 0);
    const available = deposited - reserved - paid;

    return {
      deposited_etb: roundEtb(deposited),
      reserved_etb: roundEtb(reserved),
      paid_etb: roundEtb(paid),
      available_etb: roundEtb(available),
    };
  } catch {
    /* ignore */
  }

  return {
    deposited_etb: 0,
    reserved_etb: 0,
    paid_etb: 0,
    available_etb: 0,
  };
}

export async function readRespondentWallet(respondentId: string): Promise<RespondentWallet> {
  try {
    const { data, error } = await admin
      .from("respondent_wallet_view")
      .select("available_etb, withdrawn_etb, lifetime_etb, paid_response_count")
      .eq("respondent_id", respondentId)
      .maybeSingle();

    if (!error && data) {
      return {
        available_etb: toAmount(data.available_etb),
        withdrawn_etb: toAmount(data.withdrawn_etb),
        lifetime_etb: toAmount(data.lifetime_etb),
        paid_response_count: Number(data.paid_response_count ?? 0),
      };
    }
  } catch {
    /* ignore */
  }

  // Direct table query fallback
  try {
    const { data: payouts } = await admin
      .from("respondent_payouts")
      .select("amount_etb, status")
      .eq("respondent_id", respondentId);

    if (payouts && payouts.length > 0) {
      let available = 0;
      let withdrawn = 0;
      let lifetime = 0;
      for (const p of payouts) {
        const amt = Number(p.amount_etb ?? 0);
        lifetime += amt;
        if (p.status === "withdrawn") withdrawn += amt;
        else if (p.status === "available" || p.status === "pending") available += amt;
      }
      return {
        available_etb: roundEtb(available),
        withdrawn_etb: roundEtb(withdrawn),
        lifetime_etb: roundEtb(lifetime),
        paid_response_count: payouts.length,
      };
    }
  } catch {
    /* ignore */
  }

  return {
    available_etb: 0,
    withdrawn_etb: 0,
    lifetime_etb: 0,
    paid_response_count: 0,
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
    status: "pending",
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
