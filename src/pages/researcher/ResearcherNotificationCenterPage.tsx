import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  section: "today" | "yesterday" | "last_week";
  is_read: boolean;
  type: "approval" | "correction" | "milestone" | "announcement" | "billing" | "subscription";
  action_label: string;
  action_url: string;
  is_warning?: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Survey Approved: Q3 Consumer Habits",
    body: "Your survey has passed the compliance review and is now live for respondents.",
    timestamp: "2h ago",
    section: "today",
    is_read: false,
    type: "approval",
    action_label: "Go to Survey Management",
    action_url: "/researcher/surveys",
  },
  {
    id: "notif-2",
    title: "Correction Required: Mobile Usage Study",
    body: "Demographic targeting parameters need adjustment before approval.",
    timestamp: "5h ago",
    section: "today",
    is_read: false,
    type: "correction",
    is_warning: true,
    action_label: "Review Correction Workflow",
    action_url: "/researcher/surveys/srv-demo/edit",
  },
  {
    id: "notif-3",
    title: "100 New Responses: Agri-tech Survey",
    body: "You have crossed the 500 response milestone for this active survey.",
    timestamp: "Yesterday, 14:30",
    section: "yesterday",
    is_read: true,
    type: "milestone",
    action_label: "View Results",
    action_url: "/researcher/analytics",
  },
  {
    id: "notif-4",
    title: "New Feature: AI Audience Targeting",
    body: "We've launched a new tool to help you define your respondent demographic with greater precision.",
    timestamp: "Yesterday, 09:00",
    section: "yesterday",
    is_read: true,
    type: "announcement",
    action_label: "Read Announcement",
    action_url: "/help",
  },
  {
    id: "notif-5",
    title: "Invoice Paid: #INV-002",
    body: "Payment for your recent data collection campaign has been processed successfully.",
    timestamp: "Oct 12",
    section: "last_week",
    is_read: true,
    type: "billing",
    action_label: "View Billing Details",
    action_url: "/researcher/wallet",
  },
  {
    id: "notif-6",
    title: "Plan Renewal: Enterprise Tier",
    body: "Your enterprise subscription has been successfully renewed for another year.",
    timestamp: "Oct 10",
    section: "last_week",
    is_read: true,
    type: "subscription",
    action_label: "Manage Subscription",
    action_url: "/researcher/subscription",
  },
];

export function ResearcherNotificationCenterPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const todayList = notifications.filter((n) => n.section === "today");
  const yesterdayList = notifications.filter((n) => n.section === "yesterday");
  const lastWeekList = notifications.filter((n) => n.section === "last_week");

  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-8 pb-24 font-['Inter',sans-serif] text-[#131b2e]">
      {/* ── Page Header (Exact Stitch Screen 213c701efc9d45a6bc8c41d56ee2d13c) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#131b2e] tracking-tight mb-1">
            {isAm ? "ማሳወቂያዎች" : "Notifications"}
          </h1>
          <p className="text-xs sm:text-sm text-[#40484f]">
            {isAm
              ? "የጥናትዎን ሂደት እና የመለያዎን ሁኔታ ይከታተሉ።"
              : "Stay updated on your survey progress and account status."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/profile/settings"
            className="px-3.5 py-2 bg-white border border-[#c0c7d0] rounded-lg text-[#131b2e] text-xs font-semibold hover:bg-[#f2f3ff] transition-colors"
          >
            {isAm ? "የማሳወቂያ ቅንብሮች" : "Notification Settings"}
          </Link>
          <button
            type="button"
            onClick={markAllAsRead}
            className="px-3.5 py-2 text-[#005985] text-xs font-bold hover:bg-[#eff4ff] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            <span>{isAm ? "ሁሉንም እንደተነበበ ምልክት አድርግ" : "Mark All as Read"}</span>
          </button>
        </div>
      </div>

      {/* ── Notifications List ── */}
      <div className="flex flex-col gap-6">
        {/* Section 1: TODAY */}
        {todayList.length > 0 && (
          <div className="flex flex-col gap-3.5">
            <h2 className="text-[11px] font-bold text-[#40484f] uppercase tracking-wider sticky top-16 bg-[#faf8ff] py-1 z-0">
              {isAm ? "ዛሬ" : "Today"}
            </h2>
            {todayList.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onRead={() => markAsRead(item.id)}
              />
            ))}
          </div>
        )}

        {/* Section 2: YESTERDAY */}
        {yesterdayList.length > 0 && (
          <div className="flex flex-col gap-3.5 mt-2">
            <h2 className="text-[11px] font-bold text-[#40484f] uppercase tracking-wider sticky top-16 bg-[#faf8ff] py-1 z-0">
              {isAm ? "ትናንት" : "Yesterday"}
            </h2>
            {yesterdayList.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onRead={() => markAsRead(item.id)}
              />
            ))}
          </div>
        )}

        {/* Section 3: LAST WEEK */}
        {lastWeekList.length > 0 && (
          <div className="flex flex-col gap-3.5 mt-2">
            <h2 className="text-[11px] font-bold text-[#40484f] uppercase tracking-wider sticky top-16 bg-[#faf8ff] py-1 z-0">
              {isAm ? "ባለፈው ሳምንት" : "Last Week"}
            </h2>
            {lastWeekList.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onRead={() => markAsRead(item.id)}
              />
            ))}
          </div>
        )}

        {/* End of List Marker */}
        <div className="text-center py-6 mt-4">
          <p className="text-xs text-[#40484f]">
            {isAm
              ? "ሁሉንም ማሳወቂያዎችዎን አይተዋል።"
              : "You've reached the end of your notifications."}
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: () => void;
}) {
  const getIcon = () => {
    switch (item.type) {
      case "approval":
        return <span className="material-symbols-outlined text-[22px]">check_circle</span>;
      case "correction":
        return <span className="material-symbols-outlined text-[22px]">error</span>;
      case "milestone":
        return <span className="material-symbols-outlined text-[22px]">bar_chart</span>;
      case "announcement":
        return <span className="material-symbols-outlined text-[22px]">campaign</span>;
      case "billing":
        return <span className="material-symbols-outlined text-[22px]">receipt_long</span>;
      case "subscription":
        return <span className="material-symbols-outlined text-[22px]">workspace_premium</span>;
    }
  };

  return (
    <div
      onClick={onRead}
      className={`bg-white border rounded-xl p-5 flex gap-4 transition-all cursor-pointer relative group shadow-xs ${
        !item.is_read
          ? "border-[#c0c7d0] hover:border-[#005985]"
          : "border-[#e2e7ff] opacity-85 hover:opacity-100 hover:border-[#005985]"
      }`}
    >
      {/* Blue unread vertical indicator bar */}
      {!item.is_read && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-[#005985] rounded-r-full" />
      )}

      {/* Icon Circle */}
      <div
        className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
          item.is_warning
            ? "bg-[#ffdad6] text-[#ba1a1a] group-hover:bg-[#ba1a1a] group-hover:text-white"
            : !item.is_read
            ? "bg-[#eaedff] text-[#005985] group-hover:bg-[#005985] group-hover:text-white"
            : "bg-[#f2f3ff] text-[#50616b] group-hover:bg-[#005985] group-hover:text-white"
        }`}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-sm text-[#131b2e] leading-snug">{item.title}</h3>
          <span className="text-[11px] text-[#40484f] whitespace-nowrap ml-3 font-medium">
            {item.timestamp}
          </span>
        </div>
        <p className="text-xs text-[#40484f] mb-3 leading-relaxed">{item.body}</p>
        <Link
          to={item.action_url}
          className={`inline-flex items-center gap-1 text-xs font-bold hover:underline ${
            item.is_warning ? "text-[#ba1a1a]" : "text-[#005985]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{item.action_label}</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
