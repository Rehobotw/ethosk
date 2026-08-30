import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function AdminSettingsPage() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const updateEmail = useMutation({
    mutationFn: (nextEmail: string) => api("/auth/update-email", { body: { email: nextEmail } }),
    onSuccess: async () => {
      await refresh();
      setEmailError("");
      setEmailMessage("Email address updated.");
    },
    onError: (error: unknown) => {
      setEmailMessage("");
      setEmailError(
        error instanceof ApiRequestError ? error.message : "Could not update the email address.",
      );
    },
  });

  const updatePassword = useMutation({
    mutationFn: (password: string) =>
      api("/auth/update-password", { body: { new_password: password } }),
    onSuccess: () => {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setPasswordMessage("Password updated successfully.");
    },
    onError: (error: unknown) => {
      setPasswordMessage("");
      setPasswordError(
        error instanceof ApiRequestError ? error.message : "Could not update the password.",
      );
    },
  });

  const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailMessage("");
    setEmailError("");
    if (!email.trim()) {
      setEmailError("Enter an email address.");
      return;
    }
    updateEmail.mutate(email.trim());
  };

  const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Your new password must have at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }
    updatePassword.mutate(newPassword);
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#1d5d8a]">Super admin</p>
        <h1 className="mt-1 font-['Newsreader',serif] text-3xl font-bold text-[#00456d]">
          Profile settings
        </h1>
        <p className="mt-2 text-sm text-[#4b6078]">
          Manage the account you use to administer Ethosk.
        </p>
      </div>

      <div className="rounded-xl border border-[#c1c7d0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d5d8a] font-bold text-white">
            {(user?.full_name || "Admin").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-[#181c1e]">{user?.full_name || "Admin"}</h2>
            <p className="text-sm text-[#4b6078]">Super administrator</p>
          </div>
        </div>
      </div>

      <form
        className="rounded-xl border border-[#c1c7d0] bg-white p-6 shadow-sm"
        onSubmit={submitEmail}
      >
        <h2 className="text-lg font-bold text-[#00456d]">Email address</h2>
        <p className="mt-1 text-sm text-[#4b6078]">
          Use an address you can access for account recovery.
        </p>
        <label className="mt-5 block text-sm font-medium text-[#181c1e]" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          className="mt-1.5 w-full rounded-lg border border-[#c1c7d0] px-3 py-2.5 text-sm outline-none focus:border-[#00456d] focus:ring-2 focus:ring-[#00456d]/10"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {emailError && <p className="mt-3 text-sm font-medium text-red-700">{emailError}</p>}
        {emailMessage && (
          <p className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-700">
            <Icon className="text-[16px]" name="check_circle" />
            {emailMessage}
          </p>
        )}
        <button
          className="mt-5 rounded-lg bg-[#00456d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d5d8a] disabled:opacity-50"
          disabled={updateEmail.isPending}
          type="submit"
        >
          {updateEmail.isPending ? "Saving…" : "Save email"}
        </button>
      </form>

      <form
        className="rounded-xl border border-[#c1c7d0] bg-white p-6 shadow-sm"
        onSubmit={submitPassword}
      >
        <h2 className="text-lg font-bold text-[#00456d]">Change password</h2>
        <p className="mt-1 text-sm text-[#4b6078]">
          Choose a new password with at least 8 characters.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="block text-sm font-medium text-[#181c1e]"
              htmlFor="admin-new-password"
            >
              New password
            </label>
            <input
              id="admin-new-password"
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-[#c1c7d0] px-3 py-2.5 text-sm outline-none focus:border-[#00456d] focus:ring-2 focus:ring-[#00456d]/10"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-[#181c1e]"
              htmlFor="admin-confirm-password"
            >
              Confirm password
            </label>
            <input
              id="admin-confirm-password"
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-[#c1c7d0] px-3 py-2.5 text-sm outline-none focus:border-[#00456d] focus:ring-2 focus:ring-[#00456d]/10"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>
        {passwordError && <p className="mt-3 text-sm font-medium text-red-700">{passwordError}</p>}
        {passwordMessage && (
          <p className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-700">
            <Icon className="text-[16px]" name="check_circle" />
            {passwordMessage}
          </p>
        )}
        <button
          className="mt-5 rounded-lg bg-[#00456d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d5d8a] disabled:opacity-50"
          disabled={updatePassword.isPending}
          type="submit"
        >
          {updatePassword.isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
