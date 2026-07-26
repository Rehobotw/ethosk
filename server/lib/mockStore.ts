import crypto from "node:crypto";

export interface UserRecord {
  id: string;
  role: "respondent" | "researcher" | "admin";
  full_name: string;
  phone: string;
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
  storage_path: string;
  status: string;
  ai_notes?: string | null;
  created_at: string;
}

class MockStore {
  users = new Map<string, UserRecord>();
  authUsers = new Map<string, AuthUserRecord>(); // email -> AuthUserRecord
  authUsersById = new Map<string, AuthUserRecord>(); // id -> AuthUserRecord
  sessions = new Map<string, string>(); // token -> userId
  respondentProfiles = new Map<string, RespondentProfileRecord>();
  researcherProfiles = new Map<string, ResearcherProfileRecord>();
  surveys = new Map<string, SurveyRecord>();
  surveyTargets: SurveyTargetRecord[] = [];
  surveyResponses: SurveyResponseRecord[] = [];
  researcherDeposits: ResearcherDepositRecord[] = [];
  respondentPayouts: RespondentPayoutRecord[] = [];
  documents: DocumentRecord[] = [];
  consentEvents: Array<{ id: string; user_id: string; event_type: string; details?: unknown; created_at: string }> = [];
  translationCache = new Map<string, { cache_key: string; target_language: string; translated_text: string; created_at: string }>();

  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.seedDemoData();
  }

  private seedDemoData() {
    const DEMO_PASSWORD = "ethosk-demo-2024";

    // 1. Researcher: Meron Tesfaye
    const researcherId = "11111111-1111-4111-a111-111111111111";
    const researcherPhone = "0911000001";
    const researcherEmail = "0911000001@phone.ethosk.local";
    
    this.addUser({
      id: researcherId,
      phone: researcherPhone,
      email: researcherEmail,
      password: DEMO_PASSWORD,
      fullName: "Meron Tesfaye",
      role: "researcher",
      tier: "3_institution_attested",
    });
    this.researcherProfiles.set(researcherId, {
      user_id: researcherId,
      bio: "Graduate researcher in education policy at Hawassa University.",
      institution: "Hawassa University",
      past_studies: [],
      rating: 4.8,
      verified: true,
    });
    this.researcherDeposits.push({
      id: crypto.randomUUID(),
      researcher_id: researcherId,
      amount_etb: 50000,
      method: "telebirr",
      reference: "DEMO-SEED-DEPOSIT-1",
      status: "completed",
      created_at: new Date().toISOString(),
    });

    // 2. Admin: Ethosk Operator
    const adminId = "22222222-2222-4222-a222-222222222222";
    this.addUser({
      id: adminId,
      phone: "0911000002",
      email: "0911000002@phone.ethosk.local",
      password: DEMO_PASSWORD,
      fullName: "Ethosk Operator",
      role: "admin",
      tier: "3_institution_attested",
    });

    // 3. Respondent Clean: Selam Girma
    const cleanId = "33333333-3333-4333-a333-333333333333";
    this.addUser({
      id: cleanId,
      phone: "0912000001",
      email: "0912000001@phone.ethosk.local",
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

    // 4. Respondent Bad: Dawit Alemu
    const badId = "44444444-4444-4444-a444-444444444444";
    this.addUser({
      id: badId,
      phone: "0912000002",
      email: "0912000002@phone.ethosk.local",
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
      const pNum = `09${String(10000000 + i + 100).slice(0, 8)}`;
      const pId = crypto.randomUUID();
      const isHeadline = i < 140;
      const isStudent = i % 3 !== 2;
      const university = isHeadline ? "Hawassa University" : UNIVERSITIES[i % UNIVERSITIES.length]!;
      const department = isHeadline ? "Sociology" : DEPARTMENTS[i % DEPARTMENTS.length]!;
      const year = isHeadline ? (i % 2 === 0 ? 3 : 4) : (i % 8) + 1;

      this.addUser({
        id: pId,
        phone: pNum,
        email: `${pNum}@phone.ethosk.local`,
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

    // 6. Draft Survey
    const draftId = "55555555-5555-4555-a555-555555555555";
    this.surveys.set(draftId, {
      id: draftId,
      researcher_id: researcherId,
      title: "Learning Approaches at Hawassa University",
      description: "This study looks at how undergraduates prepare for exams and which resources they struggle to reach.",
      questions: [
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
          text: "On average, how many hours per week do you study outside class?",
          type: "single_choice",
          options: ["Under 5", "5 to 10", "11 to 20", "More than 20"],
          required: true,
        },
        {
          id: "q4",
          text: "What single change would most improve your learning experience?",
          type: "text",
          required: true,
        },
      ],
      translations: {},
      status: "draft",
      reward_etb: 25,
      created_at: new Date().toISOString(),
    });

    // 7. Active Survey with Responses
    const activeId = "66666666-6666-4666-a666-666666666666";
    this.surveys.set(activeId, {
      id: activeId,
      researcher_id: researcherId,
      title: "Access to Specialized Healthcare in Mekelle",
      description: "Mapping travel distance and barriers to specialized healthcare.",
      questions: [
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
      ],
      translations: {},
      target_filters: { minVerificationTier: "2_attribute_verified" },
      status: "active",
      reward_etb: 30,
      escrow_etb: 660,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    });

    // Target panel respondents and seed responses
    const targets = panelIds.slice(0, 60);
    for (const rId of targets) {
      this.surveyTargets.push({
        survey_id: activeId,
        respondent_id: rId,
        notified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      });
    }

    for (let idx = 0; idx < 38; idx++) {
      const rId = targets[idx]!;
      const badFaith = idx % 17 === 0;
      const respId = crypto.randomUUID();
      const totalTime = badFaith ? 18 : 95 + (idx % 40);
      const flag = badFaith ? "flagged" : "clean";

      this.surveyResponses.push({
        id: respId,
        survey_id: activeId,
        respondent_id: rId,
        answers: {
          q1: badFaith ? "Reading course notes" : "Group study",
          q2: badFaith ? "Online is better" : "In-person is better",
        },
        time_per_question: { q1: Math.round(totalTime / 2), q2: Math.round(totalTime / 2) },
        total_time_seconds: totalTime,
        fraud_flag: flag,
        fraud_signals: badFaith ? { speedRun: true } : undefined,
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
    phone: string;
    email: string;
    password: string;
    fullName: string;
    role: "respondent" | "researcher" | "admin";
    tier: "0_registered" | "1_id_verified" | "2_attribute_verified" | "3_institution_attested";
  }) {
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: input.id,
      role: input.role,
      full_name: input.fullName,
      phone: input.phone,
      verification_tier: input.tier,
      created_at: now,
      updated_at: now,
    };
    const authUser: AuthUserRecord = {
      id: input.id,
      email: input.email,
      password: input.password,
      user_metadata: { role: input.role, full_name: input.fullName, phone: input.phone },
    };

    this.users.set(input.id, user);
    this.authUsers.set(input.email, authUser);
    this.authUsersById.set(input.id, authUser);
  }
}

export const mockStore = new MockStore();
mockStore.init();
