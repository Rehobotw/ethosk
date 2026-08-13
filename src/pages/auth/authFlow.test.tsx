import { describe, expect, it } from "vitest";
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

  it("validates role-specific signup payloads for researcher and respondent", () => {
    const researcherSignup = signupSchema.safeParse({
      full_name: "Dr. Almaz Ayana",
      email: "almaz@research.et",
      password: "securePassword123",
      role: "researcher",
    });
    expect(researcherSignup.success).toBe(true);

    const respondentSignup = signupSchema.safeParse({
      full_name: "Dawit Bekele",
      email: "dawit@gmail.com",
      password: "securePassword123",
      role: "respondent",
    });
    expect(respondentSignup.success).toBe(true);
  });

  it("validates account deletion request schema", () => {
    const valid = deleteAccountRequestSchema.safeParse({
      reason: "Moving away from research platform",
      confirm_text: "DELETE",
    });
    expect(valid.success).toBe(true);
  });
});
