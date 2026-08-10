import crypto from "node:crypto";

export interface UserRecord {
  id: string;
  role: "respondent" | "researcher" | "admin";
  full_name: string;
  email: string;
  email_verified?: boolean;
  national_id_hash?: string | null;
  fayda_verified_at?: string | null;
  verification_tier: "0_registered" | "1_id_verified" | "2_attribute_verified" | "3_institution_attested";
  created_at: string;
  updated_at: string;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  password: string;
  user_metadata: Record<string, unknown>;
}

export interface RespondentProfileRecord {
  user_id: string;
  university?: string | null;
  department?: string | null;
  year?: number | null;
  age?: number | null;
  gender?: string | null;
  region?: string | null;
  city?: string | null;
  employment_status?: string | null;
  occupation?: string | null;
  education_level?: string | null;
  primary_language?: string | null;
  employer?: string | null;
  attributes: Record<string, unknown>;
  updated_at: string;
}

export interface ResearcherProfileRecord {
  user_id: string;
  bio?: string | null;
  institution?: string | null;
  past_studies: unknown[];
  rating?: number | null;
  verified: boolean;
}

export interface SurveyRecord {
  id: string;
  researcher_id: string;
  title: string;
  description?: string | null;
  questions: unknown[];
  translations: Record<string, unknown>;
  target_filters?: Record<string, unknown> | null;
  status: "draft" | "active" | "closed";
  reward_etb: number;
  escrow_etb?: number;
  created_at: string;
  sent_at?: string | null;
}

export interface SurveyTargetRecord {
  survey_id: string;
  respondent_id: string;
  notified_at: string;
  consistency_question?: Record<string, unknown> | null;
}

export interface SurveyResponseRecord {
  id: string;
  survey_id: string;
  respondent_id: string;
  answers: Record<string, unknown>;
  time_per_question: Record<string, number>;
  total_time_seconds: number;
  fraud_flag: "clean" | "flagged";
  fraud_signals?: Record<string, unknown> | null;
  completed_at: string;
}

export interface ResearcherDepositRecord {
  id: string;
  researcher_id: string;
  amount_etb: number;
  method: string;
  reference: string;
  status: string;
  created_at: string;
}

export interface RespondentPayoutRecord {
  id: string;
  response_id: string;
  survey_id: string;
  respondent_id: string;
  researcher_id: string;
  amount_etb: number;
  status: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  doc_type: string;
  status: string;
  ai_notes?: string | null;
  created_at: string;
}

const DEMO_PASSWORD = "ethosk-demo-2024";

class MockDatabaseStore {
  private initialized = false;

  users = new Map<string, UserRecord>();
  authUsers = new Map<string, AuthUserRecord>();
  authUsersById = new Map<string, AuthUserRecord>();
  sessions = new Map<string, string>();
  respondentProfiles = new Map<string, RespondentProfileRecord>();
  researcherProfiles = new Map<string, ResearcherProfileRecord>();
  surveys = new Map<string, SurveyRecord>();
  surveyTargets: SurveyTargetRecord[] = [];
  surveyResponses: SurveyResponseRecord[] = [];
  researcherDeposits: ResearcherDepositRecord[] = [];
  respondentPayouts: RespondentPayoutRecord[] = [];
  documents: DocumentRecord[] = [];
  consentEvents: Record<string, unknown>[] = [];
  translationCache = new Map<string, unknown>();

  ensureDemoRespondent() {
    const cleanId = "33333333-3333-4333-a333-333333333333";
    const email = "respondent@ethosk.com";
    if (!this.users.has(cleanId) || !this.authUsers.has(email)) {
      this.addUser({
        id: cleanId,
        email: email,
        password: DEMO_PASSWORD,
        fullName: "Selam Girma",
        role: "respondent",
        tier: "2_attribute_verified",
      });
      this.respondentProfiles.set(cleanId, {
        user_id: cleanId,
        university: "Hawassa University",
        department: "Sociology",
        year: 3,
        age: 22,
        gender: "female",
        region: "Sidama",
        city: "Hawassa",
        employment_status: "student",
        attributes: {},
        updated_at: new Date().toISOString(),
      });
    }
  }

  ensureDemoResearcher() {
    const researcherId = "11111111-1111-4111-a111-111111111111";
    const email = "researcher@ethosk.com";
    if (!this.users.has(researcherId) || !this.authUsers.has(email)) {
      this.addUser({
        id: researcherId,
        email: email,
        password: DEMO_PASSWORD,
        fullName: "Abebe Bekele",
        role: "researcher",
        tier: "2_attribute_verified",
      });
      this.researcherProfiles.set(researcherId, {
        user_id: researcherId,
        bio: "Senior Healthcare & Public Policy Analyst",
        institution: "Addis Ababa University",
        past_studies: [],
        rating: 4.9,
        verified: true,
      });
    }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Researcher: Abebe Bekele
    const researcherId = "11111111-1111-4111-a111-111111111111";
    this.addUser({
      id: researcherId,
      email: "researcher@ethosk.com",
      password: DEMO_PASSWORD,
      fullName: "Abebe Bekele",
      role: "researcher",
      tier: "2_attribute_verified",
    });
    this.researcherProfiles.set(researcherId, {
      user_id: researcherId,
      bio: "Senior Healthcare & Public Policy Analyst",
      institution: "Addis Ababa University",
      past_studies: [],
      rating: 4.9,
      verified: true,
    });
    this.researcherDeposits.push({
      id: crypto.randomUUID(),
      researcher_id: researcherId,
      amount_etb: 50000,
      method: "telebirr",
      reference: "DEMO-DEPOSIT-001",
      status: "completed",
      created_at: new Date().toISOString(),
    });

    // 2. Admin User
    const adminId = "22222222-2222-4222-a222-222222222222";
    this.addUser({
      id: adminId,
      email: "admin@ethosk.com",
      password: DEMO_PASSWORD,
      fullName: "Ethosk Admin",
      role: "admin",
      tier: "3_institution_attested",
    });

    // 3. Respondent Clean: Hiwot Tadesse
    const cleanId = "33333333-3333-4333-a333-333333333333";
    this.addUser({
      id: cleanId,
      email: "respondent@ethosk.com",
      password: DEMO_PASSWORD,
      fullName: "Hiwot Tadesse",
      role: "respondent",
      tier: "2_attribute_verified",
    });
    this.respondentProfiles.set(cleanId, {
      user_id: cleanId,
      university: "Hawassa University",
      department: "Sociology",
      year: 3,
      age: 22,
      gender: "female",
      region: "Sidama",
      city: "Hawassa",
      employment_status: "student",
      attributes: {},
      updated_at: new Date().toISOString(),
    });

    // 4. Respondent Bad: Dawit Alemu
    const badId = "44444444-4444-4444-a444-444444444444";
    this.addUser({
      id: badId,
      email: "dawit@ethosk.com",
      password: DEMO_PASSWORD,
      fullName: "Dawit Alemu",
      role: "respondent",
      tier: "2_attribute_verified",
    });
    this.respondentProfiles.set(badId, {
      user_id: badId,
      university: "Hawassa University",
      department: "Sociology",
      year: 4,
      age: 24,
      gender: "male",
      region: "Sidama",
      city: "Hawassa",
      employment_status: "student",
      attributes: {},
      updated_at: new Date().toISOString(),
    });

    // 5. Panel Respondents (170)
    const UNIVERSITIES = ["Hawassa University", "Addis Ababa University", "Jimma University", "Bahir Dar University", "Mekelle University"];
    const DEPARTMENTS = ["Sociology", "Economics", "Public Health", "Information Technology", "Education"];
    const REGIONS = ["Sidama", "Addis Ababa", "Oromia", "Amhara", "Tigray", "Dire Dawa", "South Ethiopia"];
    const CITIES = ["Hawassa", "Addis Ababa", "Adama", "Bahir Dar", "Mekelle", "Dire Dawa", "Arba Minch"];
    const panelIds: string[] = [cleanId, badId];

    for (let i = 0; i < 170; i++) {
      const pId = crypto.randomUUID();
      const isHeadline = i < 140;
      const isStudent = i % 3 !== 2;
      const university = isHeadline ? "Hawassa University" : UNIVERSITIES[i % UNIVERSITIES.length]!;
      const department = isHeadline ? "Sociology" : DEPARTMENTS[i % DEPARTMENTS.length]!;
      const year = isHeadline ? (i % 2 === 0 ? 3 : 4) : (i % 8) + 1;

      this.addUser({
        id: pId,
        email: `panel_${i + 1}@ethosk.com`,
        password: DEMO_PASSWORD,
        fullName: `Panel Respondent ${i + 1}`,
        role: "respondent",
        tier: i % 12 === 0 ? "1_id_verified" : "2_attribute_verified",
      });

      this.respondentProfiles.set(pId, {
        user_id: pId,
        university: isStudent ? university : null,
        department: isStudent ? department : null,
        year: isStudent ? year : null,
        age: isStudent ? 19 + (i % 10) : 26 + (i % 30),
        gender: i % 2 === 0 ? "female" : "male",
        region: REGIONS[i % REGIONS.length]!,
        city: CITIES[i % CITIES.length]!,
        employment_status: isStudent ? "student" : "employed",
        attributes: {},
        updated_at: new Date().toISOString(),
      });
      panelIds.push(pId);
    }

    // 6. Draft Survey: Learning Approaches at Hawassa University
    const draftId = "55555555-5555-4555-a555-555555555555";
    this.surveys.set(draftId, {
      id: draftId,
      researcher_id: researcherId,
      title: "Learning Approaches at Hawassa University",
      description: "This study looks at how undergraduates prepare for exams and which learning resources they find most effective.",
      questions: [
        {
          id: "q1",
          text: "Which study method do you rely on most when preparing for examinations?",
          type: "single_choice",
          options: ["Reading course notes", "Group study with peers", "Past exam papers", "Online video tutorials"],
          required: true,
        },
        {
          id: "q2",
          text: "How would you compare your experience of online learning to in-person lectures?",
          type: "single_choice",
          options: ["Online is better", "About the same", "In-person is better", "Not sure"],
          required: true,
        },
        {
          id: "q3",
          text: "On average, how many hours per week do you dedicate to self-study outside class?",
          type: "single_choice",
          options: ["Under 5 hours", "5 to 10 hours", "11 to 20 hours", "More than 20 hours"],
          required: true,
        },
        {
          id: "q4",
          text: "What single academic resource or change would most improve your learning experience?",
          type: "text",
          required: true,
        },
      ],
      translations: {},
      status: "draft",
      reward_etb: 25,
      created_at: new Date().toISOString(),
    });

    // 7. Active Survey with Responses: Access to Specialized Healthcare in Mekelle
    const activeId = "66666666-6666-4666-a666-666666666666";
    this.surveys.set(activeId, {
      id: activeId,
      researcher_id: researcherId,
      title: "Access to Specialized Healthcare in Mekelle",
      description: "Mapping travel distance, financial cost, and systemic barriers to specialized medical care in Mekelle and surrounding districts.",
      questions: [
        {
          id: "q1",
          text: "What is the primary barrier to accessing specialized healthcare in your area?",
          type: "single_choice",
          options: [
            "Travel distance to referral hospital",
            "High cost of private consultation",
            "Long waiting times for specialist appointments",
            "Lack of specialized diagnostic equipment",
          ],
          required: true,
        },
        {
          id: "q2",
          text: "How far do you typically travel to see a medical specialist?",
          type: "single_choice",
          options: ["Under 10 km", "10 - 50 km", "50 - 150 km", "Over 150 km"],
          required: true,
        },
        {
          id: "q3",
          text: "Have you or your family used digital health or telemedicine consultations?",
          type: "single_choice",
          options: ["Yes, multiple times", "Yes, once", "No, but interested", "No, prefer in-person only"],
          required: true,
        },
      ],
      translations: {},
      target_filters: { minVerificationTier: "2_attribute_verified" },
      status: "active",
      reward_etb: 30,
      escrow_etb: 1800,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    });

    // Target panel respondents and seed 38 realistic responses
    const targets = panelIds.slice(0, 60);
    for (const rId of targets) {
      this.surveyTargets.push({
        survey_id: activeId,
        respondent_id: rId,
        notified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      });
    }

    const q1Options = [
      "Travel distance to referral hospital",
      "High cost of private consultation",
      "Long waiting times for specialist appointments",
      "Lack of specialized diagnostic equipment",
    ];

    const q2Options = [
      "50 - 150 km",
      "10 - 50 km",
      "Over 150 km",
      "Under 10 km",
    ];

    const q3Options = [
      "No, but interested",
      "Yes, once",
      "No, prefer in-person only",
      "Yes, multiple times",
    ];

    for (let idx = 1; idx < 38; idx++) {
      const rId = targets[idx]!;
      const badFaith = idx === 5 || idx === 18 || idx === 31;
      const respId = crypto.randomUUID();
      const totalTime = badFaith ? 14 : 75 + (idx * 3) % 45;
      const flag = badFaith ? "flagged" : "clean";

      this.surveyResponses.push({
        id: respId,
        survey_id: activeId,
        respondent_id: rId,
        answers: {
          q1: q1Options[idx % q1Options.length]!,
          q2: q2Options[idx % q2Options.length]!,
          q3: q3Options[idx % q3Options.length]!,
        },
        time_per_question: {
          q1: Math.round(totalTime / 3),
          q2: Math.round(totalTime / 3),
          q3: Math.round(totalTime / 3),
        },
        total_time_seconds: totalTime,
        fraud_flag: flag,
        fraud_signals: badFaith
          ? {
              tripped: ["speed_run", "straight_line"],
              total_time_seconds: 14,
              expected_min_seconds: 45,
              straight_line_ratio: 1.0,
              max_typing_chars_per_second: null,
            }
          : undefined,
        completed_at: new Date(Date.now() - (38 - idx) * 3600000).toISOString(),
      });

      if (flag === "clean") {
        this.respondentPayouts.push({
          id: crypto.randomUUID(),
          response_id: respId,
          survey_id: activeId,
          respondent_id: rId,
          researcher_id: researcherId,
          amount_etb: 30,
          status: "available",
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  addUser(input: {
    id: string;
    email: string;
    password: string;
    fullName: string;
    role: "respondent" | "researcher" | "admin";
    tier: "0_registered" | "1_id_verified" | "2_attribute_verified" | "3_institution_attested";
    emailVerified?: boolean;
  }) {
    const now = new Date().toISOString();
    const emailLower = input.email.toLowerCase();
    const user: UserRecord = {
      id: input.id,
      role: input.role,
      full_name: input.fullName,
      email: emailLower,
      email_verified: input.emailVerified ?? true,
      verification_tier: input.tier,
      created_at: now,
      updated_at: now,
    };
    this.users.set(input.id, user);
    const authUser = {
      id: input.id,
      email: emailLower,
      password: input.password,
      user_metadata: { role: input.role, full_name: input.fullName, email: emailLower },
    };
    this.authUsers.set(emailLower, authUser);
    this.authUsersById.set(input.id, authUser);
  }
}

export const mockStore = new MockDatabaseStore();
