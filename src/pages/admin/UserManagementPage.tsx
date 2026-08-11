import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserRole, VerificationTier } from "@shared/types";
import { USER_ROLES } from "@shared/types";
import {
  Button,
  Card,
  EmptyState,
  Icon,
  LoadingBlock,
  Notice,
  SectionHeading,
  Select,
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
}

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", page, roleFilter, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("search", search);
      return api<{ users: UserListItem[]; total: number }>(`/admin/users?${params.toString()}`);
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api<{ id: string; message: string }>(`/admin/users/${id}/role`, { body: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div>
      <SectionHeading
        subtitle="Manage platform users, roles, and access."
        title="User Management"
      />

      <Card className="mt-stack-md p-stack-md">
        <div className="flex flex-col gap-stack-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-stack-sm">
            <div className="flex w-full max-w-sm items-center gap-stack-sm rounded-xl border border-outline-variant bg-surface-subtle px-3 py-2">
              <Icon className="text-[20px] text-outline" name="search" />
              <input
                className="w-full bg-transparent font-body-sm outline-none placeholder:text-outline"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                value={search}
              />
            </div>
            <Select
              className="w-48"
              onChange={(e) => setRoleFilter(e.target.value as any)}
              value={roleFilter}
            >
              <option value="all">All roles</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <div className="mt-stack-md">
        {isLoading ? <LoadingBlock /> : null}
        {error ? <Notice tone="error">Could not load users.</Notice> : null}

        {data && data.users.length === 0 ? (
          <EmptyState icon="group" title="No users found">
            Try adjusting your search or filters.
          </EmptyState>
        ) : null}

        {data && data.users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest font-title-sm text-on-surface-variant">
                  <th className="p-stack-sm">User</th>
                  <th className="p-stack-sm">Joined</th>
                  <th className="p-stack-sm">Role</th>
                  <th className="p-stack-sm">Tier</th>
                  <th className="p-stack-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {data.users.map((user) => (
                  <tr className="group hover:bg-surface-subtle" key={user.id}>
                    <td className="p-stack-sm">
                      <p className="font-semibold text-on-surface">{user.full_name}</p>
                      <p className="text-on-surface-variant">{user.email}</p>
                    </td>
                    <td className="p-stack-sm text-on-surface-variant">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-stack-sm">
                      <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[12px] font-semibold text-on-surface">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-stack-sm text-on-surface-variant">
                      {user.verification_tier.split("_")[1]}
                    </td>
                    <td className="p-stack-sm text-right">
                      {user.id !== currentUser?.user_id && (
                        <Select
                          className="inline-block w-auto"
                          onChange={(e) => {
                            if (window.confirm(`Change ${user.full_name}'s role to ${e.target.value}?`)) {
                              changeRole.mutate({ id: user.id, role: e.target.value as UserRole });
                            }
                          }}
                          value={user.role}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              Make {role}
                            </option>
                          ))}
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {data && data.total > 20 ? (
          <div className="mt-stack-md flex items-center justify-between">
            <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)} variant="secondary">
              Previous
            </Button>
            <span className="font-body-sm text-on-surface-variant">
              Page {page}
            </span>
            <Button
              disabled={page * 20 >= data.total}
              onClick={() => setPage((p) => p + 1)}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
