import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export interface AdminNotification {
  id: string;
  tag: string;
  tag_type: "error" | "primary" | "neutral";
  title: string;
  body: string;
  timestamp: string;
  section: "today" | "yesterday";
  is_read: boolean;
  is_high_priority?: boolean;
  icon: string;
  action_label: string;
  action_url: string;
  action_variant?: "primary" | "outline";
}

const initialAdminNotifications: AdminNotification[] = [
  {
    id: "admin-notif-1",
    tag: "System Alert",
    tag_type: "error",
    title: "High Priority: API Latency detected",
    body: "Elevated latency observed in the Payment Gateway integration. Potential impact on outgoing disbursements.",
    timestamp: "10 mins ago",
    section: "today",
    is_read: false,
    is_high_priority: true,
    icon: "warning",
    action_label: "System Status",
    action_url: "/admin/audit-logs",
    action_variant: "outline",
  },
  {
    id: "admin-notif-2",
    tag: "Survey Review",
    tag_type: "primary",
    title: "New Survey Submitted: Healthcare Access Study",
    body: "A new survey design requires admin approval before deployment to the respondent pool.",
    timestamp: "2 hours ago",
    section: "today",
    is_read: false,
    icon: "assignment",
    action_label: "Review Survey",
    action_url: "/admin/survey-approvals",
    action_variant: "primary",
  },
  {
    id: "admin-notif-3",
    tag: "Payments",
    tag_type: "neutral",
    title: "Large Withdrawal Request: 50,000 ETB",
    body: "Pending approval for respondent payout batch. Threshold exceeded.",
    timestamp: "5 hours ago",
    section: "today",
    is_read: true,
    icon: "account_balance",
    action_label: "Approve Payout",
    action_url: "/admin/payout-queue",
    action_variant: "outline",
  },
  {
    id: "admin-notif-4",
    tag: "Verification",
    tag_type: "neutral",
    title: "Researcher Identity Pending: Dr. Selamawit G.",
    body: "KYC documents submitted for manual review.",
    timestamp: "Yesterday, 14:30",
    section: "yesterday",
    is_read: true,
    icon: "verified_user",
    action_label: "Review ID",
    action_url: "/admin/users",
    action_variant: "outline",
  },
  {
    id: "admin-notif-5",
    tag: "Operations",
    tag_type: "neutral",
    title: "Audit Log Export Ready",
    body: "Requested CSV export for Q3 Financial Audit is ready for download.",
    timestamp: "Yesterday, 09:15",
    section: "yesterday",
    is_read: true,
    icon: "download",
    action_label: "Download",
    action_url: "#",
    action_variant: "outline",
  },
];

export function AdminNotificationCenterPage() {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [notifications, setNotifications] =
    useState<AdminNotification[]>(initialAdminNotifications);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full font-['Inter',sans-serif] text-[#0b1c30] pb-24">
      {/* ── Page Header (Exact Stitch Screen f4055d260cd8477bba394ea9f90bfffd) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-[#0b1c30] tracking-tight">
            {isAm ? "የአስተዳዳሪ ማሳወቂያዎች" : "Admin Notifications"}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            {isAm
              ? "የስርዓት ማንቂያዎችን እና በመጠባበቅ ላይ ያሉ ተግባራትን ያስተዳድሩ።"
              : "Manage system alerts and pending operational tasks."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={markAllAsRead}
            className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0b1c30] rounded-lg hover:bg-[#eff4ff] transition-colors text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            <span>{isAm ? "ሁሉንም እንደተነበበ ምልክት አድርግ" : "Mark All as Read"}</span>
          </button>
          <button
            type="button"
            aria-label="Notification Settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-2 border rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs ${
              settingsOpen
                ? "bg-[#005985] text-white border-[#005985]"
                : "bg-white border-[#E2E8F0] text-[#0b1c30] hover:bg-[#eff4ff]"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="mb-6 p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs flex flex-col gap-2">
          <h3 className="text-xs font-bold text-[#0b1c30]">
            {isAm ? "የማንቂያ ማጣሪያዎች" : "Alert Filters & Preferences"}
          </h3>
          <p className="text-xs text-[#64748B]">
            {isAm
              ? "የከፍተኛ ደረጃ ማንቂያዎች፣ የጥናት ግምገማዎች እና የክፍያ ማረጋገጫዎች ንቁ ናቸው።"
              : "High-priority system alerts, survey review queues, and financial approval thresholds are currently enabled."}
          </p>
        </div>
      )}

      {/* ── Notification List ── */}
      <div className="space-y-6">
        {/* Section: Today */}
        {todayList.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold text-[#64748B] mb-3 uppercase tracking-wider">
              {isAm ? "ዛሬ" : "Today"}
            </h2>
            <div className="space-y-3">
              {todayList.map((item) => (
                <AdminNotificationCard
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
            <h2 className="text-[11px] font-bold text-[#64748B] mb-3 uppercase tracking-wider mt-8">
              {isAm ? "ትናንት" : "Yesterday"}
            </h2>
            <div className="space-y-3">
              {yesterdayList.map((item) => (
                <AdminNotificationCard
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

function AdminNotificationCard({
  item,
  onRead,
}: {
  item: AdminNotification;
  onRead: () => void;
}) {
  return (
    <div
      onClick={onRead}
      className={`rounded-xl p-4 md:p-5 flex items-start gap-4 shadow-xs relative overflow-hidden transition-all cursor-pointer ${
        item.is_high_priority
          ? "bg-white border border-[#ba1a1a]/30"
          : !item.is_read
          ? "bg-[#eff4ff] border border-[#005985]/20 hover:border-[#005985]"
          : "bg-white border border-[#E2E8F0] opacity-80 hover:opacity-100"
      }`}
    >
      {/* Left colored bar accent */}
      {item.is_high_priority ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ba1a1a]" />
      ) : !item.is_read ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#005985] rounded-l-xl" />
      ) : null}

      {/* Pulse / Status Dot */}
      {item.is_high_priority ? (
        <div className="mt-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse shrink-0" />
      ) : !item.is_read ? (
        <div className="mt-1.5 w-2 h-2 rounded-full bg-[#005985] shrink-0" />
      ) : (
        <div className="mt-1.5 w-2 h-2 rounded-full bg-transparent shrink-0" />
      )}

      {/* Icon Circle */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          item.is_high_priority
            ? "bg-[#ffdad6] text-[#ba1a1a]"
            : !item.is_read
            ? "bg-[#2872a1] text-white"
            : "bg-[#e5eeff] text-[#64748B]"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              item.tag_type === "error"
                ? "bg-[#ffdad6] text-[#ba1a1a]"
                : item.tag_type === "primary"
                ? "bg-[#d3e4fe] text-[#0b1c30]"
                : "bg-[#dce9ff] text-[#0b1c30]"
            }`}
          >
            {item.tag}
          </span>
          <span className="text-[11px] text-[#64748B] font-medium">{item.timestamp}</span>
        </div>

        <h3 className="text-sm font-bold text-[#0b1c30] mb-1 truncate">{item.title}</h3>
        <p className="text-xs text-[#64748B] line-clamp-2 mb-3 leading-relaxed">
          {item.body}
        </p>

        {item.action_variant === "primary" ? (
          <Link
            to={item.action_url}
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2 bg-[#005985] text-white rounded-lg hover:bg-[#00456d] transition-colors text-xs font-bold inline-flex items-center gap-1 shadow-xs"
          >
            <span>{item.action_label}</span>
          </Link>
        ) : (
          <Link
            to={item.action_url}
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#0b1c30] rounded-lg hover:bg-[#eff4ff] transition-colors text-xs font-semibold inline-flex items-center gap-1 shadow-xs"
          >
            <span>{item.action_label}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        )}
      </div>
    </div>
  );
}
