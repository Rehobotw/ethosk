import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyImportPage, parseSurveyText } from "./SurveyImportPage";

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SurveyImportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SurveyImportPage (§4.3.3 Dedicated Import Page)", () => {
  it("parseSurveyText parses questions and options correctly", () => {
    const rawText = `National Digital Literacy Survey
1. How often do you access the internet?
A) Daily
B) Weekly
C) Rarely
D) Never

2. Describe your experience with digital banking services in Ethiopia.

3. Which devices do you own?
* Smartphone
* Laptop
* Tablet
`;

    const parsed = parseSurveyText(rawText);
    expect(parsed.title).toBe("National Digital Literacy Survey");
    expect(parsed.questions).toHaveLength(3);

    const q1 = parsed.questions[0]!;
    expect(q1.text).toContain("How often do you access the internet?");
    expect(q1.type).toBe("single_choice");
    expect(q1.options).toHaveLength(4);
    expect(q1.options?.[0]).toBe("Daily");

    const q2 = parsed.questions[1]!;
    expect(q2.text).toContain("Describe your experience with digital banking");
    expect(q2.type).toBe("text");
    expect(q2.options).toBeUndefined();

    const q3 = parsed.questions[2]!;
    expect(q3.text).toContain("Which devices do you own?");
    expect(q3.options).toHaveLength(3);
  });

  it("renders upload zone and navigation back link", () => {
    renderWithProviders();

    expect(screen.getByText("Import Survey")).toBeDefined();
    expect(screen.getByText("Back to Survey Creation")).toBeDefined();
    expect(screen.getByText("Drag & Drop your survey document")).toBeDefined();
  });

  it("rejects unsupported file formats with clear error", async () => {
    renderWithProviders();

    const file = new File(["col1,col2\nval1,val2"], "survey.csv", { type: "text/csv" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Invalid file type. Only .docx, .pdf, and .txt files are accepted."),
      ).toBeDefined();
    });
  });

  it("accepts valid .txt file and extracts questions for editing", async () => {
    renderWithProviders();

    const content = `1. What is your primary language?
A) Amharic
B) Afan Oromo
C) Tigrinya
`;
    const file = new File([content], "questions.txt", { type: "text/plain" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue("What is your primary language?")).toBeDefined();
      expect(screen.getByDisplayValue("Amharic")).toBeDefined();
      expect(screen.getByDisplayValue("Afan Oromo")).toBeDefined();
    });

    // Verify Save actions exist
    expect(screen.getByText("Save Draft (WIP)")).toBeDefined();
    expect(screen.getByText("Save as Final Draft")).toBeDefined();
  });
});
