-- Add builder_type and updated_at to surveys table (§4.3.5)
-- Distinguishes Manual Builder, Import Survey, and AI Survey Generator drafts and tracks last edit time.

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS builder_type text CHECK (builder_type IN ('manual', 'import', 'ai')) DEFAULT 'manual';
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
