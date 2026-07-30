/**
 * Seeds the demo scenario from §19 of the blueprint.
 *
 * Creates real auth users and real rows so every screen renders against actual
 * data rather than mock JSON:
 *  - 1 researcher with a ready-to-present draft survey
 *  - 1 admin
 *  - 2 named demo respondents (one careful, one bad-faith)
 *  - 150+ additional respondents spanning several institutions/departments/years
 *  - enough completed responses that the analytics summary is not suppressed
 *
 * Safe to re-run: existing users are reused rather than duplicated.
 */
import "../server/loadEnv.js";
import { createClient } from "@supabase/supabase-js";
import type { Question } from "../shared/types.js";
import { scoreResponse } from "../shared/fraud/score.js";
import { serverSupabaseClientOptions } from "../server/lib/supabaseClientOptions.js";

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before seeding.",
  );
  process.exit(1);
}

const db = createClient(url, serviceRoleKey, serverSupabaseClientOptions());

const DEMO_PASSWORD = "ethosk-demo-2024";

const UNIVERSITIES = [
  "Hawassa University",
  "Addis Ababa University",
  "Jimma University",
  "Bahir Dar University",
  "Mekelle University",
];

const DEPARTMENTS = [
  "Sociology",
  "Economics",
  "Public Health",
  "Information Technology",
  "Education",
];

// General-population attributes, so the audience builder has something to filter
// on beyond the student panel and a non-academic study returns real matches.
const REGIONS = [
  "Sidama",
  "Addis Ababa",
  "Oromia",
  "Amhara",
  "Tigray",
  "Dire Dawa",
  "South Ethiopia",
];

const CITIES = ["Hawassa", "Addis Ababa", "Adama", "Bahir Dar", "Mekelle", "Dire Dawa", "Arba Minch"];

const OCCUPATIONS = [
  "Trader",
  "Teacher",
  "Nurse",
  "Farmer",
  "Civil servant",
  "Driver",
  "Shop assistant",
];

const NON_STUDENT_STATUSES = ["employed", "self_employed", "unemployed"] as const;

const LANGUAGES = ["amharic", "afan_oromo", "sidama", "tigrinya", "somali"] as const;

const EDUCATION = ["secondary", "tvet", "bachelors", "primary", "masters"] as const;

/** Funds the demo researcher so the send flow is not blocked by an empty balance. */
const DEMO_DEPOSIT_ETB = 50_000;

const DEMO_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Which approach do you rely on most when preparing for an exam?",
    type: "single_choice",
    options: ["Reading course notes", "Group study", "Past exam papers", "Recorded lectures"],
    required: true,
  },
  {
    id: "q2",
    text: "How would you compare your experience of online learning to in-person learning?",
    type: "single_choice",
    options: ["Online is better", "About the same", "In-person is better", "Not sure"],
    required: true,
  },
  {
    id: "q3",
    text: "Dont you think online learning is better?",
    type: "single_choice",
    options: ["Yes", "No", "Unsure"],
    required: true,
  },
  {
    id: "q4",
    text: "Which resources are hardest for you to access?",
    type: "multi_choice",
    options: ["Reliable internet", "Printed textbooks", "Quiet study space", "Lab equipment"],
    required: true,
  },
  {
    id: "q5",
    text: "On average, how many hours per week do you study outside class?",
    type: "single_choice",
    options: ["Under 5", "5 to 10", "11 to 20", "More than 20"],
    required: true,
  },
  {
    id: "q6",
    text: "How often do you use the university library?",
    type: "single_choice",
    options: ["Daily", "Weekly", "Monthly", "Rarely"],
    required: true,
  },
  {
    id: "q7",
    text: "What single change would most improve your learning experience?",
    type: "text",
    required: true,
  },
  {
    id: "q8",
    text: "Would you take part in a follow-up study next semester?",
    type: "single_choice",
    options: ["Yes", "No", "Maybe"],
    required: true,
  },
];

async function ensureUser(input: {
  phone: string;
  fullName: string;
  role: "respondent" | "researcher" | "admin";
  tier: string;
}): Promise<string> {
  const email = `${input.phone}@phone.ethosk.local`;

  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("phone", input.phone)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role: input.role, full_name: input.fullName, phone: input.phone },
  });

  if (error || !created.user) {
    throw new Error(`Could not create ${input.phone}: ${error?.message}`);
  }

  const { error: rowError } = await db.from("users").insert({
    id: created.user.id,
    role: input.role,
    full_name: input.fullName,
    phone: input.phone,
    verification_tier: input.tier,
  });

  if (rowError) throw new Error(`Could not insert user row: ${rowError.message}`);
  return created.user.id;
}

/**
 * Pays the clean responses on the seeded active survey and leaves the rest of its
 * budget reserved, so the wallet screens open on a state that actually occurs:
 * some money spent, some still committed, the flagged responses unpaid.
 */
async function seedPayouts(input: {
  surveyId: string;
  researcherId: string;
  rewardEtb: number;
  targetedCount: number;
}): Promise<void> {
  const { data: responses, error } = await db
    .from("survey_responses")
    .select("id, respondent_id, fraud_flag")
    .eq("survey_id", input.surveyId)
    .eq("fraud_flag", "clean");

  if (error) {
    console.warn(`  could not read responses for payouts: ${error.message}`);
    return;
  }

  const payouts = (responses ?? []).map((response) => ({
    response_id: response.id,
    survey_id: input.surveyId,
    respondent_id: response.respondent_id,
    researcher_id: input.researcherId,
    amount_etb: input.rewardEtb,
    status: "available",
  }));

  if (payouts.length > 0) {
    const { error: payoutError } = await db
      .from("respondent_payouts")
      .upsert(payouts, { onConflict: "response_id", ignoreDuplicates: true });

    if (payoutError) {
      console.warn(`  could not seed payouts: ${payoutError.message}`);
      return;
    }
  }

  const committed = input.rewardEtb * input.targetedCount;
  const remaining = Math.max(0, committed - input.rewardEtb * payouts.length);
  await db.from("surveys").update({ escrow_etb: remaining }).eq("id", input.surveyId);

  console.log(
    `  Paid ${payouts.length} responses (${(input.rewardEtb * payouts.length).toLocaleString()} ETB), ` +
      `${remaining.toLocaleString()} ETB still reserved`,
  );
}

function phoneFor(index: number): string {
  // Keeps every generated number inside the 09XXXXXXXX format the schema enforces.
  return `09${String(10_000_000 + index).slice(0, 8)}`;
}

async function main() {
  console.log("Seeding Ethosk demo data…\n");

  // --- Researcher and admin -------------------------------------------------
  const researcherId = await ensureUser({
    phone: "0911000001",
    fullName: "Meron Tesfaye",
    role: "researcher",
    tier: "3_institution_attested",
  });
  await db.from("researcher_profiles").upsert({
    user_id: researcherId,
    bio: "Graduate researcher in education policy at Hawassa University.",
    institution: "Hawassa University",
    verified: true,
    rating: 4.8,
  });
  console.log("  researcher_demo  0911000001");

  // Sending a survey now reserves its full reward budget, so the demo researcher
  // needs a funded balance or the send button fails on insufficient funds. The
  // reference is fixed, and unique per researcher, so re-seeding credits once.
  const { error: depositError } = await db.from("researcher_deposits").upsert(
    {
      researcher_id: researcherId,
      amount_etb: DEMO_DEPOSIT_ETB,
      method: "telebirr",
      reference: "DEMO-SEED-DEPOSIT-1",
      status: "completed",
    },
    { onConflict: "researcher_id,reference", ignoreDuplicates: true },
  );
  if (depositError) {
    console.warn(`  could not seed deposit: ${depositError.message}`);
  } else {
    console.log(`  wallet funded    ${DEMO_DEPOSIT_ETB.toLocaleString()} ETB`);
  }

  const adminId = await ensureUser({
    phone: "0911000002",
    fullName: "Ethosk Operator",
    role: "admin",
    tier: "3_institution_attested",
  });
  console.log(`  admin            0911000002 (${adminId.slice(0, 8)}…)`);

  // --- Named demo respondents ----------------------------------------------
  const cleanId = await ensureUser({
    phone: "0912000001",
    fullName: "Selam Girma",
    role: "respondent",
    tier: "2_attribute_verified",
  });
  await db.from("respondent_profiles").upsert({
    user_id: cleanId,
    university: "Hawassa University",
    department: "Sociology",
    year: 3,
    age: 22,
    attributes: {},
  });
  console.log("  respondent_clean 0912000001");

  const badId = await ensureUser({
    phone: "0912000002",
    fullName: "Dawit Alemu",
    role: "respondent",
    tier: "2_attribute_verified",
  });
  await db.from("respondent_profiles").upsert({
    user_id: badId,
    university: "Hawassa University",
    department: "Sociology",
    year: 4,
    age: 24,
    attributes: {},
  });
  console.log("  respondent_bad   0912000002");

  // --- Bulk respondent panel ------------------------------------------------
  // Weighted toward Hawassa Sociology years 3-4 so the demo's headline filter
  // lands on a specific, non-round number rather than something suspicious.
  console.log("\n  Creating panel respondents…");
  const panelIds: string[] = [];

  for (let i = 0; i < 170; i += 1) {
    const phone = phoneFor(i + 100);
    const isHeadlineSegment = i < 140;

    const university = isHeadlineSegment
      ? "Hawassa University"
      : (UNIVERSITIES[i % UNIVERSITIES.length] ?? "Hawassa University");
    const department = isHeadlineSegment
      ? "Sociology"
      : (DEPARTMENTS[i % DEPARTMENTS.length] ?? "Sociology");
    const year = isHeadlineSegment ? (i % 2 === 0 ? 3 : 4) : (i % 8) + 1;

    // A third of the panel is not studying at all, so a study of the general
    // public returns a real population rather than students with a job field set.
    const isStudent = i % 3 !== 2;

    try {
      const id = await ensureUser({
        phone,
        fullName: `Panel Respondent ${i + 1}`,
        role: "respondent",
        // A few remain at Tier 1 so raising the minimum tier visibly changes the count.
        tier: i % 12 === 0 ? "1_id_verified" : "2_attribute_verified",
      });

      await db.from("respondent_profiles").upsert({
        user_id: id,
        university: isStudent ? university : null,
        department: isStudent ? department : null,
        year: isStudent ? year : null,
        age: isStudent ? 19 + (i % 10) : 26 + (i % 30),
        gender: i % 2 === 0 ? "female" : "male",
        region: REGIONS[i % REGIONS.length] ?? "Sidama",
        city: CITIES[i % CITIES.length] ?? "Hawassa",
        employment_status: isStudent
          ? "student"
          : (NON_STUDENT_STATUSES[i % NON_STUDENT_STATUSES.length] ?? "employed"),
        occupation: isStudent ? null : (OCCUPATIONS[i % OCCUPATIONS.length] ?? "Trader"),
        education_level: isStudent ? "secondary" : (EDUCATION[i % EDUCATION.length] ?? "secondary"),
        primary_language: LANGUAGES[i % LANGUAGES.length] ?? "amharic",
        attributes: {},
      });

      panelIds.push(id);
    } catch (error) {
      console.warn(`    skipped ${phone}: ${(error as Error).message}`);
    }
  }
  console.log(`  ${panelIds.length} panel respondents ready`);

  // --- Draft survey, ready to present from ---------------------------------
  const { data: existingSurvey } = await db
    .from("surveys")
    .select("id")
    .eq("researcher_id", researcherId)
    .eq("title", "Learning Approaches at Hawassa University")
    .maybeSingle();

  let draftSurveyId = existingSurvey?.id as string | undefined;

  if (!draftSurveyId) {
    const { data: survey, error } = await db
      .from("surveys")
      .insert({
        researcher_id: researcherId,
        title: "Learning Approaches at Hawassa University",
        description:
          "This study looks at how undergraduates prepare for exams and which resources they " +
          "struggle to reach. It is part of a wider project on learning outcomes in southern " +
          "Ethiopia, run from the School of Education at Hawassa University.\n\n" +
          "It takes about three minutes. Your answers are reported only as totals across all " +
          "participants — no answer is ever linked back to you in any published result.",
        questions: DEMO_QUESTIONS,
        reward_etb: 25,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) throw new Error(`Could not create draft survey: ${error.message}`);
    draftSurveyId = survey.id;
  }
  console.log(`\n  Draft survey ready: ${draftSurveyId}`);

  // --- A second, already-active survey with responses ----------------------
  // Gives the dashboard something to show immediately, including enough
  // responses that the AI summary is not suppressed by FR-RSR-8a.
  const { data: existingActive } = await db
    .from("surveys")
    .select("id")
    .eq("researcher_id", researcherId)
    .eq("title", "Access to Specialized Healthcare in Mekelle")
    .maybeSingle();

  let activeSurveyId = existingActive?.id as string | undefined;

  if (!activeSurveyId) {
    const { data: survey, error } = await db
      .from("surveys")
      .insert({
        researcher_id: researcherId,
        title: "Access to Specialized Healthcare in Mekelle",
        description:
          "We are mapping how far people travel to reach specialist care, and what stops them " +
          "going sooner. Open to anyone living in the region, whether or not you have needed " +
          "specialist treatment yourself.\n\n" +
          "Around two minutes. Answers are aggregated before analysis.",
        questions: DEMO_QUESTIONS.slice(0, 5),
        reward_etb: 30,
        status: "active",
        sent_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        target_filters: { minVerificationTier: "2_attribute_verified" },
      })
      .select("id")
      .single();

    if (error) throw new Error(`Could not create active survey: ${error.message}`);
    activeSurveyId = survey.id;

    const targets = panelIds.slice(0, 60);
    await db.from("survey_targets").upsert(
      targets.map((respondentId) => ({ survey_id: activeSurveyId!, respondent_id: respondentId })),
      { onConflict: "survey_id,respondent_id", ignoreDuplicates: true },
    );

    const questions = DEMO_QUESTIONS.slice(0, 5);
    const rows = targets.slice(0, 38).map((respondentId, index) => {
      // Two explicitly bad-faith patterns, the rest answered plausibly.
      const badFaith = index % 17 === 0;

      const answers: Record<string, string> = {};
      questions.forEach((question, qIndex) => {
        if (question.type === "text") {
          answers[question.id] = badFaith ? "good" : "More reliable internet in the dormitories.";
          return;
        }
        const options = question.options ?? ["Yes"];
        answers[question.id] = badFaith
          ? (options[0] ?? "Yes")
          : (options[(index + qIndex) % options.length] ?? "Yes");
      });

      const totalTime = badFaith ? 18 : 95 + (index % 40);
      const { flag, signals } = scoreResponse({
        questionCount: questions.length,
        totalTimeSeconds: totalTime,
        answers,
        consistencyCheckPassed: !badFaith,
      });

      return {
        survey_id: activeSurveyId!,
        respondent_id: respondentId,
        answers,
        time_per_question: Object.fromEntries(
          questions.map((question) => [question.id, Math.round(totalTime / questions.length)]),
        ),
        total_time_seconds: totalTime,
        fraud_flag: flag,
        fraud_signals: signals,
      };
    });

    const { error: responseError } = await db
      .from("survey_responses")
      .upsert(rows, { onConflict: "survey_id,respondent_id", ignoreDuplicates: true });

    if (responseError) {
      console.warn(`  could not seed responses: ${responseError.message}`);
    } else {
      console.log(`  Active survey seeded with ${rows.length} responses`);
      await seedPayouts({
        surveyId: activeSurveyId!,
        researcherId,
        rewardEtb: 30,
        targetedCount: targets.length,
      });
    }
  } else {
    console.log(`  Active survey already present: ${activeSurveyId}`);
  }

  console.log(`
Done.

Sign in with any of these (password: ${DEMO_PASSWORD})
  Researcher   0911000001
  Admin        0911000002
  Respondent   0912000001   (answers carefully)
  Respondent   0912000002   (pre-scripted bad-faith behaviour)

Demo filter to land the headline count:
  Hawassa University · Sociology · Year 3-4 · Tier 2
`);
}

main().catch((error) => {
  console.error("\nSeeding failed:", error);
  process.exit(1);
});
