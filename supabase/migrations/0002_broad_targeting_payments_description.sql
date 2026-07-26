-- Ethosk migration 0002
--
-- Three additions, each safe to run more than once:
--   1. Surveys carry a long description alongside the title.
--   2. Respondent profiles carry general-population attributes, so targeting is
--      no longer limited to university/department/year.
--   3. A deposit-and-payout ledger, so a researcher funds a study up front and a
--      respondent is credited from that funded pool.

-- ---------------------------------------------------------------------------
-- 1. Survey description
-- ---------------------------------------------------------------------------

alter table surveys add column if not exists description text;

comment on column surveys.description is
  'Researcher-written detail shown to respondents under the title: purpose, who it is for, and what participating involves.';

-- ---------------------------------------------------------------------------
-- 2. General-population respondent attributes
--
-- The original schema described a student panel only. These columns let a study
-- target the wider public — traders, civil servants, farmers, the unemployed —
-- without a university being involved at all. Every one is nullable: a profile
-- stays valid while it is being filled in, and an unset attribute simply never
-- matches a filter on it.
-- ---------------------------------------------------------------------------

alter table respondent_profiles add column if not exists gender text;
alter table respondent_profiles add column if not exists region text;
alter table respondent_profiles add column if not exists city text;
alter table respondent_profiles add column if not exists employment_status text;
alter table respondent_profiles add column if not exists occupation text;
alter table respondent_profiles add column if not exists education_level text;
alter table respondent_profiles add column if not exists primary_language text;

-- Constraints are added separately from the columns so re-running the migration
-- does not fail on a constraint that already exists.
do $$ begin
  alter table respondent_profiles add constraint respondent_gender_valid
    check (gender is null or gender in ('female','male','other','prefer_not_to_say'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table respondent_profiles add constraint respondent_employment_status_valid
    check (employment_status is null or employment_status in
      ('student','employed','self_employed','unemployed','retired','other'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table respondent_profiles add constraint respondent_education_level_valid
    check (education_level is null or education_level in
      ('none','primary','secondary','tvet','bachelors','masters','doctorate'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table respondent_profiles add constraint respondent_primary_language_valid
    check (primary_language is null or primary_language in
      ('amharic','afan_oromo','tigrinya','somali','afar','sidama','wolaytta','english','other'));
exception when duplicate_object then null; end $$;

-- Region and city stay free text: the official region list changes, and a city
-- list would be stale the moment it was written.
create index if not exists idx_respondent_match_general
  on respondent_profiles (region, employment_status, gender);

-- ---------------------------------------------------------------------------
-- Matching view, widened
--
-- New columns are appended rather than inserted, so `create or replace view`
-- accepts the change and the existing grants survive.
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
    end as tier_rank,
    respondent_profiles.gender,
    respondent_profiles.region,
    respondent_profiles.city,
    respondent_profiles.employment_status,
    respondent_profiles.occupation,
    respondent_profiles.education_level,
    respondent_profiles.primary_language
  from respondent_profiles
  join users on users.id = respondent_profiles.user_id
  where users.role = 'respondent';

-- ---------------------------------------------------------------------------
-- Researcher profile: the institution a respondent sees on a study
-- ---------------------------------------------------------------------------

alter table researcher_profiles add column if not exists institution text;

-- The original policy allowed update but never insert, so a researcher could not
-- create the profile row their own settings page writes to.
drop policy if exists "researcher inserts own profile" on researcher_profiles;
create policy "researcher inserts own profile" on researcher_profiles
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Deposits and payouts
--
-- Money enters as a deposit against a researcher, is reserved on a survey when
-- it is sent, and leaves as a payout attached to one accepted response. Balances
-- are derived from those three facts rather than stored, so a balance can never
-- drift out of step with the rows that explain it.
-- ---------------------------------------------------------------------------

alter table surveys add column if not exists escrow_etb numeric(12,2) not null default 0;

do $$ begin
  alter table surveys add constraint surveys_escrow_non_negative check (escrow_etb >= 0);
exception when duplicate_object then null; end $$;

comment on column surveys.escrow_etb is
  'Funds still committed to this survey. Set when it is sent, drawn down by each payout, and zeroed when it closes.';

create table if not exists researcher_deposits (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references users(id) on delete cascade,
  amount_etb numeric(12,2) not null check (amount_etb > 0),
  method text not null check (method in ('telebirr','cbe_birr','bank_transfer')),
  -- The provider's transaction reference. Unique per researcher so replaying the
  -- same confirmation cannot credit the same money twice.
  reference text not null,
  status text not null default 'completed' check (status in ('pending','completed','failed')),
  created_at timestamptz not null default now(),
  unique (researcher_id, reference)
);

create table if not exists respondent_payouts (
  id uuid primary key default gen_random_uuid(),
  -- One payout per response, enforced by the database rather than by the route,
  -- so no retry or race can pay for the same answer set twice.
  response_id uuid not null unique references survey_responses(id) on delete cascade,
  survey_id uuid not null references surveys(id) on delete cascade,
  respondent_id uuid not null references users(id) on delete cascade,
  researcher_id uuid not null references users(id) on delete cascade,
  amount_etb numeric(12,2) not null check (amount_etb >= 0),
  status text not null default 'available' check (status in ('available','withdrawn')),
  created_at timestamptz not null default now()
);

create index if not exists idx_deposits_researcher on researcher_deposits (researcher_id);
create index if not exists idx_payouts_respondent on respondent_payouts (respondent_id);
create index if not exists idx_payouts_researcher on respondent_payouts (researcher_id);

-- ---------------------------------------------------------------------------
-- Balance views
-- ---------------------------------------------------------------------------

create or replace view researcher_wallet_view as
  select
    users.id as researcher_id,
    coalesce(deposits.total, 0) as deposited_etb,
    coalesce(reserved.total, 0) as reserved_etb,
    coalesce(paid.total, 0) as paid_etb,
    coalesce(deposits.total, 0) - coalesce(reserved.total, 0) - coalesce(paid.total, 0)
      as available_etb
  from users
  left join (
    select researcher_id, sum(amount_etb) as total
    from researcher_deposits where status = 'completed' group by researcher_id
  ) deposits on deposits.researcher_id = users.id
  left join (
    select researcher_id, sum(escrow_etb) as total
    from surveys where status = 'active' group by researcher_id
  ) reserved on reserved.researcher_id = users.id
  left join (
    select researcher_id, sum(amount_etb) as total
    from respondent_payouts group by researcher_id
  ) paid on paid.researcher_id = users.id
  where users.role = 'researcher';

create or replace view respondent_wallet_view as
  select
    users.id as respondent_id,
    coalesce(sum(case when respondent_payouts.status = 'available'
                 then respondent_payouts.amount_etb end), 0) as available_etb,
    coalesce(sum(case when respondent_payouts.status = 'withdrawn'
                 then respondent_payouts.amount_etb end), 0) as withdrawn_etb,
    coalesce(sum(respondent_payouts.amount_etb), 0) as lifetime_etb,
    count(respondent_payouts.id) as paid_response_count
  from users
  left join respondent_payouts on respondent_payouts.respondent_id = users.id
  where users.role = 'respondent'
  group by users.id;

-- ---------------------------------------------------------------------------
-- Row-Level Security
--
-- Writes to both tables happen only through the service role inside the deposit
-- and submission routes. These policies cover reads.
-- ---------------------------------------------------------------------------

alter table researcher_deposits enable row level security;
alter table respondent_payouts enable row level security;

drop policy if exists "researcher reads own deposits" on researcher_deposits;
create policy "researcher reads own deposits" on researcher_deposits
  for select using (auth.uid() = researcher_id);

drop policy if exists "respondent reads own payouts" on respondent_payouts;
create policy "respondent reads own payouts" on respondent_payouts
  for select using (auth.uid() = respondent_id);

-- A researcher can see what their own study paid out, which is the audit trail
-- for their spend. It carries no respondent identity beyond the id they already
-- hold as the study owner.
drop policy if exists "researcher reads payouts on own surveys" on respondent_payouts;
create policy "researcher reads payouts on own surveys" on respondent_payouts
  for select using (auth.uid() = researcher_id);
