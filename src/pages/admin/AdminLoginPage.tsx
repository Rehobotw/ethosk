import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@shared/validation/schemas";
import { Button, Field, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { AuthShell } from "@/pages/auth/AuthShell";

export function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: "admin" },
  });
  
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      // Force admin role during login submission
      await login({ ...values, role: "admin" });
      navigate("/admin/review-queue", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Authentication failed.",
      );
    }
  };

  const { formRef, onSubmit: handleFormSubmit } = useAutofillSafeSubmit(form, onSubmit);

  return (
    <AuthShell
      footer={
        <span className="text-on-surface-variant text-sm">
          Protected System Area
        </span>
      }
      subtitle="Sign in to the administrative control panel."
      title="Admin Portal"
    >
      <form
        className="space-y-stack-md"
        noValidate
        onSubmit={handleFormSubmit}
        ref={formRef}
      >
        <Field error={errors.email?.message} label="Administrator Email">
          <Input
            autoComplete="email"
            placeholder="admin@ethosk.com"
            type="email"
            {...register("email")}
          />
        </Field>

        <Field error={errors.password?.message} label="Password">
          <Input
            autoComplete="current-password"
            placeholder="••••••••"
            type="password"
            {...register("password")}
          />
        </Field>

        {formError ? <Notice tone="error">{formError}</Notice> : null}

        <Button className="w-full" loading={isSubmitting} type="submit">
          Secure Login
        </Button>
      </form>
    </AuthShell>
  );
}
