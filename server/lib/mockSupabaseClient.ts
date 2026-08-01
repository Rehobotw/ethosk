/**
 * In-memory stand-in for the Supabase client, used in local demo mode.
 *
 * `any` is unavoidable here and disabled for the file: this impersonates a
 * generically-typed fluent query builder whose row shape depends on a table name
 * chosen at runtime, so there is no static type to thread through. The types that
 * matter — the stored records — are declared in `mockStore.ts` and used at every
 * point where a row is written back.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { mockStore, type UserRecord, type RespondentProfileRecord, type ResearcherProfileRecord, type SurveyRecord, type DocumentRecord, type ResearcherDepositRecord, type RespondentPayoutRecord } from "./mockStore.js";

function getTierRank(tier?: string): number {
  switch (tier) {
    case "0_registered": return 0;
    case "1_id_verified": return 1;
    case "2_attribute_verified": return 2;
    case "3_institution_attested": return 3;
    default: return 0;
  }
}

class QueryBuilder {
  private tableName: string;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private actionData: any = null;
  private filters: Array<(row: Record<string, any>) => boolean> = [];
  private orderCol?: string;
  private orderAsc = true;
  private limitCount?: number;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getTableData(): Record<string, any>[] {
    mockStore.init();
    switch (this.tableName) {
      case "users":
        return Array.from(mockStore.users.values());
      case "respondent_profiles":
        return Array.from(mockStore.respondentProfiles.values());
      case "researcher_profiles":
        return Array.from(mockStore.researcherProfiles.values());
      case "surveys":
        return Array.from(mockStore.surveys.values());
      case "survey_targets":
        return mockStore.surveyTargets.map((t) => ({
          ...t,
          surveys: mockStore.surveys.get(t.survey_id) || null,
        }));
      case "survey_responses":
        return mockStore.surveyResponses.map((r) => ({
          ...r,
          surveys: mockStore.surveys.get(r.survey_id) || null,
          users: mockStore.users.get(r.respondent_id) || null,
        }));
      case "researcher_deposits":
        return [...mockStore.researcherDeposits];
      case "respondent_payouts":
        return mockStore.respondentPayouts.map((p) => ({
          ...p,
          surveys: mockStore.surveys.get(p.survey_id) || null,
        }));
      case "documents":
        return mockStore.documents.map((d) => ({
          ...d,
          user: mockStore.users.get(d.user_id) || null,
        }));
      case "consent_events":
        return [...mockStore.consentEvents];
      case "translation_cache":
        return Array.from(mockStore.translationCache.values());
      case "respondent_match_view": {
        const rows: Record<string, any>[] = [];
        for (const [userId, user] of mockStore.users.entries()) {
          if (user.role !== "respondent") continue;
          const profile = mockStore.respondentProfiles.get(userId) || {
            user_id: userId,
            attributes: {},
            updated_at: user.updated_at,
          };
          rows.push({
            user_id: userId,
            university: profile.university ?? null,
            department: profile.department ?? null,
            year: profile.year ?? null,
            age: profile.age ?? null,
            verification_tier: user.verification_tier,
            tier_rank: getTierRank(user.verification_tier),
          });
        }
        return rows;
      }
      case "researcher_wallet_view": {
        const rows: Record<string, any>[] = [];
        for (const [userId, user] of mockStore.users.entries()) {
          if (user.role !== "researcher") continue;
          let deposits = mockStore.researcherDeposits.filter((d) => d.researcher_id === userId && d.status === "completed");
          if (deposits.length === 0) {
            const autoDeposit: ResearcherDepositRecord = {
              id: crypto.randomUUID(),
              researcher_id: userId,
              amount_etb: 50000,
              method: "telebirr",
              reference: `AUTO-DEMO-${userId.slice(0, 8)}`,
              status: "completed",
              created_at: new Date().toISOString(),
            };
            mockStore.researcherDeposits.push(autoDeposit);
            deposits = [autoDeposit];
          }
          const deposited = deposits.reduce((sum, d) => sum + (d.amount_etb || 0), 0);
          const activeSurveys = Array.from(mockStore.surveys.values()).filter((s) => s.researcher_id === userId && s.status === "active");
          const reserved = activeSurveys.reduce((sum, s) => sum + (s.escrow_etb || 0), 0);
          const payouts = mockStore.respondentPayouts.filter((p) => p.researcher_id === userId);
          const paid = payouts.reduce((sum, p) => sum + (p.amount_etb || 0), 0);
          rows.push({
            researcher_id: userId,
            deposited_etb: deposited,
            reserved_etb: reserved,
            paid_etb: paid,
            available_etb: Math.max(50000, deposited - reserved - paid),
          });
        }
        return rows;
      }
      case "respondent_wallet_view": {
        const rows: Record<string, any>[] = [];
        for (const [userId, user] of mockStore.users.entries()) {
          if (user.role !== "respondent") continue;
          const payouts = mockStore.respondentPayouts.filter((p) => p.respondent_id === userId);
          const available = payouts.filter((p) => p.status === "available").reduce((sum, p) => sum + (p.amount_etb || 0), 0);
          const withdrawn = payouts.filter((p) => p.status === "withdrawn").reduce((sum, p) => sum + (p.amount_etb || 0), 0);
          rows.push({
            respondent_id: userId,
            available_etb: available,
            withdrawn_etb: withdrawn,
            lifetime_etb: available + withdrawn,
            paid_response_count: payouts.length,
          });
        }
        return rows;
      }
      default:
        return [];
    }
  }

  select(_cols = "*", _opts?: { count?: string; head?: boolean }) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((row) => row[column] > value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  not(column: string, op: string, value: any) {
    if (op === "is") {
      this.filters.push((row) => row[column] !== value);
    }
    return this;
  }

  like(column: string, pattern: string) {
    const regex = new RegExp("^" + pattern.replace(/%/g, ".*") + "$");
    this.filters.push((row) => regex.test(String(row[column] ?? "")));
    return this;
  }

  ilike(column: string, pattern: string) {
    const regex = new RegExp("^" + pattern.replace(/%/g, ".*") + "$", "i");
    this.filters.push((row) => regex.test(String(row[column] ?? "")));
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  range(from: number, to: number) {
    this.limitCount = to - from + 1;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.actionData = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.actionData = data;
    return this;
  }

  upsert(data: any, _opts?: any) {
    this.action = "upsert";
    this.actionData = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  private resolveRows(): Record<string, any>[] {
    let rows = this.getTableData();
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }
    if (this.orderCol) {
      const col = this.orderCol;
      const asc = this.orderAsc ? 1 : -1;
      rows.sort((a, b) => (a[col] > b[col] ? asc : a[col] < b[col] ? -asc : 0));
    }
    if (this.limitCount !== undefined) {
      rows = rows.slice(0, this.limitCount);
    }
    return rows;
  }

  private executeWrite(): Record<string, any>[] {
    mockStore.init();
    if (this.action === "insert" || this.action === "upsert") {
      const items = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
      const createdItems: any[] = [];

      for (const item of items) {
        const id = item.id || crypto.randomUUID();
        const now = new Date().toISOString();
        const newItem = { ...item, id, created_at: item.created_at || now, updated_at: now };

        switch (this.tableName) {
          case "users":
            mockStore.users.set(id, newItem as UserRecord);
            break;
          case "respondent_profiles":
            mockStore.respondentProfiles.set(item.user_id, newItem as RespondentProfileRecord);
            break;
          case "researcher_profiles":
            mockStore.researcherProfiles.set(item.user_id, newItem as ResearcherProfileRecord);
            break;
          case "surveys":
            mockStore.surveys.set(id, newItem as SurveyRecord);
            break;
          case "survey_targets": {
            const existing = mockStore.surveyTargets.findIndex(
              (t) => t.survey_id === item.survey_id && t.respondent_id === item.respondent_id
            );
            if (existing >= 0) mockStore.surveyTargets[existing] = item;
            else mockStore.surveyTargets.push(item);
            break;
          }
          case "survey_responses": {
            const existing = mockStore.surveyResponses.findIndex(
              (r) => r.survey_id === item.survey_id && r.respondent_id === item.respondent_id
            );
            if (existing >= 0) mockStore.surveyResponses[existing] = item;
            else mockStore.surveyResponses.push(newItem);
            break;
          }
          case "researcher_deposits":
            mockStore.researcherDeposits.push(newItem as ResearcherDepositRecord);
            break;
          case "respondent_payouts":
            mockStore.respondentPayouts.push(newItem as RespondentPayoutRecord);
            break;
          case "documents":
            mockStore.documents.push(newItem as DocumentRecord);
            break;
          case "consent_events":
            mockStore.consentEvents.push(newItem);
            break;
          case "translation_cache":
            mockStore.translationCache.set(item.cache_key, item);
            break;
        }
        createdItems.push(newItem);
      }
      return createdItems;
    }

    if (this.action === "update") {
      const rows = this.resolveRows();
      const now = new Date().toISOString();
      for (const row of rows) {
        const updated = { ...row, ...this.actionData, updated_at: now };
        switch (this.tableName) {
          case "users":
            mockStore.users.set(row.id, updated as UserRecord);
            break;
          case "respondent_profiles":
            mockStore.respondentProfiles.set(row.user_id, updated as RespondentProfileRecord);
            break;
          case "researcher_profiles":
            mockStore.researcherProfiles.set(row.user_id, updated as ResearcherProfileRecord);
            break;
          case "surveys":
            mockStore.surveys.set(row.id, updated as SurveyRecord);
            break;
          case "documents": {
            const idx = mockStore.documents.findIndex((d) => d.id === row.id);
            if (idx >= 0) mockStore.documents[idx] = updated as DocumentRecord;
            break;
          }
          // Deposits move pending -> completed when the gateway confirms payment.
          // Without this the update was accepted and dropped, so a telebirr
          // deposit stayed pending forever and never reached the balance.
          case "researcher_deposits": {
            const idx = mockStore.researcherDeposits.findIndex((d) => d.id === row.id);
            if (idx >= 0) mockStore.researcherDeposits[idx] = updated as ResearcherDepositRecord;
            break;
          }
          case "respondent_payouts": {
            const idx = mockStore.respondentPayouts.findIndex((p) => p.id === row.id);
            if (idx >= 0) mockStore.respondentPayouts[idx] = updated as RespondentPayoutRecord;
            break;
          }
        }
      }
      return rows;
    }

    if (this.action === "delete") {
      const rows = this.resolveRows();
      for (const row of rows) {
        switch (this.tableName) {
          case "users":
            mockStore.users.delete(row.id);
            mockStore.authUsersById.delete(row.id);
            break;
          case "respondent_profiles":
            mockStore.respondentProfiles.delete(row.user_id);
            break;
          case "researcher_profiles":
            mockStore.researcherProfiles.delete(row.user_id);
            break;
          case "surveys":
            mockStore.surveys.delete(row.id);
            break;
        }
      }
      return rows;
    }

    return this.resolveRows();
  }

  then(resolve: (res: any) => void, reject?: (err: any) => void) {
    try {
      const rows = this.executeWrite();
      const count = rows.length;

      if (this.isSingle) {
        if (rows.length === 0) {
          resolve({ data: null, count: 0, error: { message: "Row not found", code: "PGRST116" } });
          return;
        }
        resolve({ data: rows[0], count: 1, error: null });
        return;
      }
      if (this.isMaybeSingle) {
        resolve({ data: rows[0] ?? null, count: rows.length > 0 ? 1 : 0, error: null });
        return;
      }
      resolve({ data: rows, count, error: null });
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, count: 0, error: err });
    }
  }
}

export function createMockSupabaseClient() {
  mockStore.init();
  return {
    from(tableName: string) {
      return new QueryBuilder(tableName);
    },
    auth: {
      admin: {
        async createUser(params: { email: string; password?: string; email_confirm?: boolean; user_metadata?: any }) {
          mockStore.init();
          const id = crypto.randomUUID();
          mockStore.authUsers.set(params.email, {
            id,
            email: params.email,
            password: params.password || "ethosk-demo-2024",
            user_metadata: params.user_metadata || {},
          });
          mockStore.authUsersById.set(id, {
            id,
            email: params.email,
            password: params.password || "ethosk-demo-2024",
            user_metadata: params.user_metadata || {},
          });
          return { data: { user: { id, email: params.email } }, error: null };
        },
        async updateUserById(id: string, attributes: { password?: string }) {
          mockStore.init();
          const authUser = mockStore.authUsersById.get(id);
          if (authUser && attributes.password) {
            authUser.password = attributes.password;
            const byEmail = mockStore.authUsers.get(authUser.email);
            if (byEmail) byEmail.password = attributes.password;
          }
          return { data: { user: authUser ? { id: authUser.id, email: authUser.email } : null }, error: null };
        },
        async deleteUser(id: string) {
          mockStore.init();
          const authUser = mockStore.authUsersById.get(id);
          if (authUser) {
            mockStore.authUsers.delete(authUser.email);
          }
          mockStore.authUsersById.delete(id);
          mockStore.users.delete(id);
          mockStore.respondentProfiles.delete(id);
          mockStore.researcherProfiles.delete(id);
          return { error: null };
        },
      },
      async getUser(token: string) {
        mockStore.init();
        const userId = mockStore.sessions.get(token);
        if (!userId) {
          return { data: { user: null }, error: { message: "Invalid token" } };
        }
        return { data: { user: { id: userId } }, error: null };
      },
      async signInWithPassword(params: { email: string; password?: string }) {
        mockStore.init();
        if (params.email === "0912000001@phone.ethosk.local") {
          mockStore.ensureDemoRespondent();
        } else if (params.email === "0911000001@phone.ethosk.local") {
          mockStore.ensureDemoResearcher();
        }
        const authUser = mockStore.authUsers.get(params.email);
        if (!authUser || (params.password && authUser.password !== params.password)) {
          return { data: { user: null, session: null }, error: { message: "Invalid credentials" } };
        }
        const token = `token-${crypto.randomUUID()}`;
        mockStore.sessions.set(token, authUser.id);
        return {
          data: {
            user: { id: authUser.id, email: authUser.email },
            session: { access_token: token },
          },
          error: null,
        };
      },
    },
    storage: {
      from(_bucket: string) {
        return {
          async upload(_path: string, _file: any) {
            return { data: { path: _path }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `/uploads/${path}` } };
          },
          async createSignedUrl(path: string) {
            return { data: { signedUrl: `/uploads/${path}` }, error: null };
          },
        };
      },
    },
  };
}
