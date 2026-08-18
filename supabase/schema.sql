-- ============================================================================
-- Ethosk Complete Database Schema (Single-File Supabase SQL Editor Script)
-- Latest Version: Includes all tables, views, RLS policies, functions, triggers,
-- broad targeting, researcher approval queue, subscription tiers, deposit/payout
-- ledgers, withdrawals, ban management, and survey workflow statuses.
-- ============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types & Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('respondent', 'researcher', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_tier AS ENUM (
    '0_registered', '1_id_verified', '2_attribute_verified', '3_institution_attested'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE doc_review_status AS ENUM ('processing', 'passed', 'failed', 'needs_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fraud_flag AS ENUM ('clean', 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE survey_status AS ENUM (
    'wip', 'draft', 'final_draft', 'pending_review', 'active', 'rejected', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure newer enum values exist if type was created previously
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'wip';
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'final_draft';

-- ----------------------------------------------------------------------------
-- 3. Core Tables
-- ----------------------------------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  email_verified boolean NOT NULL DEFAULT false,
  national_id_hash text,
  fayda_verified_at timestamptz,
  verification_tier verification_tier NOT NULL DEFAULT '0_registered',
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure users columns exist if table was already created in earlier migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fayda_verified_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_national_id_hash ON users (national_id_hash) WHERE national_id_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users (is_banned);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Respondent Profiles Table
CREATE TABLE IF NOT EXISTS respondent_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  university text,
  department text,
  year int CHECK (year BETWEEN 1 AND 8),
  age int CHECK (age BETWEEN 15 AND 100),
  employer text,
  gender text CHECK (gender IS NULL OR gender IN ('female', 'male', 'other', 'prefer_not_to_say')),
  region text,
  city text,
  employment_status text CHECK (employment_status IS NULL OR employment_status IN ('student', 'employed', 'self_employed', 'unemployed', 'retired', 'other')),
  occupation text,
  education_level text CHECK (education_level IS NULL OR education_level IN ('none', 'primary', 'secondary', 'tvet', 'bachelors', 'masters', 'doctorate')),
  primary_language text CHECK (primary_language IS NULL OR primary_language IN ('amharic', 'afan_oromo', 'tigrinya', 'somali', 'afar', 'sidama', 'wolaytta', 'english', 'other')),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure respondent_profiles columns exist if table was already created in earlier migration
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS employment_status text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS education_level text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS primary_language text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS employer text;
ALTER TABLE respondent_profiles ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_respondent_match ON respondent_profiles (university, department, year);
CREATE INDEX IF NOT EXISTS idx_respondent_match_general ON respondent_profiles (region, employment_status, gender);

-- Verification Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('student_id', 'degree', 'employer_id')),
  storage_path text NOT NULL,
  status doc_review_status NOT NULL DEFAULT 'processing',
  ai_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure documents columns exist if table was already created in earlier migration
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_notes text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status doc_review_status NOT NULL DEFAULT 'processing';

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status) WHERE status = 'needs_review';
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents (user_id);

-- Researcher Profiles Table
CREATE TABLE IF NOT EXISTS researcher_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio text,
  institution text,
  past_studies jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric(2,1) CHECK (rating BETWEEN 0 AND 5),
  verified boolean NOT NULL DEFAULT false,
  verification_level text NOT NULL DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'id_verified')),
  verification_status text NOT NULL DEFAULT 'unrequested' CHECK (verification_status IN ('unrequested', 'pending', 'approved', 'rejected')),
  verification_notes text,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'subscribed')),
  subscription_expires_at timestamptz,
  dob date,
  phone text,
  phone_verified boolean NOT NULL DEFAULT false,
  institutional_email text,
  institutional_email_verified boolean NOT NULL DEFAULT false,
  researcher_type text,
  years_experience int,
  onboarding_completed boolean NOT NULL DEFAULT false,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Ensure columns exist if table was already created in earlier migration
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS institution text;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS institutional_email text;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS institutional_email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS researcher_type text;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS years_experience int;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS verification_level text NOT NULL DEFAULT 'unverified';
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unrequested';
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS verification_notes text;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;
ALTER TABLE researcher_profiles ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Surveys Table
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_filters jsonb,
  status survey_status NOT NULL DEFAULT 'draft',
  reward_etb numeric(10,2),
  escrow_etb numeric(12,2) NOT NULL DEFAULT 0 CHECK (escrow_etb >= 0),
  compliance_answer boolean,
  compliance_document_path text,
  review_notes text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

-- Ensure surveys columns exist if table was already created in earlier migration
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS escrow_etb numeric(12,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_surveys_researcher ON surveys (researcher_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys (status);

-- Survey Targets Table
CREATE TABLE IF NOT EXISTS survey_targets (
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT now(),
  consistency_question jsonb,
  PRIMARY KEY (survey_id, respondent_id)
);

CREATE INDEX IF NOT EXISTS idx_targets_respondent ON survey_targets (respondent_id);

-- Survey Responses Table
CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id uuid NOT NULL REFERENCES users(id),
  answers jsonb NOT NULL,
  time_per_question jsonb NOT NULL,
  total_time_seconds int NOT NULL CHECK (total_time_seconds >= 0),
  fraud_flag fraud_flag NOT NULL DEFAULT 'clean',
  fraud_signals jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_id, respondent_id),
  CONSTRAINT fraud_signals_required_when_flagged CHECK (fraud_flag = 'clean' OR fraud_signals IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_responses_survey ON survey_responses (survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_respondent ON survey_responses (respondent_id);

-- ----------------------------------------------------------------------------
-- 4. Financial Ledgers & Transactions
-- ----------------------------------------------------------------------------

-- Researcher Deposits Table (Telebirr, CBE Birr, Bank Transfer)
CREATE TABLE IF NOT EXISTS researcher_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_etb numeric(12,2) NOT NULL CHECK (amount_etb > 0),
  method text NOT NULL CHECK (method IN ('telebirr', 'cbe_birr', 'bank_transfer')),
  reference text NOT NULL,
  provider_ref text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  UNIQUE (researcher_id, reference)
);

-- Ensure researcher_deposits columns exist if table was already created in earlier migration
ALTER TABLE researcher_deposits ADD COLUMN IF NOT EXISTS provider_ref text;
ALTER TABLE researcher_deposits ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_reference ON researcher_deposits (reference);
CREATE INDEX IF NOT EXISTS idx_deposits_researcher ON researcher_deposits (researcher_id);

-- Respondent Payouts Table
CREATE TABLE IF NOT EXISTS respondent_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL UNIQUE REFERENCES survey_responses(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  researcher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_etb numeric(12,2) NOT NULL CHECK (amount_etb >= 0),
  platform_fee_etb numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee_etb >= 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'withdrawn', 'pending', 'completed', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_respondent ON respondent_payouts (respondent_id);
CREATE INDEX IF NOT EXISTS idx_payouts_researcher ON respondent_payouts (researcher_id);

-- Respondent Withdrawals Table
CREATE TABLE IF NOT EXISTS respondent_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_etb numeric(12,2) NOT NULL CHECK (amount_etb >= 100),
  method text NOT NULL CHECK (method IN ('telebirr', 'cbe_birr')),
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_respondent ON respondent_withdrawals (respondent_id);

-- Researcher Charges (Platform Subscriptions, Add-ons)
CREATE TABLE IF NOT EXISTS researcher_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_etb numeric(12,2) NOT NULL CHECK (amount_etb > 0),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charges_researcher ON researcher_charges (researcher_id);

-- Consent Audit Events
CREATE TABLE IF NOT EXISTS consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  event_type text NOT NULL CHECK (
    event_type IN ('document_upload', 'survey_response', 'data_erasure_request', 'fayda_verification')
  ),
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_events (user_id);

-- Addis AI Adaptive Translation Cache
CREATE TABLE IF NOT EXISTS translation_cache (
  cache_key text PRIMARY KEY,
  target_language text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. Triggers & Helper Functions
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON respondent_profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON respondent_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Canonical Views
-- ----------------------------------------------------------------------------

-- Restricted Matching View (Demographic & Tier matching without exposing private PII)
CREATE OR REPLACE VIEW respondent_match_view AS
  SELECT
    respondent_profiles.user_id,
    respondent_profiles.university,
    respondent_profiles.department,
    respondent_profiles.year,
    respondent_profiles.age,
    users.verification_tier,
    CASE users.verification_tier
      WHEN '0_registered' THEN 0
      WHEN '1_id_verified' THEN 1
      WHEN '2_attribute_verified' THEN 2
      WHEN '3_institution_attested' THEN 3
    END AS tier_rank,
    respondent_profiles.gender,
    respondent_profiles.region,
    respondent_profiles.city,
    respondent_profiles.employment_status,
    respondent_profiles.occupation,
    respondent_profiles.education_level,
    respondent_profiles.primary_language
  FROM respondent_profiles
  JOIN users ON users.id = respondent_profiles.user_id
  WHERE users.role = 'respondent' AND users.is_banned = false;

-- Researcher Wallet Summary View
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

-- Respondent Wallet Summary View
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

-- ----------------------------------------------------------------------------
-- 7. Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE researcher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE researcher_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondent_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE respondent_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE researcher_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;

-- Users RLS
DROP POLICY IF EXISTS "users read self" ON users;
CREATE POLICY "users read self" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin reads all users" ON users;
CREATE POLICY "admin reads all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "super_admin updates all users" ON users;
CREATE POLICY "super_admin updates all users" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
);

-- Respondent Profiles RLS
DROP POLICY IF EXISTS "respondent manages own profile" ON respondent_profiles;
CREATE POLICY "respondent manages own profile" ON respondent_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Documents RLS
DROP POLICY IF EXISTS "respondent manages own documents" ON documents;
CREATE POLICY "respondent manages own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin reads all documents" ON documents;
CREATE POLICY "admin reads all documents" ON documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin updates all documents" ON documents;
CREATE POLICY "admin updates all documents" ON documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Researcher Profiles RLS
DROP POLICY IF EXISTS "researcher manages own profile" ON researcher_profiles;
CREATE POLICY "researcher manages own profile" ON researcher_profiles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin reads all researcher profiles" ON researcher_profiles;
CREATE POLICY "admin reads all researcher profiles" ON researcher_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin updates all researcher profiles" ON researcher_profiles;
CREATE POLICY "admin updates all researcher profiles" ON researcher_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Surveys RLS
DROP POLICY IF EXISTS "researcher manages own surveys" ON surveys;
CREATE POLICY "researcher manages own surveys" ON surveys
  FOR ALL USING (auth.uid() = researcher_id);

DROP POLICY IF EXISTS "respondent reads targeted active surveys" ON surveys;
CREATE POLICY "respondent reads targeted active surveys" ON surveys
  FOR SELECT USING (
    status = 'active' AND
    EXISTS (SELECT 1 FROM survey_targets WHERE survey_id = surveys.id AND respondent_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin manages all surveys" ON surveys;
CREATE POLICY "admin manages all surveys" ON surveys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Survey Responses RLS
DROP POLICY IF EXISTS "respondent inserts own response" ON survey_responses;
CREATE POLICY "respondent inserts own response" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = respondent_id);

DROP POLICY IF EXISTS "respondent reads own responses" ON survey_responses;
CREATE POLICY "respondent reads own responses" ON survey_responses
  FOR SELECT USING (auth.uid() = respondent_id);

DROP POLICY IF EXISTS "researcher reads responses for own survey" ON survey_responses;
CREATE POLICY "researcher reads responses for own survey" ON survey_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = survey_responses.survey_id AND surveys.researcher_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin reads all responses" ON survey_responses;
CREATE POLICY "admin reads all responses" ON survey_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Financial Ledgers RLS
DROP POLICY IF EXISTS "researcher reads own deposits" ON researcher_deposits;
CREATE POLICY "researcher reads own deposits" ON researcher_deposits
  FOR SELECT USING (auth.uid() = researcher_id);

DROP POLICY IF EXISTS "researcher reads own charges" ON researcher_charges;
CREATE POLICY "researcher reads own charges" ON researcher_charges
  FOR SELECT USING (auth.uid() = researcher_id);

DROP POLICY IF EXISTS "respondent reads own payouts" ON respondent_payouts;
CREATE POLICY "respondent reads own payouts" ON respondent_payouts
  FOR SELECT USING (auth.uid() = respondent_id);

DROP POLICY IF EXISTS "respondent reads own withdrawals" ON respondent_withdrawals;
CREATE POLICY "respondent reads own withdrawals" ON respondent_withdrawals
  FOR SELECT USING (auth.uid() = respondent_id);

DROP POLICY IF EXISTS "respondent inserts own withdrawals" ON respondent_withdrawals;
CREATE POLICY "respondent inserts own withdrawals" ON respondent_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = respondent_id);

DROP POLICY IF EXISTS "admin manages all financial records" ON researcher_deposits;
CREATE POLICY "admin manages all financial records" ON researcher_deposits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin manages all payouts" ON respondent_payouts;
CREATE POLICY "admin manages all payouts" ON respondent_payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin manages all withdrawals" ON respondent_withdrawals;
CREATE POLICY "admin manages all withdrawals" ON respondent_withdrawals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Translation Cache RLS
DROP POLICY IF EXISTS "anyone can read translations" ON translation_cache;
CREATE POLICY "anyone can read translations" ON translation_cache FOR SELECT USING (true);

-- Consent Audit RLS
DROP POLICY IF EXISTS "user reads own consent events" ON consent_events;
CREATE POLICY "user reads own consent events" ON consent_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user inserts own consent events" ON consent_events;
CREATE POLICY "user inserts own consent events" ON consent_events FOR INSERT WITH CHECK (auth.uid() = user_id);
