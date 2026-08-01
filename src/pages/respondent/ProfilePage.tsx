import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EDUCATION_LEVEL_LABEL,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUS_LABEL,
  EMPLOYMENT_STATUSES,
  ETHIOPIAN_REGIONS,
  GENDER_LABEL,
  GENDERS,
  PRIMARY_LANGUAGE_LABEL,
  PRIMARY_LANGUAGES,
  type RespondentProfileRecord,
  type RespondentWallet,
} from "@shared/types";
import {
  respondentProfileSchema,
  type RespondentProfileInput,
} from "@shared/validation/schemas";
import {
  Button,
  Card,
  Field,
  Icon,
  Input,
  LoadingBlock,
  Notice,
  Select,
  TierBadge,
  Toggle,
} from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** The value a `<Select>` uses for "not answered", since an option cannot hold null. */
const UNSET = "";

/**
 * Registration options for every optional attribute.
 *
 * A DOM control can only hold a string, so an unanswered field arrives as `""`.
 * The schema types these as nullable enums and length-checked strings, both of
 * which reject `""` — which would leave a respondent unable to save while any
 * attribute was blank. Mapping it to `null` at the boundary means "not answered"
 * validates as exactly that.
 */
const OPTIONAL = { setValueAs: emptyToNull } as const;

function emptyToNull(value: unknown): string | null {
  if (typeof value !== "string") return (value as string | null) ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Local-only preferences in this build; wiring them to real notification and
  // licensing behaviour is pilot-stage work.
  const [shareAnonymized, setShareAnonymized] = useState(true);
  const [academicConsent, setAcademicConsent] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const deleteAccount = useMutation({
    mutationFn: () =>
      api<{ success: boolean; message: string }>("/auth/account", { method: "DELETE" }),
    onSuccess: () => {
      logout();
    },
    onError: (err) => {
      setDeleteError(
        err instanceof ApiRequestError ? err.message : "Could not delete account. Please try again.",
      );
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["respondent-profile"],
    queryFn: () => api<RespondentProfileRecord>("/respondents/profile"),
  });

  const { data: wallet } = useQuery({
    queryKey: ["respondent-wallet"],
    queryFn: () => api<{ wallet: RespondentWallet }>("/wallet/respondent"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<RespondentProfileInput>({
    resolver: zodResolver(respondentProfileSchema),
    defaultValues: { attributes: {} },
  });

  useEffect(() => {
    if (!profile) return;
    reset(toFormValues(profile));
  }, [profile, reset]);

  const save = useMutation({
    mutationFn: (values: RespondentProfileInput) =>
      api<RespondentProfileRecord>("/respondents/profile", { body: values }),
    onSuccess: async (data) => {
      setSaved(true);
      setFormError(null);
      reset(toFormValues(data));
      await queryClient.invalidateQueries({ queryKey: ["respondent-profile"] });
    },
    onError: (error) => {
      setSaved(false);
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not save your profile.",
      );
    },
  });

  if (isLoading) return <LoadingBlock label="Loading your profile…" />;

  const onSubmit = (values: RespondentProfileInput) => {
    setSaved(false);
    // An emptied field should clear the attribute, not store an empty string that
    // would never match a filter and could never be told apart from a real answer.
    save.mutate({
      ...values,
      university: blankToNull(values.university),
      department: blankToNull(values.department),
      employer: blankToNull(values.employer),
      region: blankToNull(values.region),
      city: blankToNull(values.city),
      occupation: blankToNull(values.occupation),
      gender: values.gender || null,
      employment_status: values.employment_status || null,
      education_level: values.education_level || null,
      primary_language: values.primary_language || null,
    });
  };

  return (
    <div className="space-y-stack-md">
      <div className="grid gap-stack-md lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        {/* Identity column */}
        <div className="space-y-stack-md lg:sticky lg:top-24">
          <Card className="p-stack-md text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary font-headline-md text-headline-md text-on-primary">
              {(user?.full_name?.[0] ?? "?").toUpperCase()}
            </div>
            <h1 className="mt-stack-sm font-headline-md text-headline-md text-on-surface">
              {user?.full_name}
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{user?.phone}</p>
            {user ? (
              <div className="mt-stack-sm flex justify-center">
                <TierBadge tier={user.verification_tier} />
              </div>
            ) : null}

            <div className="mt-stack-md grid grid-cols-2 gap-stack-sm">
              <div className="rounded-lg bg-surface-container-low p-stack-sm">
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant">
                  Total earned
                </p>
                <p className="mt-base font-title-sm text-title-sm text-primary">
                  {(wallet?.wallet.lifetime_etb ?? 0).toFixed(2)} ETB
                </p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-stack-sm">
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant">
                  Available
                </p>
                <p className="mt-base font-title-sm text-title-sm text-secondary">
                  {(wallet?.wallet.available_etb ?? 0).toFixed(2)} ETB
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-stack-md">
            <div className="flex items-center gap-stack-sm">
              <Icon className="text-primary" filled name="fingerprint" />
              <div className="flex-1">
                <p className="font-title-sm text-title-sm text-on-surface">
                  Identity verification
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Government Digital ID linked via Fayda.
                </p>
              </div>
            </div>
            <Link className="mt-stack-md block" to="/verify">
              <Button className="w-full" variant="outline">
                Manage verification
              </Button>
            </Link>
          </Card>
        </div>

        {/* Matching attributes */}
        <div className="space-y-stack-md">
          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Matching details</h2>
            <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
              These are the only attributes a study can filter on. The more you fill in, the more
              studies you match — and you never have to answer one you would rather not.
            </p>

            <form className="mt-stack-md space-y-stack-lg" onSubmit={handleSubmit(onSubmit)}>
              <fieldset className="space-y-stack-md">
                <legend className="mb-stack-sm font-label-caps text-label-caps uppercase text-primary">
                  About you
                </legend>

                <div className="grid gap-stack-sm sm:grid-cols-2">
                  <Field error={errors.age?.message} label="Age">
                    <Input
                      inputMode="numeric"
                      max={100}
                      min={15}
                      placeholder="22"
                      type="number"
                      {...register("age", { setValueAs: toNullableInt })}
                    />
                  </Field>
                  <Field error={errors.gender?.message} label="Gender">
                    <Select {...register("gender", OPTIONAL)}>
                      <option value={UNSET}>Prefer not to answer</option>
                      {GENDERS.map((value) => (
                        <option key={value} value={value}>
                          {GENDER_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field error={errors.primary_language?.message} label="Main language">
                  <Select {...register("primary_language", OPTIONAL)}>
                    <option value={UNSET}>Not answered</option>
                    {PRIMARY_LANGUAGES.map((value) => (
                      <option key={value} value={value}>
                        {PRIMARY_LANGUAGE_LABEL[value]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </fieldset>

              <fieldset className="space-y-stack-md border-t border-outline-variant pt-stack-md">
                <legend className="mb-stack-sm font-label-caps text-label-caps uppercase text-primary">
                  Where you live
                </legend>

                <div className="grid gap-stack-sm sm:grid-cols-2">
                  <Field error={errors.region?.message} label="Region">
                    <Select {...register("region", OPTIONAL)}>
                      <option value={UNSET}>Not answered</option>
                      {ETHIOPIAN_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field error={errors.city?.message} label="City or town">
                    <Input placeholder="Hawassa" {...register("city", OPTIONAL)} />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="space-y-stack-md border-t border-outline-variant pt-stack-md">
                <legend className="mb-stack-sm font-label-caps text-label-caps uppercase text-primary">
                  Work and education
                </legend>

                <div className="grid gap-stack-sm sm:grid-cols-2">
                  <Field error={errors.employment_status?.message} label="Current situation">
                    <Select {...register("employment_status", OPTIONAL)}>
                      <option value={UNSET}>Not answered</option>
                      {EMPLOYMENT_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {EMPLOYMENT_STATUS_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field error={errors.education_level?.message} label="Highest education">
                    <Select {...register("education_level", OPTIONAL)}>
                      <option value={UNSET}>Not answered</option>
                      {EDUCATION_LEVELS.map((value) => (
                        <option key={value} value={value}>
                          {EDUCATION_LEVEL_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-stack-sm sm:grid-cols-2">
                  <Field error={errors.occupation?.message} label="Occupation">
                    <Input placeholder="Trader, nurse, teacher…" {...register("occupation", OPTIONAL)} />
                  </Field>
                  <Field error={errors.employer?.message} label="Employer">
                    <Input placeholder="Leave blank if not employed" {...register("employer", OPTIONAL)} />
                  </Field>
                </div>
              </fieldset>

              <fieldset className="space-y-stack-md border-t border-outline-variant pt-stack-md">
                <legend className="mb-stack-sm font-label-caps text-label-caps uppercase text-primary">
                  If you are studying
                </legend>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  Only needed for studies about students. Leave blank otherwise.
                </p>

                <Field error={errors.university?.message} label="University / institution">
                  <Input placeholder="Hawassa University" {...register("university", OPTIONAL)} />
                </Field>

                <div className="grid gap-stack-sm sm:grid-cols-2">
                  <Field error={errors.department?.message} label="Department">
                    <Input placeholder="Sociology" {...register("department", OPTIONAL)} />
                  </Field>
                  <Field error={errors.year?.message} label="Year of study">
                    <Input
                      inputMode="numeric"
                      max={8}
                      min={1}
                      placeholder="3"
                      type="number"
                      {...register("year", { setValueAs: toNullableInt })}
                    />
                  </Field>
                </div>
              </fieldset>

              {formError ? <Notice tone="error">{formError}</Notice> : null}
              {saved && !isDirty ? <Notice tone="success">Profile saved.</Notice> : null}

              <Button className="w-full" loading={save.isPending} type="submit">
                Save profile
              </Button>
            </form>
          </Card>

          <Card className="p-stack-md">
            <h2 className="font-title-sm text-title-sm text-on-surface">Privacy &amp; consent</h2>
            <Notice tone="info" title="Compliance registry">
              Your data is managed under Proclamation 1321/2024. Every upload and response is
              recorded as a consent event you can request a copy of.
            </Notice>

            <div className="mt-stack-md space-y-stack-md">
              <Toggle
                checked={shareAnonymized}
                label="Share anonymised profile with matched studies"
                onChange={setShareAnonymized}
              />
              <Toggle
                checked={academicConsent}
                label="Academic research consent"
                onChange={setAcademicConsent}
              />
              <Toggle
                checked={marketing}
                label="Marketing notifications"
                onChange={setMarketing}
              />
            </div>

            {!showDeleteConfirm ? (
              <button
                className="mt-stack-md flex items-center gap-stack-sm font-title-sm text-body-md text-error hover:underline"
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteConfirm(true);
                }}
                type="button"
              >
                <Icon className="text-[18px]" name="delete_forever" />
                Request account deletion
              </button>
            ) : (
              <div className="mt-stack-md space-y-stack-sm rounded-lg border border-error/30 bg-error-container/10 p-stack-sm">
                <p className="font-title-sm text-body-sm font-semibold text-error">
                  Are you sure you want to delete your account?
                </p>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  This will permanently delete your profile, responses, and verification history under Proclamation 1321/2024. This action cannot be undone.
                </p>
                {deleteError ? <Notice tone="error">{deleteError}</Notice> : null}
                <div className="flex items-center gap-stack-sm pt-base">
                  <Button
                    loading={deleteAccount.isPending}
                    onClick={() => deleteAccount.mutate()}
                    variant="danger"
                  >
                    Confirm deletion
                  </Button>
                  <Button
                    disabled={deleteAccount.isPending}
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Button className="w-full" onClick={logout} variant="ghost">
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * A `<select>` cannot hold null, and an uncontrolled text input cannot hold it
 * either, so every unset attribute becomes an empty string for the form and is
 * turned back into null on submit.
 */
function toFormValues(profile: RespondentProfileRecord): RespondentProfileInput {
  return {
    university: profile.university ?? "",
    department: profile.department ?? "",
    year: profile.year ?? null,
    age: profile.age ?? null,
    employer: profile.employer ?? "",
    gender: profile.gender ?? null,
    region: profile.region ?? "",
    city: profile.city ?? "",
    employment_status: profile.employment_status ?? null,
    occupation: profile.occupation ?? "",
    education_level: profile.education_level ?? null,
    primary_language: profile.primary_language ?? null,
    attributes: profile.attributes ?? {},
  };
}

function blankToNull(value: string | null | undefined): string | null {
  return value?.trim() ? value : null;
}

/** An emptied number input should clear the field rather than become NaN. */
function toNullableInt(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}
