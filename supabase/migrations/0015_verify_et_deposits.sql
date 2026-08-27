-- Migration 0015: Add verify.et transaction verification fields to researcher_deposits (§4.6.1, §3.5, §7.4 item 12)

-- 1. Add verification and idempotency columns to researcher_deposits table
ALTER TABLE researcher_deposits
  ADD COLUMN IF NOT EXISTS sender_detail text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_response jsonb;

-- 2. Add comments
COMMENT ON COLUMN researcher_deposits.sender_detail IS
  'Sender identifier (such as last 4 digits of phone or bank account number) for matching verify.et records.';

COMMENT ON COLUMN researcher_deposits.idempotency_key IS
  'Unique client-generated token per deposit attempt to prevent double-crediting on resubmission.';

COMMENT ON COLUMN researcher_deposits.verification_status IS
  'Automated verification status from verify.et: verified, mismatched, not_found, unsupported_provider, manual_review.';

-- 3. Create unique index for idempotency protection
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_idempotency
  ON researcher_deposits (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
