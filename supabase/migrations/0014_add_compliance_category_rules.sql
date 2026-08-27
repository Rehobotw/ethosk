-- Migration 0014: Add compliance_category_rules table and survey compliance fields (§7.4 item 1, §5, §7.1)

-- 1. Create compliance_category_rules table
CREATE TABLE IF NOT EXISTS compliance_category_rules (
  id text PRIMARY KEY,
  name text NOT NULL,
  requires_document boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Seed starter categories (§7.4 item 1)
INSERT INTO compliance_category_rules (id, name, requires_document, description)
VALUES
  ('human_subjects', 'Human-subjects research', true, 'Studies involving interaction with human participants or identifiable private data require IRB / ethical clearance.'),
  ('health_medical', 'Health/medical studies', true, 'Health and medical studies require formal medical or health research ethics committee clearance.'),
  ('minors', 'Studies involving minors', true, 'Studies involving minors (<18) require institutional and ethical compliance clearance and guardian protocol.'),
  ('financial_data', 'Financial-data collection', true, 'Financial data collection studies require institutional regulatory and data privacy clearance.'),
  ('market_consumer', 'Market & Consumer Research', false, 'General consumer preference, brand perception, and market trends research.'),
  ('social_science', 'Social Science & Public Opinion', false, 'General public sentiment, sociological inquiries, and non-sensitive social research.'),
  ('education_academic', 'General Education & Academic Feedback', false, 'Course evaluations, academic feedback, and pedagogical methodology surveys.'),
  ('product_usability', 'Product Usability & UI/UX Testing', false, 'Software usability, user interface feedback, and product experience studies.'),
  ('agriculture_rural', 'Agriculture & Rural Development', false, 'Agricultural practices, rural development surveys, and farming technique feedback.'),
  ('other', 'General / Other Research', false, 'Other non-sensitive research topics.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  requires_document = EXCLUDED.requires_document,
  description = EXCLUDED.description,
  updated_at = now();

-- 3. Add columns to surveys table
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS research_category text,
  ADD COLUMN IF NOT EXISTS compliance_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS compliance_rule_triggered text;
