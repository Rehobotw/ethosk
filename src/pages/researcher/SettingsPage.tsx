import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResearcherWallet } from "@shared/types";
import { researcherProfileSchema } from "@shared/validation/schemas";
import {
  Button,
  Card,
  Field,
  Icon,
  Input,
  LoadingBlock,
  Notice,
  SectionHeading,
  TierBadge,
  Textarea,
  Toggle,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { describeFormError } from "@/lib/forms";
import { AccountDeletionModal } from "@/components/AccountDeletionModal";

interface ResearcherProfile {
  user_id: string;
  bio: string | null;
  institution: string | null;
  rating: number | null;
  verified: boolean;
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Local-only in this build. Wiring these to real delivery is pilot-stage work,
  // and they are shown as switches rather than promises of behaviour that exists.
  const [emailOnResponse, setEmailOnResponse] = useState(true);
  const [emailOnFlagged, setEmailOnFlagged] = useState(true);
  const [emailOnLowBalance, setEmailOnLowBalance] = useState(true);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["researcher-profile"],
    queryFn: () => api<ResearcherProfile>("/researchers/profile"),
  });

  const { data: walletData } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: ResearcherWallet }>("/wallet/researcher"),
  });

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? "");
    setInstitution(profile.institution ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: () => {
      const payload = researcherProfileSchema.parse({
        bio: bio.trim() ? bio : null,
        institution: institution.trim() ? institution : null,
      });
      return api<ResearcherProfile>("/researchers/profile", { body: payload });
    },
    onSuccess: async () => {
      setSaved(true);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["researcher-profile"] });
    },
    onError: (error) => {
      setSaved(false);
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : describeFormError(error, "Could not save your settings."),
      );
    },
  });

  if (isLoading) return <LoadingBlock label="Loading your settings…" />;

  return (
    <div>
      <SectionHeading
        subtitle="Your public researcher profile, notifications, and account."
        title="Settings"
      />

      <div className="grid gap-gutter lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-stack-md">
          {/* Public profile */}
          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Researcher profile</h2>
            <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
              Respondents see this before deciding whether to take part in your study. A real name
              and institution measurably raise completion rates.
            </p>

            <div className="mt-stack-md space-y-stack-md">
              <Field label="Institution">
                <Input
                  onChange={(event) => setInstitution(event.target.value)}
                  placeholder="e.g. Hawassa University"
                  value={institution}
                />
              </Field>

              <Field
                hint={`Kept short and factual. ${bio.length}/1000`}
                label="About your research"
              >
                <Textarea
                  maxLength={1000}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Graduate researcher in education policy, focused on learning outcomes in southern Ethiopia."
                  rows={5}
                  value={bio}
                />
              </Field>

              {formError ? <Notice tone="error">{formError}</Notice> : null}
              {saved ? <Notice tone="success">Settings saved.</Notice> : null}

              <Button
                loading={save.isPending}
                onClick={() => {
                  setSaved(false);
                  save.mutate();
                }}
              >
                Save changes
              </Button>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Email notifications</h2>
            <div className="mt-stack-md space-y-stack-md">
              <Toggle
                checked={emailOnResponse}
                label="Daily summary of new responses"
                onChange={setEmailOnResponse}
              />
              <Toggle
                checked={emailOnFlagged}
                label="When a response is flagged for quality"
                onChange={setEmailOnFlagged}
              />
              <Toggle
                checked={emailOnLowBalance}
                label="When my balance will not cover an active study"
                onChange={setEmailOnLowBalance}
              />
            </div>
            <p className="mt-stack-md font-body-sm text-[12px] text-on-surface-variant">
              Stored on this device in the current build; email delivery is connected at the pilot
              stage.
            </p>
          </Card>

          {/* Danger zone */}
          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Account</h2>
            <div className="mt-stack-md space-y-stack-sm">
              <Button className="w-full sm:w-auto" onClick={logout} variant="outline">
                Log out
              </Button>
              <div>
                <button
                  className="flex items-center gap-stack-sm font-title-sm text-body-md text-error hover:underline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  type="button"
                >
                  <Icon className="text-[18px]" name="delete_forever" />
                  Request account deletion
                </button>
                <p className="mt-base font-body-sm text-[12px] text-on-surface-variant">
                  Deleting an account does not delete responses already collected by your published
                  studies, which respondents consented to on those terms.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Summary column */}
        <div className="space-y-stack-md lg:sticky lg:top-24">
          <Card className="p-stack-md">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Account
            </p>
            <p className="mt-stack-sm font-title-sm text-title-sm text-on-surface">
              {user?.full_name}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{user?.email}</p>
            {user ? (
              <div className="mt-stack-sm">
                <TierBadge tier={user.verification_tier} />
              </div>
            ) : null}

            {profile?.verified ? (
              <p className="mt-stack-sm flex items-center gap-stack-sm font-body-sm text-body-sm text-flag-clean">
                <Icon className="text-[16px]" filled name="verified" />
                Verified researcher
              </p>
            ) : (
              <p className="mt-stack-sm font-body-sm text-[12px] text-on-surface-variant">
                Researcher verification is granted by Ethosk from your study history. It cannot be
                set here.
              </p>
            )}
          </Card>

          <Card className="p-stack-md">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Available balance
            </p>
            <p className="mt-base font-headline-md text-headline-md text-primary">
              {(walletData?.wallet.available_etb ?? 0).toLocaleString()} ETB
            </p>
            <Link className="mt-stack-md block" to="/researcher/wallet">
              <Button className="w-full" icon="add_card" variant="outline">
                Add funds
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
