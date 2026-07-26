-- Ethosk migration 0003
--
-- Live telebirr deposits. Safe to run more than once.
--
-- The deposit ledger from 0002 already models a deposit that has been started but
-- not yet paid: `status` allows 'pending', and `researcher_wallet_view` sums only
-- 'completed' rows, so an abandoned checkout never touches a balance. What it
-- lacks is somewhere to record the gateway's own identifiers, and a way to find a
-- deposit from a callback that knows nothing about our researcher ids.

-- ---------------------------------------------------------------------------
-- Gateway identifiers
-- ---------------------------------------------------------------------------

-- telebirr's transaction number. Distinct from `reference`, which is the order
-- number we generate and send them: reconciling a statement against our ledger
-- needs their identifier, and disputes are raised with it.
alter table researcher_deposits add column if not exists provider_ref text;

comment on column researcher_deposits.provider_ref is
  'The payment provider''s own transaction number, recorded when a payment completes. Null for deposits confirmed by hand.';

-- When a deposit was last moved between statuses, so a checkout abandoned days
-- ago is distinguishable from one opened a minute ago.
alter table researcher_deposits add column if not exists updated_at timestamptz;

-- ---------------------------------------------------------------------------
-- Callback lookup
-- ---------------------------------------------------------------------------

-- A callback identifies the payment by order number alone. 0002 indexed
-- (researcher_id, reference) through its unique constraint, which cannot serve a
-- lookup that has no researcher_id. Order numbers are globally unique, so this is
-- unique too — that uniqueness is what makes a replayed callback a no-op rather
-- than a second credit.
create unique index if not exists idx_deposits_reference on researcher_deposits (reference);
