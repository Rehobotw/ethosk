import { useRef, type FormEventHandler } from "react";
import type { FieldValues, Path, PathValue, SubmitHandler, UseFormReturn } from "react-hook-form";
import { ZodError, type ZodIssue } from "zod";

/** Controls a browser will fill on its own. Checkboxes and files are never autofilled. */
const AUTOFILLABLE = "input[name]:not([type=checkbox]):not([type=radio]):not([type=file]), select[name], textarea[name]";

/**
 * Submit handler that reconciles browser-autofilled values before validating.
 *
 * react-hook-form tracks values from React change events. A browser filling a
 * saved name, phone, or password does not reliably produce one — particularly when
 * it happens before hydration — so the value sits in the DOM while the form's own
 * state stays empty. Validation then fails on fields the user can plainly see are
 * filled in, which is indistinguishable from a broken form.
 *
 * Reading the DOM immediately before validation closes that gap. The DOM is the
 * authority for uncontrolled inputs, so this only ever corrects state that had
 * drifted from what is on screen.
 */
export function useAutofillSafeSubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  onValid: SubmitHandler<T>,
): { formRef: React.RefObject<HTMLFormElement>; onSubmit: FormEventHandler<HTMLFormElement> } {
  const formRef = useRef<HTMLFormElement>(null);
  const validateAndSubmit = form.handleSubmit(onValid);

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    syncAutofilledValues(formRef.current ?? event.currentTarget, form);
    return validateAndSubmit(event);
  };

  return { formRef, onSubmit };
}

function syncAutofilledValues<T extends FieldValues>(
  formElement: HTMLFormElement | null,
  form: UseFormReturn<T>,
): void {
  if (!formElement) return;

  const controls = formElement.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(AUTOFILLABLE);

  for (const control of controls) {
    const name = control.name as Path<T>;
    if (!name) continue;

    // Numeric inputs are registered with a valueAsNumber transform, so writing the
    // raw string back would change the value's type under the schema.
    if (control instanceof HTMLInputElement && control.type === "number") continue;

    if (control.value === form.getValues(name)) continue;

    form.setValue(name, control.value as PathValue<T, Path<T>>, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }
}

// ---------------------------------------------------------------------------
// Readable validation messages
// ---------------------------------------------------------------------------

/**
 * How a field's position in the schema is named to the person looking at it.
 *
 * A path segment followed by an index becomes a 1-based, human position — so
 * `questions[1].options[0]` reads as "Question 2, option 1" rather than as a
 * subscript expression nobody outside the codebase can decode.
 */
const FIELD_LABELS: Record<string, string> = {
  questions: "Question",
  options: "option",
  title: "Title",
  description: "Description",
  reward_etb: "Reward",
  bio: "Bio",
  institution: "Institution",
  // Named by its question, so "Question 2" is clearer than "Question 2, text".
  text: "",
};

/** Issues shown before the rest are summarized, so one blank form is not a wall of text. */
const MAX_ISSUES = 3;

/**
 * Turns a validation failure into something a person can act on.
 *
 * `ZodError.message` is a JSON dump of every issue. Rendering it directly is what
 * puts `[ { "code": "too_small", "path": [ "questions", 1, ... ] } ]` in front of
 * a researcher who simply left an answer option blank.
 */
export function describeZodError(error: ZodError): string {
  const shown = error.issues.slice(0, MAX_ISSUES).map(describeIssue);
  const remaining = error.issues.length - shown.length;
  const summary = shown.join(" ");

  return remaining > 0
    ? `${summary} And ${remaining} more problem${remaining === 1 ? "" : "s"} to fix.`
    : summary;
}

function describeIssue(issue: ZodIssue): string {
  const location = describePath(issue.path);
  const message = issue.message.endsWith(".") ? issue.message : `${issue.message}.`;
  return location ? `${location}: ${message}` : message;
}

function describePath(path: (string | number)[]): string {
  const parts: string[] = [];

  path.forEach((segment, index) => {
    // An index is reported as part of the key above it, not on its own.
    if (typeof segment === "number") return;

    const label = FIELD_LABELS[segment] ?? segment;
    if (!label) return;

    const next = path[index + 1];
    parts.push(typeof next === "number" ? `${label} ${next + 1}` : label);
  });

  return parts.join(", ");
}

/** Single entry point for turning anything thrown by a mutation into display text. */
export function describeFormError(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ZodError) return describeZodError(error);
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
