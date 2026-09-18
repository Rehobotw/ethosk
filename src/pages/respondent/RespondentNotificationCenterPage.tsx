import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/language";
import { api } from "@/lib/api";
import { LoadingBlock, Notice } from "@/components/ui";

export interface RespondentNotification {
  id: string;
  title: string;
  title_am?: string | null;
  body: string;
  body_am?: string | null;
  timestamp: string;
  created_at?: string;
  section: "today" | "yesterday" | "older";
  is_read: boolean;
  type: "survey" | "earnings" | "withdrawal" | "verification" | "announcement" | "security";
  action_label: string;
  action_label_am?: string | null;
  action_url: string;
}

export function RespondentNotificationCenterPage() {
  const { language } = useLanguage();
  const isAm = language === "am";
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{
    notifications: RespondentNotification[];
    unread_count: number;
  }>({
    queryKey: ["respondent-notifications"],
    queryFn: () =>
      api<{ notifications: RespondentNotification[]; unread_count: number }>(
        "/respondents/notifications",
      ),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/respondents/notifications/${id}/read`, { method: "PATCH" }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["respondent-notifications"] });
      const prev = queryClient.getQueryData<{
        notifications: RespondentNotification[];
        unread_count: number;
      }>(["respondent-notifications"]);
      if (prev) {
        queryClient.setQueryData(["respondent-notifications"], {
          ...prev,
          unread_count: Math.max(0, prev.unread_count - 1),
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n,
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["respondent-notifications"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["respondent-notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      api("/respondents/notifications/mark-all-read", { method: "POST" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["respondent-notifications"] });
      const prev = queryClient.getQueryData<{
        notifications: RespondentNotification[];
        unread_count: number;
      }>(["respondent-notifications"]);
      if (prev) {
        queryClient.setQueryData(["respondent-notifications"], {
          ...prev,
          unread_count: 0,
          notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["respondent-notifications"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["respondent-notifications"] });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const todayList = notifications.filter((n) => n.section === "today");
  const yesterdayList = notifications.filter((n) => n.section === "yesterday");
  const olderList = notifications.filter((n) => n.section === "older");

  return (
    <div className="max-w-[760px] mx-auto p-4 md:p-6 pb-24 font-['Inter',sans-serif] text-[#131b2e]">
      {/* ── Page Header (Exact Stitch Screen 5f2c25b2e4094134bbf82db389176089) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-on-surface tracking-tight mb-1">
            {isAm ? "ማሳወቂያዎች" : "Notifications"}
          </h1>
          <p className="text-sm text-[#40484f]">
            {isAm
              ? "የጥናት እንቅስቃሴዎችዎን እና የመለያዎን ሁኔታ ይከታተሉ።"
              : "Stay updated on your survey activities and account."}
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            className="text-xs font-bold text-[#005985] hover:bg-[#eaedff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#eaedff]/60 border border-[#c0c7d0]/40 w-fit cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span>{isAm ? "ሁሉንም እንደተነበበ ምልክት አድርግ" : "Mark All as Read"}</span>
          </button>
        )}
      </div>

      {error ? (
        <div className="mb-6">
          <Notice
            tone="error"
            title={isAm ? "ማሳወቂያዎችን መጫን አልተቻለም" : "Failed to load notifications"}
          >
            {error instanceof Error ? error.message : "Network error"}
          </Notice>
        </div>
      ) : null}

      {isLoading ? (
        <LoadingBlock label={isAm ? "በመጫን ላይ..." : "Loading notifications..."} />
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-[#c0c7d0]/40 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#717880] mb-3">
            <span className="material-symbols-outlined text-2xl">notifications_off</span>
          </div>
          <h3 className="text-base font-semibold text-[#131b2e] mb-1">
            {isAm ? "ምንም ማሳወቂያዎች የሉም" : "No Notifications Yet"}
          </h3>
          <p className="text-sm text-[#40484f] max-w-md mx-auto">
            {isAm
              ? "አዳዲስ ጥናቶች ሲገኙ፣ ክፍያዎች ሲፈጸሙ ወይም የመለያዎ ሁኔታ ሲቀየር እዚህ ያገኛሉ።"
              : "When new research surveys match your profile or payouts are processed, they will appear here."}
          </p>
        </div>
      ) : (
        /* ── Grouped Notifications List ── */
        <div className="flex flex-col gap-6">
          {/* Section: Today */}
          {todayList.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[#40484f] uppercase tracking-wider mb-2.5 px-1">
                {isAm ? "ዛሬ" : "Today"}
              </h2>
              <div className="flex flex-col gap-3">
                {todayList.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    isAm={isAm}
                    onRead={() => {
                      if (!item.is_read) {
                        markAsReadMutation.mutate(item.id);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Yesterday */}
          {yesterdayList.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[#40484f] uppercase tracking-wider mb-2.5 px-1">
                {isAm ? "ትናንት" : "Yesterday"}
              </h2>
              <div className="flex flex-col gap-3">
                {yesterdayList.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    isAm={isAm}
                    onRead={() => {
                      if (!item.is_read) {
                        markAsReadMutation.mutate(item.id);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Older */}
          {olderList.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-[#40484f] uppercase tracking-wider mb-2.5 px-1">
                {isAm ? "የቀድሞ" : "Older"}
              </h2>
              <div className="flex flex-col gap-3">
                {olderList.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    isAm={isAm}
                    onRead={() => {
                      if (!item.is_read) {
                        markAsReadMutation.mutate(item.id);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  item,
  isAm,
  onRead,
}: {
  item: RespondentNotification;
  isAm: boolean;
  onRead: () => void;
}) {
  const getIcon = () => {
    switch (item.type) {
      case "survey":
        return <span className="material-symbols-outlined text-[20px]">assignment</span>;
      case "earnings":
        return <span className="material-symbols-outlined text-[20px]">payments</span>;
      case "withdrawal":
        return <span className="material-symbols-outlined text-[20px]">account_balance</span>;
      case "verification":
        return <span className="material-symbols-outlined text-[20px]">verified_user</span>;
      case "announcement":
        return <span className="material-symbols-outlined text-[20px]">campaign</span>;
      case "security":
        return <span className="material-symbols-outlined text-[20px]">settings</span>;
      default:
        return <span className="material-symbols-outlined text-[20px]">notifications</span>;
    }
  };

  const title = isAm && item.title_am ? item.title_am : item.title;
  const body = isAm && item.body_am ? item.body_am : item.body;
  const actionLabel = isAm && item.action_label_am ? item.action_label_am : item.action_label;

  return (
    <div
      onClick={onRead}
      className={`block bg-white border rounded-xl p-5 hover:border-[#005985] hover:shadow-xs transition-all duration-200 relative group cursor-pointer ${
        !item.is_read ? "border-[#c0c7d0]/60" : "border-[#e2e7ff] opacity-90"
      }`}
    >
      {/* Left blue unread indicator border bar */}
      {!item.is_read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#005985] rounded-l-xl" />
      )}

      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
            !item.is_read
              ? "bg-[#2872a1]/10 text-[#005985] border-[#005985]/20 group-hover:bg-[#005985] group-hover:text-white"
              : "bg-[#f2f3ff] text-[#40484f] border-[#c0c7d0]/20 group-hover:bg-[#005985] group-hover:text-white"
          }`}
        >
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm font-semibold text-[#131b2e] flex items-center gap-2">
              <span>{title}</span>
              {!item.is_read && (
                <span className="w-2 h-2 rounded-full bg-[#005985]" />
              )}
            </h3>
            <span className="text-xs text-[#40484f] font-normal whitespace-nowrap ml-2">
              {item.timestamp}
            </span>
          </div>

          <p className="text-sm text-[#40484f] mb-3 leading-relaxed">{body}</p>

          <Link
            to={item.action_url}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex text-xs font-semibold text-[#005985] hover:underline"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
