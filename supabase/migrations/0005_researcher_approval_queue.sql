-- Researcher approval queue setup
-- Adds verification_status and notes to researcher_profiles

-- 1. Add verification_status column
ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unrequested';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'researcher_profiles_verification_status_check'
  ) THEN
    ALTER TABLE researcher_profiles
      ADD CONSTRAINT researcher_profiles_verification_status_check
      CHECK (verification_status IN ('unrequested', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 2. Add verification_notes column (for admin feedback on rejection)
ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS verification_notes text;

-- 3. Data migration: if a researcher is already id_verified, their status should be approved.
UPDATE researcher_profiles
SET verification_status = 'approved'
WHERE verification_level = 'id_verified' AND verification_status = 'unrequested';
