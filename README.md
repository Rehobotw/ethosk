# Ethosk

Verified research panel and marketplace for Ethiopia.

Researchers get instant, filterable access to ID-verified survey respondents with
transparent response-quality checks, instead of relying on unverifiable fieldwork
or blank-form tools that only format the questions.

Built to `docs/technical_blueprint.md`, with React + Vite in place of Next.js.
`docs/architecture_deviations.md` records exactly what that change affected.

## What it actually guarantees

The core loop is: **filter → live matched count → send → timed fill → quality
score → dashboard.**

Two properties are load-bearing, and both are deliberate:

- **The quality flag is deterministic and binary.** `shared/fraud/score.ts` is a
  pure, unit-tested function with no AI anywhere in it. A response is flagged as
  fraud or it is not — no middle "needs review" state, and no AI-written explanation.
  If every AI provider is down, the flags are identical.
- **We never overclaim.** Document uploads get a legibility and consistency
  check, not authenticity verification, and the UI says so. Overclaiming a trust
  property is itself a trust failure for a platform whose pitch is trustworthiness.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, TypeScript (`strict`), Tailwind CSS, React Router |
| Data fetching | TanStack Query |
| Forms | react-hook-form + zod (one schema, client and server) |
| Charts | Recharts (code-split away from the respondent path) |
| Backend | Express (Node), TypeScript |
| Database / auth / storage | Supabase Postgres with RLS, Supabase Auth, private buckets |
| AI | Anthropic Claude (Sonnet + Haiku), Addis AI for Amharic / Afan Oromo |

## Getting started

```bash
nvm use 20          # Node 20+
npm ci
cp .env.example .env.local
```

Fill in `.env.local`. The three Supabase values come from **Project Settings → API
Keys** in the dashboard: the project URL, the *publishable* key (legacy name: `anon`)
for `VITE_SUPABASE_ANON_KEY`, and the *secret* key (legacy name: `service_role`) for
`SUPABASE_SERVICE_ROLE_KEY`.

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` reach the browser; everything
else is server-side. The app runs without AI or Fayda keys — every AI feature falls
back to its documented non-AI behaviour, and Fayda verification uses the demo
directory while `ALLOW_FAYDA_STUB` is on.

Apply the migrations, then seed:

```bash
npm run migrate
npm run seed
```

`migrate` applies everything in `supabase/migrations` in filename order and records
what it ran, so it is safe to call repeatedly. Each file is also idempotent on its
own, which means you can paste one into the Supabase SQL editor instead — useful
when `SUPABASE_DB_URL` is unavailable, since the SQL editor needs no password.

The seed funds the demo researcher's wallet. That matters because sending a survey
now reserves its whole reward budget up front, so an unfunded account cannot send.

Create a **private** storage bucket named `documents` in the Supabase dashboard.
Nothing user-uploaded is ever served from a public bucket.

```bash
npm run dev         # web on :3000, API on :4000
```

Sign in with a seeded account — see `docs/demo_script.md` for the list.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server and API together |
| `npm run build` | Typecheck, then production client build |
| `npm run typecheck` | `tsc` across client, server, and shared |
| `npm test` | Unit tests for the decision logic |
| `npm run lint` | ESLint |
| `npm run seed` | Load the demo panel and surveys |
| `npm run check:service-role` | Fails if the service-role key is reachable from client code |

## Layout

```
src/                    React app
  components/ui/          Button, Input, Card, TierBadge, FlagBadge, Notice
  components/survey-builder/   QuestionEditor with accept/reject rewrites
  components/survey-fill/      Timing capture, question inputs
  components/filter-builder/   Audience panel with debounced live count
  pages/                  Marketing, auth, respondent, researcher, admin
server/                 Express API
  routes/                 auth, respondents, surveys, admin
  lib/ai/                 Claude + Addis AI wrappers, prompts, per-feature fallbacks
  lib/                    Supabase clients, auth middleware, rate limiting, consent log
shared/                 Imported by both sides
  fraud/                  scoreResponse, consistency check (pure, tested)
  matching/               buildMatchQuery                 (pure, tested)
  analytics/              aggregateResponses              (pure, tested)
  validation/             zod schemas
supabase/migrations/    Schema, RLS policies, restricted matching view
docs/                   Blueprint, deviations, demo script, prompt library
stitch_export/          Source designs (HTML + screenshots) the UI was built from
```

## Security notes

- **RLS on every table** holding personal data, with explicit minimal policies.
- **Researchers never query `respondent_profiles`.** Matching goes through
  `respondent_match_view`, which exposes only what filtering needs.
- **The service-role key stays in `server/`.** `npm run check:service-role`
  enforces it, and Vite cannot expose a non-`VITE_` variable to the bundle anyway.
- **No raw Fayda ID is stored** — only a SHA-256 hash with a server-side pepper,
  enough to detect duplicate registrations. We request no demographic data from
  Fayda; name and date of birth stay with the issuer.
- **Fayda verification never fails open.** Anything short of an explicit
  confirmation refuses the tier, and the endpoint is rate-limited so it cannot be
  used to probe which ID numbers exist.
- **Uploads validated server-side** for MIME type and size before reaching
  storage. Admin previews use short-lived signed URLs.
- **Prompt injection is contained** because no prompt can take an action, and no
  model call is involved in the fraud decision at all.

## Fayda verification

Respondents type their 12-digit Fayda Identification Number and the server verifies
it against Fayda. Set `FAYDA_API_BASE_URL` and `FAYDA_API_KEY` to use the live
service.

Without those, `ALLOW_FAYDA_STUB=true` accepts five reserved demo numbers
(`300000000001`–`300000000005`) so the flow is demoable, and the UI labels such a
pass as coming from the demo directory. Set the flag to `false` anywhere real users
can reach the app: with it off, an unconfigured integration refuses verification
rather than handing out verified tiers.

## What is not built

Deferred exactly as the blueprint's own Post-hack labels anticipate: Telebirr and
CBE payouts, longitudinal re-contact, the researcher marketplace and hiring flow,
dataset licensing with consent-lineage certificates, and the USSD/voice channel.
