-- Ethosk initial schema, RLS policies, and restricted matching view.
-- Mirrors §9 of docs/technical_blueprint.md.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type user_role as enum ('respondent', 'researcher', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_tier as enum (
    '0_registered', '1_id_verified', '2_attribute_verified', '3_institution_attested'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type doc_review_status as enum ('processing', 'passed', 'failed', 'needs_review');
exception when duplicate_object then null; end $$;

-- Binary by design: a response is flagged as fraud or it is not. An inconclusive
-- signal is not fraud, so there is no middle "needs review" state.
do $$ begin
  create type fraud_flag as enum ('clean', 'flagged');
exception when duplicate_object then null; end $$;

do $$ begin
  create type survey_status as enum ('draft', 'active', 'closed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role user_role not null,
  full_name text not null,
  phone text unique not null check (phone ~ '^(?:\+251|0)9\d{8}$'),
  -- Never the raw national ID: only a SHA-256 of the ID plus a server-side
  -- pepper, which is enough to detect duplicate registrations (§17.6).
  national_id_hash text,
  -- Set only when Fayda itself confirmed the FIN. Kept separate from the tier so
  -- an ID-verified account is always traceable to a real Fayda response.
  fayda_verified_at timestamptz,
  verification_tier verification_tier not null default '0_registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_users_national_id_hash
  on users (national_id_hash) where national_id_hash is not null;

create table if not exists respondent_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  university text,
  department text,
  year int check (year between 1 and 8),
  age int check (age between 15 and 100),
  employer text,
  attributes jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  doc_type text not null check (doc_type in ('student_id','degree','employer_id')),
  storage_path text not null,
  status doc_review_status not null default 'processing',
  ai_notes text,
  created_at timestamptz not null default now()
);

create table if not exists researcher_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  bio text,
  past_studies jsonb not null default '[]',
  rating numeric(2,1) check (rating between 0 and 5),
  verified boolean not null default false
);

create table if not exists surveys (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references users(id),
  title text not null,
  questions jsonb not null,
  translations jsonb not null default '{}',
  target_filters jsonb,
  status survey_status not null default 'draft',
  reward_etb numeric(10,2),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists survey_targets (
  survey_id uuid not null references surveys(id) on delete cascade,
  respondent_id uuid not null references users(id) on delete cascade,
  notified_at timestamptz not null default now(),
  -- The AI-rephrased duplicate question generated for this respondent, stored on
  -- first fill. Held server-side so the pairing it checks is re-derived from here
  -- at submission rather than trusted from the client, and so a respondent who
  -- reloads the survey sees the same question in the same place.
  consistency_question jsonb,
  primary key (survey_id, respondent_id)
);

create table if not exists survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  respondent_id uuid not null references users(id),
  answers jsonb not null,
  time_per_question jsonb not null,
  total_time_seconds int not null check (total_time_seconds >= 0),
  fraud_flag fraud_flag not null default 'clean',
  -- The raw signals behind the flag. No prose explanation is stored: the flag is
  -- the output, and the signals are the audit trail for how it was reached.
  fraud_signals jsonb,
  completed_at timestamptz not null default now(),
  unique (survey_id, respondent_id),
  -- Every flag must be traceable to the signals that produced it.
  constraint fraud_signals_required_when_flagged
    check (fraud_flag = 'clean' or fraud_signals is not null)
);

create table if not exists consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  event_type text not null check (
    event_type in ('document_upload','survey_response','data_erasure_request','fayda_verification')
  ),
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists translation_cache (
  cache_key text primary key,
  target_language text not null,
  translated_text text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_respondent_match on respondent_profiles (university, department, year);
create index if not exists idx_responses_survey on survey_responses (survey_id);
create index if not exists idx_documents_status on documents (status) where status = 'needs_review';
create index if not exists idx_targets_respondent on survey_targets (respondent_id);
create index if not exists idx_surveys_researcher on surveys (researcher_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

drop trigger if exists trg_profiles_updated_at on respondent_profiles;
create trigger trg_profiles_updated_at before update on respondent_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Restricted matching view
--
-- Researchers never query respondent_profiles directly. This view exposes only
-- the columns matching needs, plus a numeric tier_rank so a ">= tier" filter is
-- a plain integer comparison instead of an enum ordering trick (§9.2, §17.1).
-- ---------------------------------------------------------------------------

create or replace view respondent_match_view as
  select
    respondent_profiles.user_id,
    respondent_profiles.university,
    respondent_profiles.department,
    respondent_profiles.year,
    respondent_profiles.age,
    users.verification_tier,
    case users.verification_tier
      when '0_registered' then 0
      when '1_id_verified' then 1
      when '2_attribute_verified' then 2
      when '3_institution_attested' then 3
    end as tier_rank
  from respondent_profiles
  join users on users.id = respondent_profiles.user_id
  where users.role = 'respondent';

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table respondent_profiles enable row level security;
alter table documents enable row level security;
alter table researcher_profiles enable row level security;
alter table surveys enable row level security;
alter table survey_targets enable row level security;
alter table survey_responses enable row level security;
alter table consent_events enable row level security;
alter table translation_cache enable row level security;

drop policy if exists "own user row" on users;
create policy "own user row" on users
  for all using (auth.uid() = id);

drop policy if exists "respondent owns profile" on respondent_profiles;
create policy "respondent owns profile" on respondent_profiles
  for all using (auth.uid() = user_id);

drop policy if exists "respondent owns documents" on documents;
create policy "respondent owns documents" on documents
  for select using (auth.uid() = user_id);

drop policy if exists "respondent inserts own documents" on documents;
create policy "respondent inserts own documents" on documents
  for insert with check (auth.uid() = user_id);

drop policy if exists "admin reads all documents" on documents;
create policy "admin reads all documents" on documents
  for select using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

drop policy if exists "researcher owns profile write" on researcher_profiles;
create policy "researcher owns profile write" on researcher_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "anyone reads researcher profiles" on researcher_profiles;
create policy "anyone reads researcher profiles" on researcher_profiles
  for select using (true);

drop policy if exists "researcher owns surveys" on surveys;
create policy "researcher owns surveys" on surveys
  for all using (auth.uid() = researcher_id);

-- A respondent can see only rows where they are the target. Inserts happen
-- exclusively via the service-role key inside the send route, never client-side.
drop policy if exists "respondent sees own targeting" on survey_targets;
create policy "respondent sees own targeting" on survey_targets
  for select using (auth.uid() = respondent_id);

drop policy if exists "respondent owns responses" on survey_responses;
create policy "respondent owns responses" on survey_responses
  for all using (auth.uid() = respondent_id);

drop policy if exists "researcher reads responses to own survey" on survey_responses;
create policy "researcher reads responses to own survey" on survey_responses
  for select using (
    exists (select 1 from surveys where surveys.id = survey_responses.survey_id
            and surveys.researcher_id = auth.uid())
  );

drop policy if exists "own consent events" on consent_events;
create policy "own consent events" on consent_events
  for select using (auth.uid() = user_id);

drop policy if exists "insert own consent events" on consent_events;
create policy "insert own consent events" on consent_events
  for insert with check (auth.uid() = user_id);

-- The translation cache holds no personal data, but RLS stays on so no table is
-- unprotected by default; only the service role touches it.
drop policy if exists "no client access to translation cache" on translation_cache;
create policy "no client access to translation cache" on translation_cache
  for select using (false);
