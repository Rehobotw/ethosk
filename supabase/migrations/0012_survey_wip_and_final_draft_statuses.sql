-- Survey WIP & Final Draft statuses
-- Allows distinguishing between mid-build incomplete surveys (wip) and completed drafts (final_draft).

COMMIT;
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'wip';
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'final_draft';
BEGIN;
