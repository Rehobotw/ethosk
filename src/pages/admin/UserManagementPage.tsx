import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserRole, VerificationTier } from "@shared/types";
import { USER_ROLES } from "@shared/types";
import {
  EmptyState,
  LoadingBlock,
  Notice,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

interface UserListItem {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  email_verified: boolean;
  verification_tier: VerificationTier;
  created_at: string;
  is_banned: boolean;
  last_active?: string;
}

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>("respondent");
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", page, roleFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "10" });
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("search", search);
      return api<{ users: UserListItem[]; total: number }>(`/admin/users?${params.toString()}`);
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api<{ id: string; message: string }>(`/admin/users/${id}/role`, { body: { role } }),
    onSuccess: () => {
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const toggleBan = useMutation({
    mutationFn: ({ id, is_banned }: { id: string; is_banned: boolean }) =>
      api<{ id: string; message: string }>(`/admin/users/${id}/ban`, { body: { is_banned } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const users = data?.users ?? [];
  const totalUsers = data?.total ?? users.length;

  const filteredUsers = users.filter((u) => {
    if (statusFilter === "active") return !u.is_banned;
    if (statusFilter === "suspended") return u.is_banned;
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    const first = parts[0];
    if (!first) return "US";
    if (parts.length === 1) return first.slice(0, 2).toUpperCase();
    const last = parts[parts.length - 1];
    return (first[0] ?? "").concat(last?.[0] ?? "").toUpperCase() || "US";
  };

  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["User ID,Name,Email,Role,Tier,Status,Registration Date"]
        .concat(
          filteredUsers.map(
            (u) =>
              `"${u.id}","${u.full_name}","${u.email}","${u.role}","${u.verification_tier}","${
                u.is_banned ? "Suspended" : "Active"
              }","${u.created_at}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ethosk_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 font-['Inter',sans-serif] text-[#0F172A] pb-16 max-w-7xl mx-auto">
      {/* ── Page Header (Stitch Screen 776a931d20c246b68d33d2883d889148) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-headline-md text-2xl sm:text-3xl font-bold text-[#005985] tracking-tight">
            {isAm ? "የተጠቃሚዎች አስተዳደር" : "User Management"}
          </h1>
          <span className="px-2.5 py-0.5 bg-[#d3e4fe] text-[#005985] font-label-sm text-[11px] font-bold rounded-full tracking-wider border border-[#cbe6ff]">
            SUPER ADMIN
          </span>
        </div>
      </div>

      {/* ── Administrator Oversight Section (Stitch Screen 776a931d20c246b68d33d2883d889148) ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#f8f9ff]">
          <div>
            <h2 className="font-headline text-base font-bold text-[#0F172A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#005985]">admin_panel_settings</span>
              {isAm ? "የአስተዳዳሪዎች ክትትል" : "Administrator Oversight"}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {isAm
                ? "የመድረክ አስተዳዳሪዎችን ያስተዳድሩ። ቢበዛ 6 ልዩ አስተዳዳሪዎች ይፈቀዳሉ።"
                : "Manage platform administrators. Maximum of 6 Super Admins permitted."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            className="bg-[#005985] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#106492] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>{isAm ? "አስተዳዳሪ መድብ" : "Provision Admin"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {/* Admin Card 1 */}
          <div className="border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between hover:border-[#005985] hover:shadow-[0_0_0_3px_rgba(0,89,133,0.08)] transition-all bg-[#f8f9ff] group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#005985] text-white flex items-center justify-center font-bold text-xs">
                SJ
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">Sarah Jenkins</div>
                <div className="text-[11px] font-semibold text-[#005985]">Super Admin</div>
              </div>
            </div>
            <button type="button" className="text-[#64748B] hover:text-[#005985] transition-colors">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>

          {/* Admin Card 2 */}
          <div className="border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between hover:border-[#005985] hover:shadow-[0_0_0_3px_rgba(0,89,133,0.08)] transition-all bg-[#f8f9ff] group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d0e2ee] text-[#54656f] flex items-center justify-center font-bold text-xs border border-[#E2E8F0]">
                MR
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A]">Marcus Reid</div>
                <div className="text-[11px] font-semibold text-[#50616b]">Compliance Admin</div>
              </div>
            </div>
            <button type="button" className="text-[#64748B] hover:text-[#005985] transition-colors">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>

          {/* Admin Status Summary Card */}
          <div className="border border-[#E2E8F0] border-dashed rounded-xl p-4 flex flex-col justify-center items-center bg-[#f8f9ff] text-center">
            <div className="font-bold text-xl text-[#0F172A]">2 / 6</div>
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">
              {isAm ? "ንቁ ልዩ አስተዳዳሪዎች" : "Super Admins Active"}
            </div>
          </div>
        </div>
      </section>

      {/* ── General User Directory Section (Stitch Screen 776a931d20c246b68d33d2883d889148) ── */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#f8f9ff]">
          <h2 className="font-headline text-base font-bold text-[#0F172A]">
            {isAm ? "የተጠቃሚዎች ማውጫ" : "User Directory"}
          </h2>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder={isAm ? "ተጠቃሚዎችን በስም ወይም ኢሜይል ይፈልጉ..." : "Search users by name, email, ID..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-[#E2E8F0] rounded-lg bg-white text-xs text-[#0F172A] focus:outline-none focus:border-[#005985] focus:ring-1 focus:ring-[#005985]"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#50616b] bg-white hover:border-[#005985] transition-colors outline-none cursor-pointer"
            >
              <option value="all">{isAm ? "ሁሉም ሚናዎች" : "All Roles"}</option>
              <option value="researcher">{isAm ? "ተመራማሪ" : "Researcher"}</option>
              <option value="respondent">{isAm ? "ተሳታፊ" : "Respondent"}</option>
              <option value="admin">{isAm ? "አስተዳዳሪ" : "Admin"}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#50616b] bg-white hover:border-[#005985] transition-colors outline-none cursor-pointer"
            >
              <option value="all">{isAm ? "ሁሉም ሁኔታዎች" : "All Statuses"}</option>
              <option value="active">{isAm ? "ንቁ" : "Active"}</option>
              <option value="suspended">{isAm ? "የታገዱ" : "Suspended"}</option>
            </select>

            {/* Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#50616b] hover:bg-[#eff4ff] hover:text-[#005985] transition-colors bg-white cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{isAm ? "አውርድ" : "Export"}</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingBlock label={isAm ? "ተጠቃሚዎች በመጫን ላይ..." : "Loading user directory…"} />
        ) : error ? (
          <Notice tone="error">{isAm ? "ተጠቃሚዎችን መጫን አልተሳካም።" : "Could not load users."}</Notice>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8">
            <EmptyState icon="group" title={isAm ? "ምንም ተጠቃሚ አልተገኘም" : "No users found"}>
              {isAm ? "የፍለጋ መስፈርቶቹን ወይም ማጣሪያዎችን ይቀይሩ።" : "Try adjusting your search criteria or role filters."}
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-[#f8f9ff] border-b border-[#E2E8F0]">
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-[#E2E8F0] text-[#005985] focus:ring-[#005985] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "ተጠቃሚ" : "User"}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "ሁኔታ" : "Status"}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "ሚና" : "Role"}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    {isAm ? "የመጨረሻ እንቅስቃሴ" : "Last Active"}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                    {isAm ? "እርምጃዎች" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#E2E8F0]">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.user_id === u.id;
                  const isSuspended = u.is_banned;
                  const isTier2 = u.verification_tier === "2_attribute_verified" || u.verification_tier === "3_institution_attested";
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-[#eff4ff]/40 transition-colors group ${
                        isSelected ? "bg-[#eff4ff]/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(u.id)}
                          className="rounded border-[#E2E8F0] text-[#005985] focus:ring-[#005985] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#005985]/10 text-[#005985] flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F172A]">
                              {u.full_name || "Unnamed Account"}
                            </div>
                            <div className="text-[#64748B] text-[11px]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSuspended ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold">
                            {isAm ? "የታገደ" : "Suspended"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] text-[10px] font-bold">
                            {isAm ? "ንቁ" : "Active"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={selectedNewRole}
                              onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                              className="text-xs border border-[#005985] rounded p-1 bg-white"
                            >
                              {USER_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => changeRole.mutate({ id: u.id, role: selectedNewRole })}
                              className="px-2 py-0.5 bg-[#005985] text-white rounded text-xs font-bold"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium text-[#50616b]">
                            {u.role === "respondent"
                              ? isTier2
                                ? "Respondent (Tier 2)"
                                : "Respondent (Tier 1)"
                              : u.role === "researcher"
                              ? "Researcher"
                              : u.role === "admin"
                              ? "Administrator"
                              : u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setSelectedNewRole(u.role);
                            }}
                            className="p-1.5 text-[#64748B] hover:text-[#005985] transition-colors rounded-lg hover:bg-[#eff4ff] cursor-pointer"
                            title={isAm ? "ሚና ቀይር" : "Change Role"}
                          >
                            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                          </button>
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => toggleBan.mutate({ id: u.id, is_banned: !isSuspended })}
                              className={`p-1.5 transition-colors rounded-lg cursor-pointer ${
                                isSuspended
                                  ? "text-emerald-700 hover:bg-emerald-50"
                                  : "text-[#ba1a1a] hover:bg-[#ffdad6]"
                              }`}
                              title={isSuspended ? (isAm ? "እገዳ አንሳ" : "Restore User") : (isAm ? "አግድ" : "Ban User")}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {isSuspended ? "restore_from_trash" : "block"}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#f8f9ff]">
          <div className="text-xs text-[#64748B]">
            {isAm
              ? `ከ ${totalUsers} ተጠቃሚዎች ውስጥ ${filteredUsers.length > 0 ? (page - 1) * 10 + 1 : 0} እስከ ${(page - 1) * 10 + filteredUsers.length} በማሳየት ላይ`
              : `Showing ${filteredUsers.length > 0 ? (page - 1) * 10 + 1 : 0} to ${(page - 1) * 10 + filteredUsers.length} of ${totalUsers} users`}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 border border-[#E2E8F0] rounded-lg text-[#50616b] hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#005985] text-white text-xs font-bold">
              {page}
            </span>
            <button
              type="button"
              disabled={filteredUsers.length < 10}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 border border-[#E2E8F0] rounded-lg text-[#50616b] hover:bg-white disabled:opacity-40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Provision Admin Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-[#E2E8F0] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-headline font-bold text-base text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005985]">admin_panel_settings</span>
                {isAm ? "አዲስ አስተዳዳሪ መድብ" : "Provision Platform Administrator"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowProvisionModal(false);
                  setProvisionSuccess(null);
                }}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              {isAm
                ? "ለአዲስ አስተዳዳሪ የኢሜይል ግብዣ እና የአስተዳዳሪ ፍቃድ ይስጡ።"
                : "Grant platform administrator privileges and send an onboarding invite."}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">
                  {isAm ? "ሙሉ ስም" : "Full Name"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Bekele"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">
                  {isAm ? "ኢሜይል አድራሻ" : "Email Address"}
                </label>
                <input
                  type="email"
                  placeholder="admin@ethosk.org"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs"
                />
              </div>
            </div>

            {provisionSuccess && <Notice tone="success">{provisionSuccess}</Notice>}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-100 rounded-lg"
              >
                {isAm ? "ሰርዝ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newAdminEmail.trim()) {
                    setProvisionSuccess(
                      isAm
                        ? "የአስተዳዳሪ ግብዣ በተሳካ ሁኔታ ተልኳል!"
                        : "Administrator invite sent successfully!"
                    );
                    setTimeout(() => {
                      setShowProvisionModal(false);
                      setProvisionSuccess(null);
                      setNewAdminEmail("");
                      setNewAdminName("");
                    }, 1500);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#005985] hover:bg-[#106492] rounded-lg shadow-xs"
              >
                {isAm ? "ፍቃድ ስጥ" : "Grant Admin Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
