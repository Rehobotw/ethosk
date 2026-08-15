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

interface UserListItem {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  email_verified: boolean;
  verification_tier: VerificationTier;
  created_at: string;
  is_banned: boolean;
}

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [search, setSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>("respondent");

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

  return (
    <div className="flex flex-col gap-6 font-['Inter',sans-serif] text-[#181c1e] pb-16">
      {/* ── Header & Utilities (Stitch Screen ed2a8b351efd443fbb305ea28eb67e1d) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#00456d] tracking-tight m-0 p-0">
            User Management
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717880] text-[20px]">
              search
            </span>
            <input
              className="w-full pl-10 pr-3 py-2 bg-white border border-[#c1c7d0] rounded-lg text-xs text-[#181c1e] placeholder:text-[#717880] focus:border-[#00456d] focus:ring-1 focus:ring-[#00456d]/20 transition-all outline-none"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or email..."
              type="text"
              value={search}
            />
          </div>

          {/* Role Filter */}
          <div className="relative group cursor-pointer">
            <select
              className="appearance-none bg-white border border-[#c1c7d0] rounded-lg text-xs font-semibold text-[#181c1e] py-2 pl-3 pr-8 hover:border-[#00456d] transition-colors outline-none cursor-pointer focus:border-[#00456d] focus:ring-1 focus:ring-[#00456d]/20 h-full"
              onChange={(e) => setRoleFilter(e.target.value as any)}
              value={roleFilter}
            >
              <option value="all">All Roles</option>
              <option value="researcher">Researcher</option>
              <option value="respondent">Respondent</option>
              <option value="admin">Admin</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#717880] pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>

          {/* Status Filter */}
          <div className="relative group cursor-pointer">
            <select
              className="appearance-none bg-white border border-[#c1c7d0] rounded-lg text-xs font-semibold text-[#181c1e] py-2 pl-3 pr-8 hover:border-[#00456d] transition-colors outline-none cursor-pointer focus:border-[#00456d] focus:ring-1 focus:ring-[#00456d]/20 h-full"
              onChange={(e) => setStatusFilter(e.target.value as any)}
              value={statusFilter}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#717880] pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingBlock label="Loading user registry…" /> : null}
      {error ? <Notice tone="error">Could not load users.</Notice> : null}

      {/* ── Data Table Container (Stitch Screen ed2a8b351efd443fbb305ea28eb67e1d) ── */}
      <div className="bg-white border border-[#c1c7d0] rounded-lg overflow-hidden flex flex-col shadow-xs">
        {filteredUsers.length === 0 && !isLoading ? (
          <div className="p-8">
            <EmptyState icon="group" title="No users found">
              Try adjusting your search criteria or role filters.
            </EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c1c7d0] bg-[#f1f4f7]/50">
                  <th className="px-4 py-3 text-xs font-semibold text-[#41474f] tracking-wider whitespace-nowrap">
                    User ID
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#41474f] tracking-wider whitespace-nowrap">
                    Name &amp; Contact
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#41474f] tracking-wider whitespace-nowrap">
                    Role / Tier
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#41474f] tracking-wider whitespace-nowrap">
                    Registration Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#41474f] tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#41474f] tracking-wider whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c1c7d0]/50 text-xs">
                {filteredUsers.map((u) => {
                  const isSelf = currentUser?.user_id === u.id;
                  const isSuspended = u.is_banned;
                  const isTier2 = u.verification_tier === "2_attribute_verified" || u.verification_tier === "3_institution_attested";

                  return (
                    <tr className="hover:bg-[#f1f4f7]/30 transition-colors group" key={u.id}>
                      <td className="px-4 py-4 text-[#41474f] whitespace-nowrap font-mono">
                        #USR-{u.id.slice(0, 4).toUpperCase()}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#181c1e]">
                            {u.full_name || "Unnamed Account"}
                          </span>
                          <span className="text-[#41474f] text-[11px] mt-0.5">
                            {u.email}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              className="text-xs border border-[#00456d] rounded p-1 bg-white"
                              onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                              value={selectedNewRole}
                            >
                              {USER_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <button
                              className="px-2 py-0.5 bg-[#00456d] text-white rounded text-xs font-bold"
                              onClick={() => changeRole.mutate({ id: u.id, role: selectedNewRole })}
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs"
                              onClick={() => setEditingUserId(null)}
                              type="button"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              u.role === "researcher"
                                ? "bg-[#cbe2fe]/50 text-[#4f657c]"
                                : u.role === "admin"
                                ? "bg-[#00456d] text-white"
                                : isTier2
                                ? "bg-[#1d5d8a] text-white"
                                : "bg-[#cbe2fe] text-[#4f657c]"
                            }`}
                          >
                            {u.role === "respondent"
                              ? isTier2
                                ? "Resp. Tier 2"
                                : "Resp. Tier 1"
                              : u.role}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-[#181c1e] whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {isSuspended ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-[#ba1a1a] text-[10px] font-bold uppercase tracking-wide">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-[rgba(15,155,142,0.1)] text-[#0F9B8E] text-[10px] font-bold uppercase tracking-wide">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity font-semibold">
                          <button
                            className="text-[#00456d] hover:text-[#1d5d8a] transition-colors cursor-pointer"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setSelectedNewRole(u.role);
                            }}
                            type="button"
                          >
                            Edit
                          </button>

                          {!isSelf && (
                            <button
                              className={`cursor-pointer transition-colors ${
                                isSuspended
                                  ? "text-[#0F9B8E] hover:text-[#0F9B8E]/80"
                                  : "text-[#ba1a1a] hover:text-[#93000a]"
                              }`}
                              onClick={() => toggleBan.mutate({ id: u.id, is_banned: !isSuspended })}
                              type="button"
                            >
                              {isSuspended ? "Restore" : "Suspend"}
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

        {/* ── Pagination Footer (Exact Stitch Layout) ── */}
        <div className="border-t border-[#c1c7d0] bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#41474f]">
            Showing {filteredUsers.length > 0 ? 1 : 0} to {filteredUsers.length} of {totalUsers} users
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 border border-[#c1c7d0] rounded text-[#181c1e] text-xs font-semibold hover:border-[#00456d] hover:text-[#00456d] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              Prev
            </button>
            <button
              className="px-3 py-1.5 border border-[#c1c7d0] rounded text-[#181c1e] text-xs font-semibold hover:border-[#00456d] hover:text-[#00456d] transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              disabled={filteredUsers.length < 10}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
