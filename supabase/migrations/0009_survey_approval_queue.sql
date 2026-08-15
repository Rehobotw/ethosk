-- Survey Approval Queue setup

-- 1. Add new statuses to survey_status enum (requires escaping the transaction)
COMMIT;
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'rejected';
BEGIN;

-- 2. Add approval queue columns to the surveys table
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS compliance_answer boolean,
  ADD COLUMN IF NOT EXISTS compliance_document_path text,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
