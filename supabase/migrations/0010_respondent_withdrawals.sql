-- Respondent Withdrawals

CREATE TABLE IF NOT EXISTS respondent_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_etb numeric(12,2) NOT NULL CHECK (amount_etb >= 100),
  method text NOT NULL CHECK (method IN ('telebirr', 'cbe_birr')),
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_respondent ON respondent_withdrawals(respondent_id);

ALTER TABLE respondent_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "respondent reads own withdrawals" ON respondent_withdrawals;
CREATE POLICY "respondent reads own withdrawals" ON respondent_withdrawals
  FOR SELECT USING (auth.uid() = respondent_id);

-- Recreate respondent_wallet_view to deduct from withdrawals table directly
-- rather than tracking individual payout records.
CREATE OR REPLACE VIEW respondent_wallet_view AS
  SELECT
    users.id AS respondent_id,
    COALESCE(SUM(respondent_payouts.amount_etb - COALESCE(respondent_payouts.platform_fee_etb, 0)), 0) 
      - COALESCE(withdrawals.total_withdrawn, 0) AS available_etb,
    COALESCE(withdrawals.total_withdrawn, 0) AS withdrawn_etb,
    COALESCE(SUM(respondent_payouts.amount_etb - COALESCE(respondent_payouts.platform_fee_etb, 0)), 0) AS lifetime_etb,
    COUNT(respondent_payouts.id) AS paid_response_count
  FROM users
  LEFT JOIN respondent_payouts ON respondent_payouts.respondent_id = users.id
  LEFT JOIN (
    SELECT respondent_id, SUM(amount_etb) AS total_withdrawn
    FROM respondent_withdrawals
    WHERE status != 'failed'
    GROUP BY respondent_id
  ) withdrawals ON withdrawals.respondent_id = users.id
  WHERE users.role = 'respondent'
  GROUP BY users.id, withdrawals.total_withdrawn;
