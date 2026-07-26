import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserRole } from "@shared/types";
import { loginSchema, type LoginInput } from "@shared/validation/schemas";
import { Button, Field, Icon, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { AuthShell, RoleTabs } from "./AuthShell";

export function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("researcher");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      const session = await login({ ...values, role });
      navigate(homePathForRole(session.role), { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not sign in. Try again.",
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
          Don&rsquo;t have an account?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/signup">
            Sign Up
          </Link>
        </>
      }
      subtitle="Secure access to the Ethiopian Trust Infrastructure for Truth."
      title="Welcome back"
    >
      <RoleTabs onChange={setRole} value={role} />

      <form
        className="mt-stack-md space-y-stack-md"
        onSubmit={handleFormSubmit}
        ref={formRef}
      >
        <div className="space-y-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <Field error={errors.phone?.message} label="Phone number">
            <Input
              autoComplete="tel"
              inputMode="tel"
              placeholder="0912345678"
              {...register("phone")}
            />
          </Field>

          <Field
            action={
              <button
                className="font-label-caps text-label-caps uppercase text-primary hover:underline"
                type="button"
              >
                Forgot?
              </button>
            }
            error={errors.password?.message}
            label="Password"
          >
            <div className="relative">
              <Input
                autoComplete="current-password"
                className="pr-11"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                onClick={() => setShowPassword((shown) => !shown)}
                type="button"
              >
                <Icon className="text-[20px]" name={showPassword ? "visibility_off" : "visibility"} />
              </button>
            </div>
          </Field>
        </div>

        {formError ? <Notice tone="error">{formError}</Notice> : null}

        <Button className="w-full py-3" loading={isSubmitting} type="submit">
          Login as {role === "researcher" ? "Researcher" : "Respondent"}
          <Icon className="text-[18px]" name="arrow_forward" />
        </Button>
      </form>
    </AuthShell>
  );
}
