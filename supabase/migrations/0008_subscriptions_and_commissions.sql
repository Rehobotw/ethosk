-- Subscriptions and Commissions
-- Adds platform_fee_etb to respondent_payouts, creates researcher_charges, and recreates wallet views.

-- 1. Respondent Commissions
ALTER TABLE respondent_payouts
  ADD COLUMN IF NOT EXISTS platform_fee_etb numeric(12,2) not null default 0 check (platform_fee_etb >= 0);

-- Recreate respondent_wallet_view to deduct platform_fee_etb
CREATE OR REPLACE VIEW respondent_wallet_view AS
  SELECT
    users.id AS respondent_id,
    COALESCE(SUM(CASE WHEN respondent_payouts.status = 'available'
                 THEN respondent_payouts.amount_etb - COALESCE(respondent_payouts.platform_fee_etb, 0) END), 0) AS available_etb,
    COALESCE(SUM(CASE WHEN respondent_payouts.status = 'withdrawn'
                 THEN respondent_payouts.amount_etb - COALESCE(respondent_payouts.platform_fee_etb, 0) END), 0) AS withdrawn_etb,
    COALESCE(SUM(respondent_payouts.amount_etb - COALESCE(respondent_payouts.platform_fee_etb, 0)), 0) AS lifetime_etb,
    COUNT(respondent_payouts.id) AS paid_response_count
  FROM users
  LEFT JOIN respondent_payouts ON respondent_payouts.respondent_id = users.id
  WHERE users.role = 'respondent'
  GROUP BY users.id;

-- 2. Researcher Charges (Subscriptions)
CREATE TABLE IF NOT EXISTS researcher_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_etb numeric(12,2) NOT NULL CHECK (amount_etb > 0),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charges_researcher ON researcher_charges (researcher_id);

-- Recreate researcher_wallet_view to subtract charges from available balance
CREATE OR REPLACE VIEW researcher_wallet_view AS
  SELECT
    users.id AS researcher_id,
    COALESCE(deposits.total, 0) AS deposited_etb,
    COALESCE(reserved.total, 0) AS reserved_etb,
    COALESCE(paid.total, 0) AS paid_etb,
    COALESCE(charges.total, 0) AS fees_etb,
    COALESCE(deposits.total, 0) - COALESCE(reserved.total, 0) - COALESCE(paid.total, 0) - COALESCE(charges.total, 0)
      AS available_etb
  FROM users
  LEFT JOIN (
    SELECT researcher_id, SUM(amount_etb) AS total
    FROM researcher_deposits WHERE status = 'completed' GROUP BY researcher_id
  ) deposits ON deposits.researcher_id = users.id
  LEFT JOIN (
    SELECT researcher_id, SUM(escrow_etb) AS total
    FROM surveys WHERE status = 'active' GROUP BY researcher_id
  ) reserved ON reserved.researcher_id = users.id
  LEFT JOIN (
    SELECT researcher_id, SUM(amount_etb) AS total
    FROM respondent_payouts GROUP BY researcher_id
  ) paid ON paid.researcher_id = users.id
  LEFT JOIN (
    SELECT researcher_id, SUM(amount_etb) AS total
    FROM researcher_charges GROUP BY researcher_id
  ) charges ON charges.researcher_id = users.id
  WHERE users.role = 'researcher';

-- Add RLS for researcher_charges
ALTER TABLE researcher_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "researcher reads own charges" ON researcher_charges;
CREATE POLICY "researcher reads own charges" ON researcher_charges
  FOR SELECT USING (auth.uid() = researcher_id);
