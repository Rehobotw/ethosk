-- Add is_banned column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Add index on is_banned for efficient filtering in admin views
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users (is_banned);
