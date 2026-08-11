-- Adds social links field to researcher profiles

ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS social_links jsonb not null default '{}'::jsonb;
