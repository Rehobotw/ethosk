-- Migration 0016: Add verify.et reconciliation fields to respondent_withdrawals (Spec v4 §3.5, §4.6.1, §7.4 item 12)

-- 1. Add verification and tracking columns to respondent_withdrawals table
ALTER TABLE respondent_withdrawals
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS provider_ref text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verification_response jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Update CHECK constraint for status to include 'needs_review' and 'paid'
ALTER TABLE respondent_withdrawals DROP CONSTRAINT IF EXISTS respondent_withdrawals_status_check;
ALTER TABLE respondent_withdrawals
  ADD CONSTRAINT respondent_withdrawals_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'paid', 'failed', 'needs_review'));

-- 3. Add column comments
COMMENT ON COLUMN respondent_withdrawals.reference IS
  'Ethosk internal payout reference number passed to verify.et for reconciliation.';

COMMENT ON COLUMN respondent_withdrawals.provider_ref IS
  'Outbound transaction identifier returned by the payment rail / verify.et.';

COMMENT ON COLUMN respondent_withdrawals.verification_status IS
  'Automated verification status from verify.et: verified, mismatched, not_found, unsupported_provider, manual_review.';

COMMENT ON COLUMN respondent_withdrawals.verification_notes IS
  'Human-readable verification result or audit note, e.g. "Paid — verified via verify.et".';

-- 4. Create index on reference
CREATE INDEX IF NOT EXISTS idx_withdrawals_reference
  ON respondent_withdrawals (reference)
  WHERE reference IS NOT NULL;
