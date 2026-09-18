import { admin } from "./supabase.js";
import { TIER_LABEL, type VerificationTier } from "../../shared/types.js";

export interface RespondentNotificationItem {
  id: string;
  title: string;
  title_am?: string | null;
  body: string;
  body_am?: string | null;
  timestamp: string;
  created_at: string;
  section: "today" | "yesterday" | "older";
  is_read: boolean;
  type: "survey" | "earnings" | "withdrawal" | "verification" | "announcement" | "security";
  action_label: string;
  action_label_am?: string | null;
  action_url: string;
}

export function formatRelativeTimestamp(isoDateString: string, now = new Date()): string {
  const date = new Date(isoDateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return diffMins === 1 ? "1 min ago" : `${diffMins} mins ago`;
  if (diffHours < 24) {
    const isSameDay = now.getUTCDate() === date.getUTCDate() && now.getUTCMonth() === date.getUTCMonth() && now.getUTCFullYear() === date.getUTCFullYear();
    if (isSameDay) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays <= 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getNotificationSection(isoDateString: string, now = new Date()): "today" | "yesterday" | "older" {
  const date = new Date(isoDateString);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((nowDate - itemDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  return "older";
}

/**
 * Synchronizes real domain events for a respondent into persistent notifications.
 * Uses event_key for idempotency so existing notification read states are preserved.
 */
export async function syncRespondentNotifications(userId: string): Promise<void> {
  const now = new Date().toISOString();

  // 1. Fetch user to check verification tier and creation date
  const { data: user } = await admin
    .from("users")
    .select("id, full_name, verification_tier, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return;

  const notificationsToUpsert: Array<{
    user_id: string;
    title: string;
    title_am?: string;
    body: string;
    body_am?: string;
    type: "survey" | "earnings" | "withdrawal" | "verification" | "announcement" | "security";
    action_label: string;
    action_label_am?: string;
    action_url: string;
    event_key: string;
    created_at: string;
  }> = [];

  // Welcome notification
  notificationsToUpsert.push({
    user_id: userId,
    event_key: `welcome:${userId}`,
    title: "Welcome to Ethosk",
    title_am: "እንኳን ወደ ኢቶስክ በደህና መጡ",
    body: "Your respondent account is ready. Complete surveys and maintain high quality to earn rewards.",
    body_am: "የተሳታፊ መለያዎ ዝግጁ ነው። ጥናቶችን በማጠናቀቅ ሽልማት ያግኙ።",
    type: "announcement",
    action_label: "Complete Profile",
    action_label_am: "መገለጫዎን ያጠናቅቁ",
    action_url: "/profile",
    created_at: user.created_at || now,
  });

  // Verification tier notification
  if (user.verification_tier && user.verification_tier !== "0_registered") {
    const tier = user.verification_tier as VerificationTier;
    const tierName = TIER_LABEL[tier] ?? tier;
    notificationsToUpsert.push({
      user_id: userId,
      event_key: `verification_tier:${tier}`,
      title: "Account Verified",
      title_am: "መለያ ተረጋግጧል",
      body: `Your account has been verified for ${tierName}. You can now access more surveys and higher rewards.`,
      body_am: `መለያዎ ለ${tierName} ተረጋግጧል። አሁን ተጨማሪ ጥናቶችን ማግኘት ይችላሉ።`,
      type: "verification",
      action_label: "Verification",
      action_label_am: "ማረጋገጫ",
      action_url: "/verify",
      created_at: user.updated_at || user.created_at || now,
    });
  }

  // 2. Available surveys: active surveys targeted to user or active surveys not yet answered
  const { data: activeSurveys } = await admin
    .from("surveys")
    .select("id, title, reward_etb, questions, created_at, status")
    .eq("status", "active");

  const { data: answeredResponses } = await admin
    .from("survey_responses")
    .select("survey_id")
    .eq("respondent_id", userId);

  const answeredSurveyIds = new Set((answeredResponses ?? []).map((r) => r.survey_id));

  const { data: targets } = await admin
    .from("survey_targets")
    .select("survey_id, notified_at")
    .eq("respondent_id", userId);

  const targetedSurveyIds = new Set((targets ?? []).map((t) => t.survey_id));

  if (activeSurveys) {
    for (const survey of activeSurveys) {
      if (answeredSurveyIds.has(survey.id)) continue;
      // If targets exist in system, only include if user is targeted OR if no targeting is specified
      if (targets && targets.length > 0 && !targetedSurveyIds.has(survey.id)) continue;

      const qCount = Array.isArray(survey.questions) ? survey.questions.length : 5;
      const estMinutes = Math.max(3, Math.round(qCount * 1.5));
      const rewardText = survey.reward_etb ? ` Reward: ${survey.reward_etb} ETB.` : "";
      const rewardTextAm = survey.reward_etb ? ` ሽልማት: ${survey.reward_etb} ብር።` : "";

      notificationsToUpsert.push({
        user_id: userId,
        event_key: `survey_available:${survey.id}`,
        title: "New Survey Available",
        title_am: "አዲስ ጥናት አለ",
        body: `A new survey "${survey.title}" is waiting for you.${rewardText} Estimated time: ${estMinutes} mins.`,
        body_am: `አዲስ ጥናት "${survey.title}" ተዘጋጅቶ ይጠብቅዎታል።${rewardTextAm} ግምታዊ ጊዜ: ${estMinutes} ደቂቃ።`,
        type: "survey",
        action_label: "Browse Surveys →",
        action_label_am: "ጥናቶችን ይመልከቱ →",
        action_url: "/inbox",
        created_at: survey.created_at || now,
      });
    }
  }

  // 3. Respondent earnings & payouts
  const { data: payouts } = await admin
    .from("respondent_payouts")
    .select("id, amount_etb, status, created_at, surveys(title)")
    .eq("respondent_id", userId)
    .order("created_at", { ascending: false });

  if (payouts) {
    for (const payout of payouts) {
      const surveyInfo = Array.isArray(payout.surveys) ? payout.surveys[0] : payout.surveys;
      const surveyTitle = surveyInfo?.title || "Research Study";

      if (payout.status === "paid" || payout.status === "available") {
        notificationsToUpsert.push({
          user_id: userId,
          event_key: `payout_credited:${payout.id}`,
          title: "Earnings Credited",
          title_am: "ገቢ ተከፍሏል",
          body: `You earned ${payout.amount_etb} ETB for completing the '${surveyTitle}' survey.`,
          body_am: `ለ'${surveyTitle}' ጥናት ምላሽ ስለሰጡ ${payout.amount_etb} ብር ወደ ቦርሳዎ ገቢ ተደርጓል።`,
          type: "earnings",
          action_label: "Earnings Dashboard",
          action_label_am: "የገቢ ዳሽቦርድ",
          action_url: "/wallet",
          created_at: payout.created_at || now,
        });
      } else if (payout.status === "pending") {
        notificationsToUpsert.push({
          user_id: userId,
          event_key: `payout_pending:${payout.id}`,
          title: "Reward Under Review",
          title_am: "ሽልማት በማረጋገጥ ላይ",
          body: `Your submission for '${surveyTitle}' has been received. Your reward of ${payout.amount_etb} ETB is pending quality review.`,
          body_am: `የ'${surveyTitle}' ጥናት ምላሽዎ ደርሷል። የ ${payout.amount_etb} ብር ሽልማትዎ ጥራት በማረጋገጥ ላይ ነው።`,
          type: "earnings",
          action_label: "View History",
          action_label_am: "ታሪክ ይመልከቱ",
          action_url: "/history",
          created_at: payout.created_at || now,
        });
      }
    }
  }

  // 4. Respondent withdrawals
  const { data: withdrawals } = await admin
    .from("respondent_withdrawals")
    .select("id, amount_etb, method, status, created_at, updated_at")
    .eq("respondent_id", userId)
    .order("created_at", { ascending: false });

  if (withdrawals) {
    for (const withdrawal of withdrawals) {
      const methodLabel = withdrawal.method || "Telebirr";
      if (withdrawal.status === "completed") {
        notificationsToUpsert.push({
          user_id: userId,
          event_key: `withdrawal_completed:${withdrawal.id}`,
          title: "Withdrawal Completed",
          title_am: "ገንዘብ ማውጣት ተጠናቋል",
          body: `Your withdrawal of ${withdrawal.amount_etb} ETB via ${methodLabel} has been processed successfully.`,
          body_am: `የ ${withdrawal.amount_etb} ብር ማውጣትዎ በ${methodLabel} በስኬት ተጠናቋል።`,
          type: "withdrawal",
          action_label: "Withdrawal History →",
          action_label_am: "የማውጣት ታሪክ →",
          action_url: "/wallet/history",
          created_at: withdrawal.updated_at || withdrawal.created_at || now,
        });
      } else if (withdrawal.status === "pending") {
        notificationsToUpsert.push({
          user_id: userId,
          event_key: `withdrawal_pending:${withdrawal.id}`,
          title: "Withdrawal Processing",
          title_am: "ገንዘብ ማውጣት በሂደት ላይ",
          body: `Your withdrawal of ${withdrawal.amount_etb} ETB via ${methodLabel} has been initiated and is being processed.`,
          body_am: `የ ${withdrawal.amount_etb} ብር ማውጣትዎ በ${methodLabel} ተጀምሮ በሂደት ላይ ይገኛል።`,
          type: "withdrawal",
          action_label: "Withdrawal History →",
          action_label_am: "የማውጣት ታሪክ →",
          action_url: "/wallet/history",
          created_at: withdrawal.created_at || now,
        });
      } else if (withdrawal.status === "failed") {
        notificationsToUpsert.push({
          user_id: userId,
          event_key: `withdrawal_failed:${withdrawal.id}`,
          title: "Withdrawal Failed",
          title_am: "ገንዘብ ማውጣት አልተሳካም",
          body: `Your withdrawal of ${withdrawal.amount_etb} ETB could not be completed and funds were refunded to your balance.`,
          body_am: `የ ${withdrawal.amount_etb} ብር ማውጣትዎ አልተሳካም፤ ገንዘቡ ወደ ሂሳብዎ ተመልሷል።`,
          type: "withdrawal",
          action_label: "Withdrawal History →",
          action_label_am: "የማውጣት ታሪክ →",
          action_url: "/wallet/history",
          created_at: withdrawal.updated_at || withdrawal.created_at || now,
        });
      }
    }
  }

  // 5. Query existing notifications for this user to avoid overwriting existing is_read status
  const { data: existingNotifs } = await admin
    .from("notifications")
    .select("event_key")
    .eq("user_id", userId);

  const existingKeys = new Set((existingNotifs ?? []).map((n) => n.event_key).filter(Boolean));

  const newRecords = notificationsToUpsert
    .filter((n) => !existingKeys.has(n.event_key))
    .map((n) => ({ ...n, is_read: false }));
  if (newRecords.length > 0) {
    await admin.from("notifications").insert(newRecords);
  }
}

/**
 * Retrieves all notifications for a respondent, formatted with relative timestamp and section.
 */
export async function getRespondentNotifications(userId: string): Promise<{
  notifications: RespondentNotificationItem[];
  unread_count: number;
}> {
  // Sync latest user events first
  await syncRespondentNotifications(userId);

  const { data: rows, error } = await admin
    .from("notifications")
    .select("id, title, title_am, body, body_am, type, action_label, action_label_am, action_url, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !rows) {
    return { notifications: [], unread_count: 0 };
  }

  const now = new Date();
  let unreadCount = 0;

  const notifications: RespondentNotificationItem[] = rows.map((row) => {
    const isRead = Boolean(row.is_read);
    if (!isRead) unreadCount++;

    return {
      id: row.id,
      title: row.title,
      title_am: row.title_am ?? null,
      body: row.body,
      body_am: row.body_am ?? null,
      timestamp: formatRelativeTimestamp(row.created_at, now),
      created_at: row.created_at,
      section: getNotificationSection(row.created_at, now),
      is_read: isRead,
      type: row.type,
      action_label: row.action_label,
      action_label_am: row.action_label_am ?? null,
      action_url: row.action_url,
    };
  });

  return {
    notifications,
    unread_count: unreadCount,
  };
}

/**
 * Marks a single notification as read for a user.
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  const { error } = await admin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await admin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);

  return !error;
}
