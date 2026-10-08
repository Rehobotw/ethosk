import { describe, expect, it, vi } from "vitest";
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

  it("renders upload zone and navigation breadcrumb", () => {
    renderWithProviders();

    expect(screen.getByText("Import Questionnaire from Document")).toBeDefined();
    expect(screen.getByText("Cancel & Return to Hub")).toBeDefined();
    expect(screen.getByText("Drag and drop your survey document here")).toBeDefined();
  });

  it("rejects unsupported file formats with clear error", async () => {
    renderWithProviders();

    const file = new File(["invalid binary"], "malware.exe", { type: "application/x-msdownload" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Invalid file type. Only .docx, .pdf, .csv, .xlsx, and .txt files are accepted."),
      ).toBeDefined();
    });
  });

  it("accepts valid .txt file and extracts questions into schema preview", async () => {
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
      expect(screen.getByText(/What is your primary language\?/)).toBeDefined();
      expect(screen.getByText(/3 choices extracted/)).toBeDefined();
      expect(screen.getByText(/Parsed 1 questions successfully/)).toBeDefined();
    });
  });

  it("renders Google Form import section with URL input and submit button", () => {
    renderWithProviders();

    expect(screen.getByText("Import from Google Forms")).toBeDefined();
    expect(screen.getByPlaceholderText("https://docs.google.com/forms/.../viewform")).toBeDefined();
    expect(screen.getByRole("button", { name: /Import form/i })).toBeDefined();
  });

  it("extracts DOCX survey questions via server extraction endpoint and shows preview items", async () => {
    const docxContent = `1. Which payment method do you use most frequently?
A) Telebirr
B) CBE Birr
C) Cash
2. What feature would you like to see next?
`;

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        filename: "payment_survey.docx",
        charactersExtracted: docxContent.length,
        text: docxContent,
      }),
    } as any);

    renderWithProviders();

    const file = new File(["fake-docx-binary"], "payment_survey.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("extracted-questions-list")).toBeDefined();
      const previewItems = screen.getAllByTestId("question-preview-item");
      expect(previewItems.length).toBe(2);
      expect(screen.getByText(/Which payment method do you use most frequently\?/)).toBeDefined();
      expect(screen.getByText(/3 choices extracted/)).toBeDefined();
    });
  });

  it("handles PDF extraction failure with explicit error and no dummy fallback", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        error: {
          code: "PDF_EXTRACTION_FAILED",
          message: "Corrupted PDF stream or password-protected document.",
        },
      }),
    } as any);

    renderWithProviders();

    const file = new File(["%PDF-corrupt"], "protected.pdf", {
      type: "application/pdf",
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Corrupted PDF stream or password-protected document."),
      ).toBeDefined();
      expect(screen.queryByText("Sample imported survey question")).toBeNull();
    });
  });
});
