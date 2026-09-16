import { describe, expect, it } from "vitest";
import { isPathAllowedForRole } from "@/lib/auth";
import {
  deleteAccountRequestSchema,
  forgotPasswordSchema,
  loginSchema,
  resendCodeSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "@shared/validation/schemas";

describe("Email Auth & Account Deletion Validation Schemas", () => {
  it("validates valid email signup input", () => {
    const valid = signupSchema.safeParse({
      full_name: "Abebe Bikila",
      email: "abebe@example.com",
      password: "strongPassword123",
      role: "respondent",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid email formats during signup", () => {
    const invalid = signupSchema.safeParse({
      full_name: "Abebe Bikila",
      email: "not-an-email",
      password: "strongPassword123",
      role: "respondent",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates valid email login input", () => {
    const valid = loginSchema.safeParse({
      email: "researcher@ethosk.com",
      password: "ethosk-demo-2024",
    });
    expect(valid.success).toBe(true);
  });

  it("validates email verification code input", () => {
    const valid = verifyEmailSchema.safeParse({
      email: "respondent@ethosk.com",
      code: "123456",
    });
    expect(valid.success).toBe(true);

    const invalid = verifyEmailSchema.safeParse({
      email: "respondent@ethosk.com",
      code: "12",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates resend code input", () => {
    const valid = resendCodeSchema.safeParse({
      email: "respondent@ethosk.com",
    });
    expect(valid.success).toBe(true);
  });

  it("validates forgot password input", () => {
    const valid = forgotPasswordSchema.safeParse({
      email: "researcher@ethosk.com",
    });
    expect(valid.success).toBe(true);

    const invalid = forgotPasswordSchema.safeParse({
      email: "not-an-email",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates reset password input", () => {
    const valid = resetPasswordSchema.safeParse({
      email: "researcher@ethosk.com",
      code: "123456",
      new_password: "newStrongPassword123",
      confirm_password: "newStrongPassword123",
    });
    expect(valid.success).toBe(true);

    const mismatch = resetPasswordSchema.safeParse({
      email: "researcher@ethosk.com",
      code: "123456",
      new_password: "newStrongPassword123",
      confirm_password: "differentPassword123",
    });
    expect(mismatch.success).toBe(false);
  });

  it("validates account deletion request schema", () => {
    const valid = deleteAccountRequestSchema.safeParse({
      reason: "Moving away from research platform",
      confirm_text: "DELETE",
    });
    expect(valid.success).toBe(true);
  });
});

describe("isPathAllowedForRole Isolation Helper", () => {
  it("prevents respondents from accessing researcher or admin paths", () => {
    expect(isPathAllowedForRole("/researcher", "respondent")).toBe(false);
    expect(isPathAllowedForRole("/researcher/surveys", "respondent")).toBe(false);
    expect(isPathAllowedForRole("/survey-builder/manual", "respondent")).toBe(false);
    expect(isPathAllowedForRole("/admin/review-queue", "respondent")).toBe(false);
    expect(isPathAllowedForRole("/inbox", "respondent")).toBe(true);
    expect(isPathAllowedForRole("/history", "respondent")).toBe(true);
    expect(isPathAllowedForRole("/wallet", "respondent")).toBe(true);
  });

  it("prevents researchers from accessing respondent dashboards or admin paths", () => {
    expect(isPathAllowedForRole("/inbox", "researcher")).toBe(false);
    expect(isPathAllowedForRole("/history", "researcher")).toBe(false);
    expect(isPathAllowedForRole("/admin/users", "researcher")).toBe(false);
    expect(isPathAllowedForRole("/researcher", "researcher")).toBe(true);
    expect(isPathAllowedForRole("/researcher/surveys", "researcher")).toBe(true);
    expect(isPathAllowedForRole("/survey-builder/manual", "researcher")).toBe(true);
  });

  it("allows admins to access admin and researcher paths", () => {
    expect(isPathAllowedForRole("/admin/overview", "admin")).toBe(true);
    expect(isPathAllowedForRole("/admin/users", "super_admin")).toBe(true);
    expect(isPathAllowedForRole("/researcher", "admin")).toBe(true);
  });
});

