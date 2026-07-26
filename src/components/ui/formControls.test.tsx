import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@shared/validation/schemas";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { Field, Input } from "./index";

/** Mirrors the signup form's wiring, which is what every other form here copies. */
function TestForm({ onValid }: { onValid: (values: SignupInput) => void }) {
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", phone: "", password: "", role: "respondent" },
  });
  const {
    register,
    formState: { errors },
  } = form;
  const { formRef, onSubmit } = useAutofillSafeSubmit(form, onValid);

  return (
    <form onSubmit={onSubmit} ref={formRef}>
      <Field error={errors.full_name?.message} label="Full name">
        <Input {...register("full_name")} />
      </Field>
      <Field error={errors.phone?.message} label="Phone number">
        <Input {...register("phone")} />
      </Field>
      <Field error={errors.password?.message} label="Password">
        <Input type="password" {...register("password")} />
      </Field>
      <button type="submit">Submit</button>
    </form>
  );
}

/**
 * Sets a value the way a browser autofill does: straight onto the element, with no
 * React synthetic event behind it.
 */
function autofill(element: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(element, value);
}

describe("form controls with react-hook-form", () => {
  it("submits values the user typed", async () => {
    const onValid = vi.fn();
    render(<TestForm onValid={onValid} />);

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Rehobot Wolde" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "+251935268237" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "ethosk-demo-2024" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid.mock.calls[0]?.[0]).toMatchObject({
      full_name: "Rehobot Wolde",
      phone: "+251935268237",
    });
  });

  it("submits values the browser autofilled without firing a React event", async () => {
    const onValid = vi.fn();
    render(<TestForm onValid={onValid} />);

    autofill(screen.getByLabelText("Full name") as HTMLInputElement, "Rehobot Wolde");
    autofill(screen.getByLabelText("Phone number") as HTMLInputElement, "+251935268237");
    autofill(screen.getByLabelText("Password") as HTMLInputElement, "ethosk-demo-2024");

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    // The regression this guards against: a field the user can see is filled
    // reporting "Required", because the form never read the DOM value.
    await waitFor(() => {
      expect(screen.queryByText("Required")).toBeNull();
    });
    expect(onValid).toHaveBeenCalledTimes(1);
  });

  it("forwards refs, so the form library holds the real DOM node", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input aria-label="Solo" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
