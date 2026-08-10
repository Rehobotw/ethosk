-- Permission matrix: super_admin role, researcher verification & subscription tiers.
-- Mirrors the shared/permissions.ts module.

-- ---------------------------------------------------------------------------
-- 1. Extend user_role enum with super_admin
-- ---------------------------------------------------------------------------

-- Postgres enums do not support IF NOT EXISTS on ADD VALUE in older versions,
-- so we guard with a DO block.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin' AFTER 'admin';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Researcher-specific columns on researcher_profiles
-- ---------------------------------------------------------------------------

-- verification_level: has the researcher verified their identity via Fayda?
ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS verification_level text NOT NULL DEFAULT 'unverified';

-- Guard: only allow known values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'researcher_profiles_verification_level_check'
  ) THEN
    ALTER TABLE researcher_profiles
      ADD CONSTRAINT researcher_profiles_verification_level_check
      CHECK (verification_level IN ('unverified', 'id_verified'));
  END IF;
END $$;

-- subscription_tier: free or subscribed researcher
ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'researcher_profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE researcher_profiles
      ADD CONSTRAINT researcher_profiles_subscription_tier_check
      CHECK (subscription_tier IN ('free', 'subscribed'));
  END IF;
END $$;

-- When the subscription expires (null = never / lifetime).
ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. institution column (may already exist from earlier builds)
-- ---------------------------------------------------------------------------

ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS institution text;

-- ---------------------------------------------------------------------------
-- 4. RLS updates for super_admin
--
-- super_admin inherits all admin policies. We create additional policies that
-- grant super_admin the same access admin already has, plus user management.
-- ---------------------------------------------------------------------------

-- super_admin can read all documents (same as admin)
DROP POLICY IF EXISTS "super_admin reads all documents" ON documents;
CREATE POLICY "super_admin reads all documents" ON documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- super_admin can read all users (for user management)
DROP POLICY IF EXISTS "super_admin reads all users" ON users;
CREATE POLICY "super_admin reads all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- super_admin can update any user (role changes, etc.)
DROP POLICY IF EXISTS "super_admin updates all users" ON users;
CREATE POLICY "super_admin updates all users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- admin can also read all users (but not update roles — that's server-side gated)
DROP POLICY IF EXISTS "admin reads all users" ON users;
CREATE POLICY "admin reads all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin'))
  );

-- ---------------------------------------------------------------------------
-- 5. Seed: promote the first super_admin via environment.
--
-- In production, the SUPER_ADMIN_EMAIL environment variable is read by the
-- Express server at startup and promotes that user to super_admin if they
-- exist. This migration does NOT hardcode any email.
-- ---------------------------------------------------------------------------

-- Index for fast role lookups by admins
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
