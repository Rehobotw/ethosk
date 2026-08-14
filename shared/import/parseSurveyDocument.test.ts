import { describe, expect, it } from "vitest";
import { parseSurveyText } from "./parseSurveyDocument.js";

describe("parseSurveyText", () => {
  it("returns empty questions for empty input", () => {
    expect(parseSurveyText("")).toEqual({ questions: [] });
    expect(parseSurveyText("   \n\n  ")).toEqual({ questions: [] });
  });

  it("extracts document title and standard numbered questions", () => {
    const documentText = `
Mobile Money Adoption in Urban Ethiopia

1. What is your age?
A. 18-24
B. 25-34
C. 35-44
D. 45+

2. Which mobile money services do you use? (Select all that apply)
- Telebirr
- CBE Birr
- Awash Birr
- E-Birr

3. What features would you like to see added in future updates?
    `;

    const parsed = parseSurveyText(documentText);

    expect(parsed.title).toBe("Mobile Money Adoption in Urban Ethiopia");
    expect(parsed.questions).toHaveLength(3);

    const q1 = parsed.questions[0]!;
    const q2 = parsed.questions[1]!;
    const q3 = parsed.questions[2]!;

    // Question 1: Single choice
    expect(q1.text).toBe("What is your age?");
    expect(q1.type).toBe("single_choice");
    expect(q1.options).toEqual(["18-24", "25-34", "35-44", "45+"]);

    // Question 2: Multi choice
    expect(q2.text).toBe("Which mobile money services do you use? (Select all that apply)");
    expect(q2.type).toBe("multi_choice");
    expect(q2.options).toEqual(["Telebirr", "CBE Birr", "Awash Birr", "E-Birr"]);

    // Question 3: Open text
    expect(q3.text).toBe("What features would you like to see added in future updates?");
    expect(q3.type).toBe("text");
    expect(q3.options).toBeUndefined();
  });

  it("handles Q1: and Question 1 format prefixes", () => {
    const documentText = `
Q1: Are you currently employed in Addis Ababa?
a) Yes
b) No

Question 2. Rate your satisfaction with public transportation:
1) Very Satisfied
2) Neutral
3) Dissatisfied
    `;

    const parsed = parseSurveyText(documentText);
    expect(parsed.questions).toHaveLength(2);

    const q1 = parsed.questions[0]!;
    const q2 = parsed.questions[1]!;

    expect(q1.text).toBe("Are you currently employed in Addis Ababa?");
    expect(q1.options).toEqual(["Yes", "No"]);
    expect(q2.text).toBe("Rate your satisfaction with public transportation:");
    expect(q2.options).toEqual(["Very Satisfied", "Neutral", "Dissatisfied"]);
  });

  it("handles checkbox style multi-choice questions", () => {
    const documentText = `
1. Preferred news sources:
- [ ] Radio / TV
- [ ] Telegram channels
- [ ] Newspapers
    `;

    const parsed = parseSurveyText(documentText);
    const q1 = parsed.questions[0]!;
    expect(q1.type).toBe("multi_choice");
    expect(q1.options).toEqual(["Radio / TV", "Telegram channels", "Newspapers"]);
  });
});
