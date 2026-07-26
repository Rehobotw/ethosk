# Demo script

Target: **under 2 minutes live.** Rehearse it twice back to back before
presenting, on the actual device and network you will use.

## Seeded accounts

Created by `npm run seed`. Password for all of them: `ethosk-demo-2024`.

| Account | Phone | Notes |
|---|---|---|
| Researcher | `0911000001` | Meron Tesfaye. Owns a ready draft survey plus one active survey with 38 responses. |
| Admin | `0911000002` | Sees the document review queue. |
| Respondent (careful) | `0912000001` | Selam Girma. Hawassa · Sociology · Year 3 · Tier 2. |
| Respondent (bad-faith) | `0912000002` | Dawit Alemu. Hawassa · Sociology · Year 4 · Tier 2. |

Plus ~170 panel respondents, weighted so that Hawassa · Sociology · Year 3–4 ·
Tier 2 lands on a specific, non-round number.

If you want to show Fayda verification without live credentials, the demo FINs are
`300000000001` through `300000000005`, each usable once. The UI labels these as
demo-directory verifications, so say that out loud rather than letting it pass as a
live check.

**Have two browser profiles open before you start** — one signed in as the
researcher, one as a respondent. Switching accounts live costs 20 seconds you do
not have.

## Walkthrough

### 1. Improve and localise a question (~30s)

Signed in as the researcher, open the draft **"Learning Approaches at Hawassa
University"**.

Question 3 is deliberately badly written: *"Dont you think online learning is
better?"*

- Click **AI Improve** on it. The rewrite appears beside the original.
- Say the line that matters: *the model proposes, the researcher decides.* Click
  **Accept rewrite**.
- Click **Localize (AM/OR)**. Amharic and Afan Oromo appear per question.

### 2. Instant targeting (~20s)

This is the single most important beat of the demo. Do not rush it.

In the Audience Matching panel set: University = Hawassa University,
Department = Sociology, Academic year = Year 3, Min. tier = Tier 2.

- The matched count updates live, within a second or two of each change.
- Change **Min. tier to Tier 3** and let the count drop to near zero. The **Low
  Statistical Power** banner appears inline.
- Say: *the platform will still let you send — it just will not let you do it
  without knowing.* Set the tier back to Tier 2.

### 3. Send, then answer twice (~40s)

- Click **Send Survey**. It lands on the dashboard showing the targeted count.
- Switch to the **bad-faith respondent** first. Open the survey from the inbox and
  rush it: pick the same option repeatedly, contradict yourself on the reworded
  question, submit in under 20 seconds.
- Switch to the **careful respondent**. Answer thoughtfully and submit.

Two things to note aloud while filling. There is no visible timer — showing one
would let a rushing respondent pace themselves against the threshold. And one
question is a reworded duplicate of an earlier one, sitting somewhere after the
fifth; point out that you cannot tell which without going back to look.

### 4. Scoring, shown live (~15s)

Back on the researcher dashboard, open the survey's data view.

- The rushed response reads **Flagged**, listing the checks that tripped alongside
  the underlying numbers: time taken, expected minimum, share of identical answers,
  and fastest typing rate.
- The careful response reads **Clean**.

Say the important part: *there are two outcomes, flagged or not, and no AI anywhere
in the decision. The flag comes from a deterministic, unit-tested function. Every
model in this system could be down and these flags would be identical.*

### 5. Dashboard (~20s)

- Response count, completion rate, and per-question distribution charts.
- Flagged responses are excluded from the charts by default — toggle **Include
  flagged responses** to show that it is a choice, not a hidden filter.
- The three-bullet AI summary is present because the seeded survey clears the
  five-response minimum. On a fresh survey it says so plainly instead.

### 6. Wrap (~15s)

Narrate, clearly labelled as **not live in this build**: the marketplace hire
flow, Telebirr payouts, and the USSD/voice channel for respondents without
smartphones.

If you have live Fayda credentials configured, show the ID verification screen too:
the respondent types their FIN and we ask Fayda one question — is this a real
person. Without credentials, skip it rather than presenting the demo directory as a
live integration.

## Contingencies

- **Wifi drops or the count is slow:** switch to the backup video immediately.
  Decide this switch point during rehearsal, not on stage. Never narrate a frozen
  screen.
- **An AI provider is down:** the demo still works. Question improve returns the
  original, translation falls back to Claude, the summary is omitted, and the fraud
  flags are completely unaffected because no model is involved in producing them.
  Say so — a system that degrades honestly is the actual pitch.
- **A late fix breaks something after the freeze:** `git reset --hard v0-demo`
  rather than debugging live.

## Freeze procedure

1. Stop merging features 60–90 minutes before the slot.
2. Run this script twice back to back on the presentation device.
3. `git tag v0-demo && git push origin v0-demo`
4. Record the backup video immediately after a clean run, so it reflects the final
   build. Save it in two places.
5. Only rehearsal-discovered bug fixes go in after this point.

## Questions a sharp judge will ask

**"How do you know the document is real?"** We do not, and we never say we do. The
check is legibility and consistency with the claimed profile. Closing that gap
needs institutional attestation, which is Tier 3 and on the roadmap.

**"What if the AI hallucinates a fraud flag?"** It cannot. No model touches the
decision. The flag is computed by a deterministic, unit-tested function, and its
output is a flag plus the signals behind it — there is no AI-written explanation
anywhere in the fraud path.

**"Could a respondent game the checks?"** No timer is shown. The consistency check
is a reworded duplicate of an earlier question, generated per respondent so
comparing notes does not reveal it, placed at a random position after the fifth
question, and scored server-side against a pairing the client is never told. On long
written answers we also compare keystrokes against the text produced, so a pasted
answer is visible regardless of how long the respondent sat on the page.

**"Won't honest respondents get flagged?"** The two weak signals — speed and
repeated answers — never flag on their own, only together. What flags alone is
self-contradiction or text that demonstrably was not typed. And there is no
"needs review" limbo: inconclusive is not fraud, so it does not flag.

**"Is this compliant?"** It is designed around Proclamation 1321/2024 —
per-event consent logging, no raw national ID stored, row-level access control on
every table holding personal data. Actual compliance also requires Ethiopian data
residency and ECA registration, which is pilot-stage work.
