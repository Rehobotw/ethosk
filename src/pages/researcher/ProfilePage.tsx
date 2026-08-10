import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResearcherVerificationStatus, ResearcherVerificationLevel } from "@shared/types";
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
  Textarea,
  TierBadge,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { describeFormError } from "@/lib/forms";
import { useAuth } from "@/lib/auth";

interface ResearcherProfile {
  user_id: string;
  bio: string | null;
  institution: string | null;
  rating: number | null;
  verification_level: ResearcherVerificationLevel;
  verification_status: ResearcherVerificationStatus;
  verification_notes: string | null;
  social_links: Record<string, string>;
}

export function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["researcher-profile"],
    queryFn: () => api<ResearcherProfile>("/researchers/profile"),
  });

  const requestVerification = useMutation({
    mutationFn: () => api<{ success: boolean }>("/researchers/request-verification"),
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio ?? "");
    setInstitution(profile.institution ?? "");
    setLinkedin(profile.social_links?.linkedin ?? "");
    setTwitter(profile.social_links?.twitter ?? "");
    setWebsite(profile.social_links?.website ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: () => {
      const payload = researcherProfileSchema.parse({
        bio: bio.trim() ? bio : null,
        institution: institution.trim() ? institution : null,
        social_links: {
          linkedin: linkedin.trim(),
          twitter: twitter.trim(),
          website: website.trim(),
        }
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
          : describeFormError(error, "Could not save your profile."),
      );
    },
  });

  if (isLoading) return <LoadingBlock label="Loading your profile…" />;

  return (
    <div>
      <SectionHeading
        subtitle="Manage how your public profile appears to respondents."
        title="Public Profile"
      />

      <div className="grid gap-gutter lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-stack-md">
          <Card className="p-stack-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-title-sm text-title-sm text-on-surface">Profile details</h2>
              {profile && profile.verification_level === "unverified" && (
                <div className="flex flex-col items-end">
                  {profile.verification_status === "pending" ? (
                    <span className="text-sm font-medium text-status-review flex items-center gap-1">
                      <Icon name="hourglass_top" className="text-[16px]" /> Verification Pending
                    </span>
                  ) : profile.verification_status === "rejected" ? (
                    <div className="text-right">
                      <span className="text-sm font-medium text-error flex items-center gap-1">
                        <Icon name="error" className="text-[16px]" /> Verification Rejected
                      </span>
                      {profile.verification_notes && (
                        <p className="text-xs text-on-surface-variant mt-1 max-w-xs">{profile.verification_notes}</p>
                      )}
                      <Button
                        className="mt-2"
                        variant="outline"
                        loading={requestVerification.isPending}
                        onClick={() => requestVerification.mutate()}
                      >
                        Request Again
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      loading={requestVerification.isPending}
                      onClick={() => requestVerification.mutate()}
                    >
                      Request Verification
                    </Button>
                  )}
                  {requestVerification.error && (
                    <p className="text-xs text-error mt-1">
                      {requestVerification.error instanceof ApiRequestError 
                        ? requestVerification.error.message 
                        : "Failed to request"}
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
              Respondents see this before deciding whether to take part in your study. A real name, institution, and links measurably raise completion rates.
            </p>

            <div className="mt-stack-md space-y-stack-md">
              <Field label="Institution">
                <Input
                  onChange={(event) => setInstitution(event.target.value)}
                  placeholder="e.g. Addis Ababa University"
                  value={institution}
                />
              </Field>

              <Field
                hint="A short explanation of who you are and what you study. Keep it under a paragraph."
                label="Bio"
              >
                <Textarea
                  className="h-24 resize-none"
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="I am a researcher studying the economic impact of mobile money..."
                  value={bio}
                />
              </Field>

              <div className="space-y-4 pt-4 border-t border-outline-variant">
                <h3 className="font-title-sm text-on-surface">Social Links</h3>
                <Field label="LinkedIn URL">
                  <Input
                    onChange={(event) => setLinkedin(event.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                  />
                </Field>
                <Field label="Twitter / X URL">
                  <Input
                    onChange={(event) => setTwitter(event.target.value)}
                    placeholder="https://twitter.com/username"
                    value={twitter}
                  />
                </Field>
                <Field label="Personal Website">
                  <Input
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="https://example.com"
                    value={website}
                  />
                </Field>
              </div>

              {formError && <Notice tone="error">{formError}</Notice>}
              {saved && <Notice tone="success">Profile saved successfully.</Notice>}

              <div className="pt-stack-sm">
                <Button loading={save.isPending} onClick={() => save.mutate()}>
                  Save profile
                </Button>
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

            {profile?.verification_level === "id_verified" ? (
              <p className="mt-stack-sm flex items-center gap-stack-sm font-body-sm text-body-sm text-flag-clean">
                <Icon className="text-[16px]" filled name="verified" />
                Verified researcher
              </p>
            ) : (
              <p className="mt-stack-sm font-body-sm text-[12px] text-on-surface-variant">
                Fill out your profile and click "Request Verification" to apply.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
