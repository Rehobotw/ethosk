-- Adds comprehensive onboarding fields to researcher_profiles

ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean not null default false,
  ADD COLUMN IF NOT EXISTS institutional_email text,
  ADD COLUMN IF NOT EXISTS institutional_email_verified boolean not null default false,
  ADD COLUMN IF NOT EXISTS researcher_type text,
  ADD COLUMN IF NOT EXISTS years_experience int,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean not null default false;

-- For existing researchers who already completed basic setup, mark them as onboarded
UPDATE researcher_profiles
SET onboarding_completed = true
WHERE verification_level = 'id_verified';
