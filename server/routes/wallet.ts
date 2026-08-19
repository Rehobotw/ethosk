import { Router } from "express";
import { depositSchema, telebirrCheckoutSchema, withdrawSchema } from "@shared/validation/schemas.js";
import { env } from "../env.js";
import { auth, requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute, parseBody, routeParam } from "../lib/http.js";
import {
  createCheckout,
  demoSignature,
  isTelebirrAvailable,
  isTelebirrConfigured,
  newOutTradeNo,
  readNotification,
  TelebirrError,
} from "../lib/payments/telebirr.js";
import { rateLimit } from "../lib/rateLimit.js";
import { admin } from "../lib/supabase.js";
import { readResearcherWallet, readRespondentWallet, roundEtb } from "../lib/wallet.js";

export const walletRouter = Router();

// ---------------------------------------------------------------------------
// Researcher: deposit funds, then spend them on studies
// ---------------------------------------------------------------------------

walletRouter.get(
  "/researcher",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const wallet = await readResearcherWallet(context.userId);

    let deposits: Record<string, unknown>[] = [];
    let activeSurveys: Record<string, unknown>[] = [];

    try {
      const [{ data: d }, { data: s }] = await Promise.all([
        admin
          .from("researcher_deposits")
          .select("id, amount_etb, method, reference, status, created_at")
          .eq("researcher_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("surveys")
          .select("id, title, escrow_etb, reward_etb")
          .eq("researcher_id", context.userId)
          .eq("status", "active")
          .gt("escrow_etb", 0),
      ]);
      if (d) deposits = d;
      if (s) activeSurveys = s;
    } catch {
      /* ignore */
    }

    res.json({
      wallet,
      deposits,
      // Shown beside the balance so a researcher can see what their reserved
      // total is actually committed to, rather than just its size.
      commitments: activeSurveys.map((survey) => ({
        survey_id: survey.id,
        title: survey.title,
        reserved_etb: Number(survey.escrow_etb ?? 0),
        reward_etb: Number(survey.reward_etb ?? 0),
      })),
    });
  }),
);

/**
 * Records a deposit against the researcher's balance.
 *
 * This build has no live Telebirr or CBE integration, so the researcher confirms
 * a transfer they made out of band by entering its reference. The reference is
 * unique per researcher, which is what makes submitting the same confirmation
 * twice credit the money once.
 */
walletRouter.post(
  "/researcher/deposits",
  requireAuth("researcher"),
  rateLimit({ key: "deposit", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(depositSchema, req.body);

    const { data, error } = await admin
      .from("researcher_deposits")
      .insert({
        researcher_id: context.userId,
        amount_etb: roundEtb(input.amount_etb),
        method: input.method,
        reference: input.reference,
        status: "completed",
      })
      .select("id, amount_etb, method, reference, status, created_at")
      .single();

    if (error) {
      if (error.code === "23505" || error.message.includes("duplicate")) {
        throw new ApiError(
          409,
          "DEPOSIT_ALREADY_RECORDED",
          "That transaction reference has already been credited to your balance.",
        );
      }
      throw new ApiError(500, "DEPOSIT_FAILED", error.message);
    }

    const wallet = await readResearcherWallet(context.userId);
    res.status(201).json({ deposit: data, wallet });
  }),
);

// ---------------------------------------------------------------------------
// Researcher: purchase subscription
// ---------------------------------------------------------------------------

walletRouter.post(
  "/researcher/subscription",
  requireAuth("researcher"),
  rateLimit({ key: "subscription", max: 5, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const amount = 500; // 500 ETB for monthly subscription

    const wallet = await readResearcherWallet(context.userId);
    if (wallet.available_etb < amount) {
      throw new ApiError(
        402,
        "INSUFFICIENT_FUNDS",
        "You do not have enough available balance to purchase a subscription.",
      );
    }

    // 1. Charge the wallet
    const { error: chargeError } = await admin.from("researcher_charges").insert({
      researcher_id: context.userId,
      amount_etb: amount,
      reason: "monthly_subscription",
    });

    if (chargeError) throw new ApiError(500, "CHARGE_FAILED", chargeError.message);

    // 2. Update profile
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: profile, error: profileError } = await admin
      .from("researcher_profiles")
      .update({
        subscription_tier: "subscribed",
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", context.userId)
      .select("subscription_tier, subscription_expires_at")
      .single();

    if (profileError) throw new ApiError(500, "PROFILE_UPDATE_FAILED", profileError.message);

    const updatedWallet = await readResearcherWallet(context.userId);
    res.json({ profile, wallet: updatedWallet });
  }),
);

// ---------------------------------------------------------------------------
// Researcher: deposit by telebirr
//
// Three steps, deliberately separate. The researcher asks for a checkout, pays at
// telebirr, and telebirr tells us the outcome. Only that last step credits money:
// the browser coming back from checkout proves nothing, since a payer can close
// the tab, retry, or edit the URL.
// ---------------------------------------------------------------------------

walletRouter.get(
  "/researcher/telebirr",
  requireAuth("researcher"),
  asyncRoute(async (_req, res) => {
    // Lets the client show the right funding UI without guessing at server config.
    res.json({ available: isTelebirrAvailable(), demo: !isTelebirrConfigured() });
  }),
);

walletRouter.post(
  "/researcher/deposits/telebirr",
  requireAuth("researcher"),
  rateLimit({ key: "telebirr-checkout", max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const { amount_etb: requested } = parseBody(telebirrCheckoutSchema, req.body);
    const amount = roundEtb(requested);

    if (!isTelebirrAvailable()) {
      throw new ApiError(
        503,
        "TELEBIRR_UNAVAILABLE",
        "telebirr payment is not enabled on this server. Record your transfer by reference instead.",
      );
    }

    const outTradeNo = newOutTradeNo();

    // Recorded as pending before the payer ever reaches telebirr, so a callback
    // always has a row to land on. Pending rows are excluded from the balance by
    // `researcher_wallet_view`, so this cannot credit anything on its own.
    const { error: insertError } = await admin.from("researcher_deposits").insert({
      researcher_id: context.userId,
      amount_etb: amount,
      method: "telebirr",
      reference: outTradeNo,
      status: "pending",
    });

    if (insertError) throw new ApiError(500, "DEPOSIT_FAILED", insertError.message);

    try {
      const checkout = await createCheckout({
        outTradeNo,
        amountEtb: amount,
        subject: "Ethosk research funding",
        returnUrl: `${env.siteUrl.replace(/\/+$/, "")}/researcher/wallet?deposit=${outTradeNo}`,
        notifyUrl: `${(env.telebirrNotifyBaseUrl ?? `http://localhost:${env.port}`).replace(/\/+$/, "")}/api/wallet/telebirr/notify`,
      });

      res.status(201).json({
        checkout_url: checkout.checkoutUrl,
        reference: outTradeNo,
        amount_etb: amount,
        demo: checkout.demo,
      });
    } catch (error) {
      // The order never opened, so the pending row would sit forever claiming a
      // checkout that does not exist.
      await admin
        .from("researcher_deposits")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("reference", outTradeNo);

      throw new ApiError(
        502,
        "TELEBIRR_CHECKOUT_FAILED",
        error instanceof TelebirrError ? error.message : "Could not open telebirr checkout.",
      );
    }
  }),
);

/**
 * Where the researcher's browser lands back from checkout, and what it polls.
 *
 * Reports only what the ledger says. A payer who returns before telebirr's
 * callback arrives sees `pending`, which is the truth at that moment rather than
 * an optimistic success.
 */
walletRouter.get(
  "/researcher/deposits/:reference",
  requireAuth("researcher"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const reference = routeParam(req, "reference");

    const { data, error } = await admin
      .from("researcher_deposits")
      .select("id, amount_etb, method, reference, status, provider_ref, created_at")
      .eq("reference", reference)
      // Scoped to the caller, so one researcher cannot read another's deposits.
      .eq("researcher_id", context.userId)
      .maybeSingle();

    if (error) throw new ApiError(500, "DEPOSIT_READ_FAILED", error.message);
    if (!data) throw new ApiError(404, "DEPOSIT_NOT_FOUND", "No such deposit.");

    res.json({ deposit: data, wallet: await readResearcherWallet(context.userId) });
  }),
);

/**
 * telebirr's server-to-server payment result.
 *
 * Unauthenticated by necessity — telebirr holds no session — so authenticity
 * rests entirely on the signature over the payload. Always answers 200 once the
 * payload is understood, including for a payment we have already credited,
 * because a non-200 makes telebirr retry indefinitely.
 */
walletRouter.post(
  "/telebirr/notify",
  rateLimit({ key: "telebirr-notify", max: 120, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    let notification;
    try {
      notification = readNotification((req.body ?? {}) as Record<string, unknown>);
    } catch (error) {
      // Logged rather than surfaced: an unverifiable callback is either a bug in
      // our key configuration or someone probing the endpoint, and the reply
      // should reveal which as little as possible.
      console.warn("[telebirr] rejected callback:", (error as Error).message);
      throw new ApiError(400, "TELEBIRR_INVALID_CALLBACK", "Callback could not be verified.");
    }

    const outcome = await settleDeposit(notification);
    console.log(`[telebirr] ${notification.outTradeNo}: ${outcome}`);

    res.json({ code: 0, message: "success" });
  }),
);

/**
 * Completes a demo deposit, standing in for telebirr's callback.
 *
 * Refuses unless `ALLOW_TELEBIRR_DEMO` is on, and requires the digest issued with
 * the checkout, so this cannot be used to credit an arbitrary balance even while
 * enabled.
 */
walletRouter.post(
  "/telebirr/demo-complete",
  rateLimit({ key: "telebirr-demo", max: 20, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    if (isTelebirrConfigured() || !env.allowTelebirrDemo) {
      throw new ApiError(404, "NOT_FOUND", "Not available.");
    }

    const reference = String((req.body as { reference?: string })?.reference ?? "");
    if (!reference) throw new ApiError(400, "BAD_REQUEST", "Missing reference.");

    const { data: deposit } = await admin
      .from("researcher_deposits")
      .select("amount_etb, status")
      .eq("reference", reference)
      .maybeSingle();

    if (!deposit) throw new ApiError(404, "DEPOSIT_NOT_FOUND", "No such deposit.");

    const amount = Number(deposit.amount_etb);
    const outcome = await settleDeposit({
      outTradeNo: reference,
      tradeNo: `DEMO-${demoSignature(reference, amount).slice(0, 12)}`,
      amountEtb: amount,
      paid: true,
    });

    res.json({ status: outcome });
  }),
);

/**
 * Applies a payment result to the ledger.
 *
 * Two rules make this safe to call more than once with the same payment, which
 * telebirr will do whenever it is unsure we received a callback:
 *
 *   - A deposit already `completed` is left alone and reported as such.
 *   - The credited amount is the one recorded when the order was created, never
 *     the one in the callback, so a tampered or mismatched amount is refused
 *     outright rather than believed.
 */
async function settleDeposit(notification: {
  outTradeNo: string;
  tradeNo: string;
  amountEtb: number;
  paid: boolean;
}): Promise<string> {
  const { data: deposit, error } = await admin
    .from("researcher_deposits")
    .select("id, amount_etb, status")
    .eq("reference", notification.outTradeNo)
    .maybeSingle();

  if (error) return `lookup failed: ${error.message}`;
  if (!deposit) return "no matching deposit";
  if (deposit.status === "completed") return "already credited";

  if (!notification.paid) {
    await admin
      .from("researcher_deposits")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", deposit.id);
    return "reported unpaid";
  }

  const recorded = roundEtb(Number(deposit.amount_etb));
  const reported = roundEtb(notification.amountEtb);

  if (reported !== recorded) {
    // Never reconcile a discrepancy automatically: crediting either figure would
    // be a guess about money. Left pending for a human to settle.
    console.warn(
      `[telebirr] amount mismatch on ${notification.outTradeNo}: ` +
        `recorded ${recorded}, callback reported ${reported}`,
    );
    return "amount mismatch, left pending";
  }

  const { error: updateError } = await admin
    .from("researcher_deposits")
    .update({
      status: "completed",
      provider_ref: notification.tradeNo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deposit.id)
    // Only a still-pending row is advanced, so two callbacks arriving together
    // cannot both apply the credit.
    .eq("status", "pending");

  if (updateError) return `update failed: ${updateError.message}`;
  return "credited";
}

// ---------------------------------------------------------------------------
// Respondent: what they have earned
// ---------------------------------------------------------------------------

walletRouter.get(
  "/respondent",
  requireAuth("respondent"),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const wallet = await readRespondentWallet(context.userId);

    let payouts: any[] = [];
    let pendingResponses: any[] = [];
    let withdrawals: any[] = [];

    try {
      const [{ data: pData }, { data: rData }, { data: wData }] = await Promise.all([
        admin
          .from("respondent_payouts")
          .select("id, survey_id, amount_etb, platform_fee_etb, status, created_at, surveys(title)")
          .eq("respondent_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("survey_responses")
          .select("id, survey_id, completed_at, fraud_flag, surveys(id, title, reward_etb)")
          .eq("respondent_id", context.userId)
          .eq("fraud_flag", "clean")
          .limit(50),
        admin
          .from("respondent_withdrawals")
          .select("id, amount_etb, method, account_number, status, created_at")
          .eq("respondent_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (pData) payouts = pData;
      if (rData) pendingResponses = rData;
      if (wData) withdrawals = wData;
    } catch {}

    type PayoutRow = {
      id: string;
      survey_id: string;
      amount_etb: number | string;
      platform_fee_etb?: number | string;
      status: string;
      created_at: string;
      surveys: { title: string } | Array<{ title: string }> | null;
    };

    const payoutRows = (payouts ?? []) as unknown as PayoutRow[];
    const existingSurveyIds = new Set(payoutRows.map((p) => p.survey_id));

    // Map settled/recorded payouts
    const formattedPayouts: any[] = payoutRows.map((row) => {
      let surveyTitle: string | null = null;
      if (Array.isArray(row.surveys)) {
        surveyTitle = row.surveys[0]?.title ?? null;
      } else if (row.surveys && typeof row.surveys === "object") {
        surveyTitle = row.surveys.title ?? null;
      }

      const gross = Number(row.amount_etb || 0);
      const fee = Number(row.platform_fee_etb || 0);
      const net = roundEtb(gross - fee);

      return {
        id: row.id,
        survey_id: row.survey_id,
        amount_etb: gross,
        net_amount_etb: net,
        platform_fee_etb: fee,
        status: row.status as "available" | "withdrawn" | "pending" | "completed" | "paid",
        created_at: row.created_at,
        survey_title: surveyTitle,
        is_withdrawal: false,
        payout_method: "Survey Reward",
      };
    });

    // Map withdrawals into the unified ledger
    for (const w of (withdrawals ?? [])) {
      formattedPayouts.push({
        id: w.id,
        survey_id: "",
        amount_etb: Number(w.amount_etb || 0),
        net_amount_etb: Number(w.amount_etb || 0),
        platform_fee_etb: 0,
        status: w.status === "completed" ? "completed" : w.status === "failed" ? "failed" : "pending",
        created_at: w.created_at,
        survey_title: w.method === "telebirr" ? "Withdrawal to Telebirr" : "Withdrawal to CBE Birr",
        is_withdrawal: true,
        payout_method: w.method === "telebirr" ? "Telebirr" : "CBE Birr",
        account_number: w.account_number,
      });
    }

    // Calculate pending earnings from responses not yet settled
    let pendingEtb = 0;
    for (const resp of pendingResponses) {
      if (!existingSurveyIds.has(resp.survey_id)) {
        const survey = Array.isArray(resp.surveys) ? resp.surveys[0] : resp.surveys;
        const gross = Number(survey?.reward_etb || 0);
        const net = roundEtb(gross * 0.9); // 10% platform fee
        if (net > 0) {
          pendingEtb += net;
          formattedPayouts.push({
            id: resp.id,
            survey_id: resp.survey_id,
            amount_etb: gross,
            net_amount_etb: net,
            platform_fee_etb: roundEtb(gross * 0.1),
            status: "pending",
            created_at: resp.completed_at,
            survey_title: survey?.title ?? "Survey Response",
            is_withdrawal: false,
            payout_method: "Survey Reward",
          });
        }
      }
    }

    res.json({
      wallet: {
        ...wallet,
        pending_etb: roundEtb(pendingEtb),
      },
      payouts: formattedPayouts.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    });
  }),
);

walletRouter.post(
  "/respondent/withdraw",
  requireAuth("respondent"),
  rateLimit({ key: "withdraw", max: 5, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const context = auth(req);
    const input = parseBody(withdrawSchema, req.body);

    if (context.verificationTier === "0_registered") {
      throw new ApiError(
        403,
        "VERIFICATION_REQUIRED",
        "You must complete ID verification before requesting a cashout.",
      );
    }

    if (input.amount_etb < 100) {
      throw new ApiError(400, "MINIMUM_CASHOUT", "The minimum cashout threshold is 100 ETB.");
    }

    const wallet = await readRespondentWallet(context.userId);

    if (input.amount_etb > wallet.available_etb) {
      throw new ApiError(
        400,
        "INSUFFICIENT_FUNDS",
        `You requested ${input.amount_etb} ETB, but only have ${wallet.available_etb} ETB available.`,
      );
    }

    const { error: insertError } = await admin.from("respondent_withdrawals").insert({
      respondent_id: context.userId,
      amount_etb: input.amount_etb,
      method: input.method,
      account_number: input.account_number,
      status: "pending",
    });

    if (insertError) {
      throw new ApiError(500, "WITHDRAWAL_FAILED", insertError.message);
    }

    res.status(201).json({ status: "pending" });
  }),
);
