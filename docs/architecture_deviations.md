# Implementation deviations from the technical blueprint

`docs/technical_blueprint.md` is committed verbatim as the design reference. This
document records where the implementation intentionally differs, and why.

## 1. React + Vite instead of Next.js (the one requested change)

The blueprint specifies Next.js 14 with the App Router. This build uses **React
18 + Vite + React Router**. Everything else in the blueprint is unchanged.

Because Next.js was providing both the UI framework *and* the backend (API
routes), removing it means the backend needs its own home:

| Blueprint (Next.js) | This build (React) |
|---|---|
| App Router file routes under `app/` | `react-router-dom` route table in `src/App.tsx` |
| Route groups `(auth)`, `(respondent)`, `(researcher)` | Layout components: `MarketingLayout`, `RespondentLayout`, `ResearcherLayout` |
| API routes under `app/api/**/route.ts` (Node runtime) | **Express server** under `server/routes/*.ts` |
| Server components for list/dashboard views | Client components fetching through `@tanstack/react-query` |
| `next/image`, `next/font` | Plain `<img>`; fonts loaded in `index.html` |
| Vercel serverless functions | One long-running Node process (`npm run start`) |
| `NEXT_PUBLIC_*` client env prefix | `VITE_*` client env prefix |

### What this changes about the security model

The blueprint's §17.3 rule is that `SUPABASE_SERVICE_ROLE_KEY` must never appear
outside `app/api`. The equivalent boundary here is that it must never appear
outside `server/`. Two things enforce it:

- `server/lib/supabase.ts` is the only module that reads the key, and nothing in
  `src/` imports it.
- `npm run check:service-role` fails the build if any service-role reference
  appears in `src/` or `shared/`.

Vite makes this boundary stricter than Next.js did, since only `VITE_`-prefixed
variables are exposed to the client bundle at all. A server-side variable cannot
leak into the browser through a mistaken import; it simply resolves to undefined.

### What this changes about server-rendered pages

Losing server components means the first paint is a client render. The blueprint's
accessibility target (LCP under 3s on throttled 3G) is met instead by
code-splitting: the researcher and admin screens, which carry the charting
library, load on demand. A respondent's initial download is ~108 kB gzipped
rather than the ~225 kB it would be if charts were in the entry bundle.

## 2. Structure of the shared decision logic

The blueprint places `lib/matching`, `lib/fraud`, and `lib/validation` inside the
Next.js app. Here they live in a top-level `shared/` directory imported by both
the client and the Express server, which is what lets a single zod schema run in
both places as §6.1 requires.

The pure-function property the blueprint relies on is preserved exactly:
`shared/fraud/score.ts` and `shared/matching/buildQuery.ts` take data in and
return decisions out, with no I/O and no dependency on any AI provider. They are
unit-tested without a database or an API key.

## 3. Consistency check is an AI-rephrased duplicate, not a profile question

The blueprint's consistency check (FR-RESP-6) re-asks a fact from the respondent's
verified profile — "what year are you in?" — and compares the answer to what the
platform already holds.

This build checks consistency differently. One of the survey's **first four choice
questions is reworded by Claude Haiku and re-inserted at a random position from the
fifth question onward**. If the respondent answers the two differently, the response
is flagged.

Three reasons for the change:

- It works for every respondent, including Tier 0 accounts with an empty profile,
  where a profile question has nothing to check against.
- It catches inattention on *this* survey rather than recall of registration
  details, which is what response quality actually turns on.
- It is invisible. A profile question stands out as unrelated to the survey; a
  reworded version of a question the respondent has already seen does not.

The mechanics keep it non-forgeable. The duplicate is generated per respondent, not
per survey, so respondents comparing notes cannot identify it. It is persisted to
`survey_targets.consistency_question`, so a reload shows the same question in the
same place, and the pairing is read back from there on submission rather than taken
from the request — the client is never told which question it duplicates, and never
reports whether the check passed.

Only choice questions are eligible: two free-text answers to the same question
legitimately differ in wording, so comparing them would generate false positives.
Surveys under five questions get no check at all, and a failed rephrase call skips
it. A skipped check scores as inconclusive, never as a failure.

## 4. Fraud output is a binary flag with no written explanation

The blueprint has three fraud states (`clean`, `needs_review`, `flagged`) and
requires every non-clean row to carry a one-sentence `fraud_reason`, written by
Claude Haiku from the signals.

This build reduces that to **two states and no prose**. `needs_review`,
`fraud_reason`, and the explanation prompt are all gone. A response is flagged or it
is not, and `fraud_signals` names the checks that tripped, which the dashboard
renders as a plain list.

The reasoning is that `needs_review` was not a fraud verdict, it was a deferral —
and nothing in the product consumed it, so in practice it meant researchers
discounting responses on a signal that had not actually established anything.
Inconclusive is not fraud, so it does not flag. The written explanation went for a
related reason: the flag is already fully determined by the signals, so a sentence
restating them added a model call per response without adding information.

The flagging rule, in `shared/fraud/score.ts`:

- **Flags on its own:** a failed consistency check, or a long free-text answer that
  was pasted or typed implausibly fast. Each of these is a contradiction or a
  demonstration that the answer was not composed in the field, not a suspicion.
- **Flags only together:** completing faster than the expected minimum, and
  straight-lining. Either alone describes a fast, decisive respondent.

## 5. Long free-text answers are checked for typing speed and pasting

Not in the blueprint. `useTextMetrics` records keystrokes, active typing time, and
paste events per free-text answer, and the scorer flags a long answer that arrived
with essentially no keystrokes behind it or at a rate above
`FRAUD_MAX_TYPING_CHARS_PER_SECOND`.

Two deliberate limits. Only answers at or above `FRAUD_LONG_TEXT_MIN_CHARS` (80 by
default) are examined — "yes" typed quickly carries no signal. And only *active*
typing counts toward elapsed time: pauses over three seconds are excluded, so a
respondent who stops to think is not measured as a slow typist, and someone pasting
an answer cannot hide it behind an idle period.

Like the question timer, none of this is shown to the respondent. A visible metric
is one that can be paced against.

## 6. Timing reconciliation

FR-RESP-5 says client timestamps are "reconciled server-side on submission".
Concretely, the server takes the lower of the reported total and the sum of the
per-question timings, so inflating the total to look thorough cannot help a rushed
response.

## 7. Fayda verification takes a FIN and calls Fayda

§8.2 leaves the Fayda route as a stub that grants Tier 1 on a button press. This
build implements the real flow: the respondent types their **12-digit Fayda
Identification Number**, and `server/lib/fayda.ts` verifies it against the Fayda
identity-authentication API.

Design decisions worth noting:

- **The FIN is never stored.** Only a SHA-256 of the number plus a server-side
  pepper, which is enough to stop one identity registering twice while keeping the
  sensitive value out of the database. The duplicate check runs before the Fayda
  call, so a reused FIN costs nothing.
- **No demographic data is requested.** We ask Fayda one question — is this a real,
  active identity — and take nothing else. Name, address, and date of birth stay
  with the issuer.
- **It never fails open.** Anything short of an explicit confirmation from Fayda
  returns `unavailable` or `not_found`, never `verified`. A timeout, an unparseable
  response, or an unrecognised status all refuse the tier.
- **Rate-limited to 5 attempts per 15 minutes**, because the endpoint would
  otherwise let someone probe which FIN numbers exist.

Set `FAYDA_API_BASE_URL` and `FAYDA_API_KEY` to verify against the live service.
When they are unset, `ALLOW_FAYDA_STUB` permits a handful of reserved demo FINs
(`300000000001`–`300000000005`) so the flow is demonstrable without credentials;
with the stub off, an unconfigured integration refuses verification rather than
handing out verified tiers. The UI labels a demo-directory verification explicitly,
so a stubbed pass is never mistaken for a real one.

## 8. Deferred to the pilot, as the blueprint anticipates

These are designed for but not built, matching the blueprint's own Post-hack
labels: Telebirr/CBE payouts (FR-RESP-8), longitudinal re-contact (FR-RESP-9),
the researcher marketplace and hiring flow (FR-RSR-9), dataset licensing with
consent-lineage certificates (FR-RSR-10), and the data-subject request tracker
UI (FR-ADM-2 — the API endpoint and the `consent_events` foundation exist).
