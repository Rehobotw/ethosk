import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export interface RespondentNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  section: "today" | "yesterday" | "older";
  is_read: boolean;
  type: "survey" | "earnings" | "withdrawal" | "verification" | "announcement" | "security";
  action_label: string;
  action_url: string;
}

const initialNotifications: RespondentNotification[] = [
  {
    id: "r-notif-1",
    title: "New Survey Available",
    body: "A new survey on Consumer Habits is waiting for you. Estimated time: 10 mins.",
    timestamp: "2 hours ago",
    section: "today",
    is_read: false,
    type: "survey",
    action_label: "Browse Surveys →",
    action_url: "/inbox",
  },
  {
    id: "r-notif-2",
    title: "Earnings Credited",
    body: "You earned 50 ETB for completing the 'Tech Adoption' survey.",
    timestamp: "5 hours ago",
    section: "today",
    is_read: true,
    type: "earnings",
    action_label: "Earnings Dashboard",
    action_url: "/wallet",
  },
  {
    id: "r-notif-3",
    title: "Withdrawal Processing",
    body: "Your withdrawal of 500 ETB has been initiated and is being processed.",
    timestamp: "Yesterday",
    section: "yesterday",
    is_read: false,
    type: "withdrawal",
    action_label: "Withdrawal History →",
    action_url: "/wallet/history",
  },
  {
    id: "r-notif-4",
    title: "Account Verified",
    body: "Your account has been verified for Tier 1. You can now access more surveys.",
    timestamp: "3 days ago",
    section: "older",
    is_read: true,
    type: "verification",
    action_label: "Verification",
    action_url: "/verify",
  },
  {
    id: "r-notif-5",
    title: "New Feature: Express Payouts",
    body: "We've introduced express payouts for Tier 2 verified users. Read more about it.",
    timestamp: "1 week ago",
    section: "older",
    is_read: true,
    type: "announcement",
    action_label: "Help Center",
    action_url: "/help",
  },
  {
    id: "r-notif-6",
    title: "Security Alert",
    body: "Your password was changed successfully. If this wasn't you, contact support immediately.",
    timestamp: "2 weeks ago",
    section: "older",
    is_read: true,
    type: "security",
    action_label: "Profile Settings",
    action_url: "/profile",
  },
];

export function RespondentNotificationCenterPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [notifications, setNotifications] =
    useState<RespondentNotification[]>(initialNotifications);

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

        <button
          type="button"
          onClick={markAllAsRead}
          className="text-xs font-bold text-[#005985] hover:bg-[#eaedff] transition-colors flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#eaedff]/60 border border-[#c0c7d0]/40 w-fit cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">done_all</span>
          <span>{isAm ? "ሁሉንም እንደተነበበ ምልክት አድርግ" : "Mark All as Read"}</span>
        </button>
      </div>

      {/* ── Grouped Notifications List ── */}
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
                  onRead={() => markAsRead(item.id)}
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
                  onRead={() => markAsRead(item.id)}
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
                  onRead={() => markAsRead(item.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  item,
  onRead,
}: {
  item: RespondentNotification;
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
    }
  };

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
              <span>{item.title}</span>
              {!item.is_read && (
                <span className="w-2 h-2 rounded-full bg-[#005985]" />
              )}
            </h3>
            <span className="text-xs text-[#40484f] font-normal whitespace-nowrap ml-2">
              {item.timestamp}
            </span>
          </div>

          <p className="text-sm text-[#40484f] mb-3 leading-relaxed">{item.body}</p>

          <Link
            to={item.action_url}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex text-xs font-semibold text-[#005985] hover:underline"
          >
            {item.action_label}
          </Link>
        </div>
      </div>
    </div>
  );
}
