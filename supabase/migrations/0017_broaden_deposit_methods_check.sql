-- Migration 0017: Broaden deposit methods and status check constraints on researcher_deposits
-- Enables automated verify.et reconciliation for CBE, BOA, Dashen, Awash, Siinqee, Kaafi Ebirr,
-- and allows 'needs_review' and 'processing' statuses.

-- 1. Update method check constraint
ALTER TABLE researcher_deposits DROP CONSTRAINT IF EXISTS researcher_deposits_method_check;
ALTER TABLE researcher_deposits
  ADD CONSTRAINT researcher_deposits_method_check
  CHECK (method IN (
    'telebirr',
    'cbe',
    'cbe_birr',
    'boa',
    'dashen',
    'awash',
    'siinqee',
    'kaafi_ebirr',
    'bank_transfer'
  ));

-- 2. Update status check constraint
ALTER TABLE researcher_deposits DROP CONSTRAINT IF EXISTS researcher_deposits_status_check;
ALTER TABLE researcher_deposits
  ADD CONSTRAINT researcher_deposits_status_check
  CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'needs_review'
  ));
