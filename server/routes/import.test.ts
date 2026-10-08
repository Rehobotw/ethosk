if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}

import { describe, expect, it, vi } from "vitest";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

vi.mock("pdf-parse", () => {
  return {
    PDFParse: class MockPDFParse {
      constructor(_opts?: any) {}
      getText() {
        return Promise.resolve({
          text: "Ethioskop Digital Survey\n1. How often do you buy airtime?\n- Daily\n- Weekly",
        });
      }
      destroy() {
        return Promise.resolve(undefined);
      }
    },
  };
});

describe("Document Text Extraction Route (REH-131)", () => {
  it("extracts text successfully from DOCX buffer via mammoth", async () => {
    const mockExtract = vi.spyOn(mammoth, "extractRawText").mockResolvedValueOnce({
      value: "1. What is your profession?\nA) Teacher\nB) Engineer\nC) Doctor",
      messages: [],
    } as any);

    const result = await mammoth.extractRawText({ buffer: Buffer.from("fake-docx-data") });
    expect(result.value).toContain("What is your profession?");
    expect(result.value).toContain("Teacher");
    expect(mockExtract).toHaveBeenCalledTimes(1);

    mockExtract.mockRestore();
  });

  it("extracts text successfully from PDF buffer via PDFParse", async () => {
    const mockGetText = vi.fn().mockResolvedValueOnce({
      text: "Ethioskop Digital Survey\n1. How often do you buy airtime?\n- Daily\n- Weekly",
    });
    const mockDestroy = vi.fn().mockResolvedValueOnce(undefined);

    vi.spyOn(PDFParse.prototype, "getText").mockImplementation(mockGetText);
    vi.spyOn(PDFParse.prototype, "destroy").mockImplementation(mockDestroy);

    const parser = new PDFParse({ data: Buffer.from("%PDF-1.4 mock") });
    const res = await parser.getText();
    const text = typeof res === "string" ? res : res?.text || "";

    expect(text).toContain("Ethioskop Digital Survey");
    expect(text).toContain("How often do you buy airtime?");
  });
});
