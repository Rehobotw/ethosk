import { describe, expect, it } from "vitest";
import { parseGoogleForm } from "./surveys";

describe("parseGoogleForm - Google Form Import Engine", () => {
  it("parses single-choice, multi-choice, scale, and text questions with options from FB_PUBLIC_LOAD_DATA_", () => {
    const mockFbData = [
      null,
      [
        "Comprehensive Survey Description",
        "Customer Satisfaction & Feedback Form",
        null,
        null,
        null,
        null,
        null,
        null,
        [
          // Item 1: Short text question (type 0)
          [
            "101",
            "What is your full name?",
            null,
            0,
            [[1001, null, 1]], // required = 1
          ],
          // Item 2: Multiple choice (type 2) with options
          [
            "102",
            "How often do you use our platform?",
            null,
            2,
            [
              [
                1002,
                [
                  ["Daily", null, null, null, 0],
                  ["Weekly", null, null, null, 0],
                  ["Monthly", null, null, null, 0],
                  ["Rarely or Never", null, null, null, 0],
                ],
                1,
              ],
            ],
          ],
          // Item 3: Checkbox multi-choice (type 4) with options
          [
            "103",
            "Which payment methods do you prefer?",
            "Select all that apply",
            4,
            [
              [
                1003,
                [
                  ["Telebirr", null, null, null, 0],
                  ["CBE Birr", null, null, null, 0],
                  ["Bank Transfer", null, null, null, 0],
                  ["Cash", null, null, null, 0],
                ],
                0,
              ],
            ],
          ],
          // Item 4: Dropdown (type 3) with options
          [
            "104",
            "Select your region of residence",
            null,
            3,
            [
              [
                1004,
                [
                  ["Addis Ababa", null, null, null, 0],
                  ["Oromia", null, null, null, 0],
                  ["Amhara", null, null, null, 0],
                  ["Sidama", null, null, null, 0],
                ],
                1,
              ],
            ],
          ],
        ],
      ],
    ];

    const html = `<html>
      <head><title>Customer Satisfaction & Feedback Form</title></head>
      <body>
        <script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(mockFbData)};</script>
      </body>
    </html>`;

    const result = parseGoogleForm(html);
    expect(result.title).toBe("Customer Satisfaction & Feedback Form");
    expect(result.questions).toHaveLength(4);

    // Q1: Short text
    expect(result.questions[0]?.text).toBe("What is your full name?");
    expect(result.questions[0]?.type).toBe("text");
    expect(result.questions[0]?.options).toBeUndefined();
    expect(result.questions[0]?.required).toBe(true);

    // Q2: Single choice
    expect(result.questions[1]?.text).toBe("How often do you use our platform?");
    expect(result.questions[1]?.type).toBe("single_choice");
    expect(result.questions[1]?.options).toEqual(["Daily", "Weekly", "Monthly", "Rarely or Never"]);
    expect(result.questions[1]?.required).toBe(true);

    // Q3: Multi choice (checkbox)
    expect(result.questions[2]?.text).toBe("Which payment methods do you prefer?");
    expect(result.questions[2]?.type).toBe("multi_choice");
    expect(result.questions[2]?.options).toEqual(["Telebirr", "CBE Birr", "Bank Transfer", "Cash"]);
    expect(result.questions[2]?.required).toBe(false);

    // Q4: Dropdown (single choice)
    expect(result.questions[3]?.text).toBe("Select your region of residence");
    expect(result.questions[3]?.type).toBe("single_choice");
    expect(result.questions[3]?.options).toEqual(["Addis Ababa", "Oromia", "Amhara", "Sidama"]);
    expect(result.questions[3]?.required).toBe(true);
  });

  it("parses multi-section Google Forms and extracts section headers along with questions from all sections", () => {
    const mockMultiSectionFbData = [
      null,
      [
        "Academic Research Survey",
        "National Higher Education & Tech Adoption",
        null,
        null,
        null,
        null,
        null,
        null,
        [
          // Section 1 Header (type 8)
          ["201", "Section 1: General Demographics", "Basic participant background", 8, []],
          // Question in Section 1
          [
            "202",
            "What is your gender?",
            null,
            2,
            [
              [
                2001,
                [
                  ["Female", null, null, null, 0],
                  ["Male", null, null, null, 0],
                  ["Prefer not to say", null, null, null, 0],
                ],
                1,
              ],
            ],
          ],
          // Section 2 Header (type 8)
          ["203", "Section 2: Technology Usage", "Questions about digital devices", 8, []],
          // Question in Section 2
          [
            "204",
            "Do you own a smartphone?",
            null,
            2,
            [
              [
                2002,
                [
                  ["Yes", null, null, null, 0],
                  ["No", null, null, null, 0],
                ],
                1,
              ],
            ],
          ],
          // Question 2 in Section 2
          [
            "205",
            "Describe your daily mobile app usage",
            null,
            1, // paragraph text
            [[2003, null, 0]],
          ],
        ],
      ],
    ];

    const html = `<html>
      <body>
        <script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(mockMultiSectionFbData)};</script>
      </body>
    </html>`;

    const result = parseGoogleForm(html);
    expect(result.title).toBe("National Higher Education & Tech Adoption");
    expect(result.questions).toHaveLength(5);

    // Section 1 Header
    expect(result.questions[0]?.text).toContain("[Section] Section 1: General Demographics");
    expect(result.questions[0]?.type).toBe("text");

    // Q1 in Section 1
    expect(result.questions[1]?.text).toBe("What is your gender?");
    expect(result.questions[1]?.type).toBe("single_choice");
    expect(result.questions[1]?.options).toEqual(["Female", "Male", "Prefer not to say"]);

    // Section 2 Header
    expect(result.questions[2]?.text).toContain("[Section] Section 2: Technology Usage");

    // Q1 in Section 2
    expect(result.questions[3]?.text).toBe("Do you own a smartphone?");
    expect(result.questions[3]?.type).toBe("single_choice");
    expect(result.questions[3]?.options).toEqual(["Yes", "No"]);

    // Q2 in Section 2
    expect(result.questions[4]?.text).toBe("Describe your daily mobile app usage");
    expect(result.questions[4]?.type).toBe("text");
  });

  it("falls back to DOM parsing if FB_PUBLIC_LOAD_DATA_ is absent", () => {
    const domHtml = `<html>
      <head><meta property="og:title" content="Sample DOM Google Form" /></head>
      <body>
        <div role="heading">Section 1: Background</div>
        <div role="listitem">
          <div role="heading">Which language do you speak?</div>
          <div role="radio" data-value="Amharic"><span>Amharic</span></div>
          <div role="radio" data-value="English"><span>English</span></div>
        </div>
      </body>
    </html>`;

    const result = parseGoogleForm(domHtml);
    expect(result.title).toBe("Sample DOM Google Form");
    expect(result.questions.length).toBeGreaterThanOrEqual(1);

    const choiceQ = result.questions.find((q) => q.text.includes("Which language"));
    expect(choiceQ).toBeDefined();
    expect(choiceQ?.type).toBe("single_choice");
    expect(choiceQ?.options).toEqual(["Amharic", "English"]);
  });
});
