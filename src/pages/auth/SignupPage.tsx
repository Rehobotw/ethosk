import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserRole } from "@shared/types";
import { signupSchema, type SignupInput } from "@shared/validation/schemas";
import { Button, Field, Icon, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { AuthShell, RoleTabs } from "./AuthShell";

export function SignupPage() {
  const { signup, user, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("respondent");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", phone: "", password: "", role: "respondent" },
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: SignupInput) => {
    setFormError(null);
    try {
      const session = await signup({ ...values, role });
      // A new respondent needs a profile before anything can match them.
      navigate(session.role === "respondent" ? "/profile" : homePathForRole(session.role), {
        replace: true,
      });
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not create your account. Try again.",
      );
    }
  };

  // Declared before the early return below so the hook order stays stable.
  const { formRef, onSubmit: handleFormSubmit } = useAutofillSafeSubmit(form, onSubmit);

  if (!loading && user) return <Navigate replace to={homePathForRole(user.role)} />;

  return (
    <AuthShell
      footer={
        <>
          Already registered?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/login">
            Log in
          </Link>
        </>
      }
      subtitle="Join the verified research panel for Ethiopia."
      title="Create your account"
    >
      <RoleTabs onChange={setRole} value={role} />

      <form
        className="mt-stack-md space-y-stack-md"
        onSubmit={handleFormSubmit}
        ref={formRef}
      >
        <div className="space-y-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <Field error={errors.full_name?.message} label="Full name">
            <Input autoComplete="name" placeholder="Abebe Bekele" {...register("full_name")} />
          </Field>

          <Field error={errors.phone?.message} label="Phone number">
            <Input
              autoComplete="tel"
              inputMode="tel"
              placeholder="0912345678"
              {...register("phone")}
            />
          </Field>

          <Field
            error={errors.password?.message}
            hint="At least 8 characters."
            label="Password"
          >
            <Input autoComplete="new-password" type="password" {...register("password")} />
          </Field>
        </div>

        {formError ? <Notice tone="error">{formError}</Notice> : null}

        <Button className="w-full py-3" loading={isSubmitting} type="submit">
          Create {role === "researcher" ? "researcher" : "respondent"} account
          <Icon className="text-[18px]" name="arrow_forward" />
        </Button>

        <p className="text-center font-body-sm text-[12px] text-on-surface-variant">
          By continuing you consent to Ethosk processing the details you provide, as described in our
          data-handling notice under Proclamation 1321/2024.
        </p>
      </form>
    </AuthShell>
  );
}
