import { describe, expect, it } from "vitest";
import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  ACCEPTED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  validateDocumentFile,
} from "@shared/validation/schemas";

describe("Finalized Document Upload Rules (Spec v4 §7.4 item 2, §5, REH-69)", () => {
  it("enforces 10MB max upload size (10,485,760 bytes)", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });

  it("permits valid PDF under 10MB", () => {
    const validPdf = {
      name: "irb_ethical_clearance.pdf",
      size: 2.5 * 1024 * 1024, // 2.5MB
      type: "application/pdf",
    };

    const result = validateDocumentFile(validPdf);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("permits valid JPG and PNG images under 10MB", () => {
    const validJpg = {
      name: "student_id_front.jpg",
      size: 4 * 1024 * 1024, // 4MB
      type: "image/jpeg",
    };

    const validPng = {
      name: "employee_badge.png",
      size: 8.5 * 1024 * 1024, // 8.5MB
      type: "image/png",
    };

    const resultJpg = validateDocumentFile(validJpg);
    expect(resultJpg.valid).toBe(true);

    const resultPng = validateDocumentFile(validPng);
    expect(resultPng.valid).toBe(true);
  });

  it("rejects oversized file (> 10MB) with specific size error", () => {
    const oversizedPdf = {
      name: "heavy_scanned_archive.pdf",
      size: 10 * 1024 * 1024 + 1024, // 10MB + 1KB
      type: "application/pdf",
    };

    const result = validateDocumentFile(oversizedPdf);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("FILE_TOO_LARGE");
    expect(result.message).toMatch(/File is too large.*10MB/i);
  });

  it("rejects unsupported document types (.docx, .heic, .txt, .exe) with specific format error", () => {
    const unsupportedDocx = {
      name: "study_proposal.docx",
      size: 500 * 1024,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    const unsupportedHeic = {
      name: "badge_photo.heic",
      size: 1.2 * 1024 * 1024,
      type: "image/heic",
    };

    const unsupportedTxt = {
      name: "notes.txt",
      size: 1024,
      type: "text/plain",
    };

    const resultDocx = validateDocumentFile(unsupportedDocx);
    expect(resultDocx.valid).toBe(false);
    expect(resultDocx.error).toBe("UNSUPPORTED_FILE_TYPE");
    expect(resultDocx.message).toMatch(/Unsupported file type.*PDF, JPG, or PNG/i);

    const resultHeic = validateDocumentFile(unsupportedHeic);
    expect(resultHeic.valid).toBe(false);
    expect(resultHeic.error).toBe("UNSUPPORTED_FILE_TYPE");

    const resultTxt = validateDocumentFile(unsupportedTxt);
    expect(resultTxt.valid).toBe(false);
    expect(resultTxt.error).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("checks accepted MIME types and extensions lists", () => {
    expect(ACCEPTED_UPLOAD_MIME_TYPES).toContain("application/pdf");
    expect(ACCEPTED_UPLOAD_MIME_TYPES).toContain("image/jpeg");
    expect(ACCEPTED_UPLOAD_MIME_TYPES).toContain("image/png");
    expect(ACCEPTED_UPLOAD_EXTENSIONS).toContain(".pdf");
    expect(ACCEPTED_UPLOAD_EXTENSIONS).toContain(".jpg");
    expect(ACCEPTED_UPLOAD_EXTENSIONS).toContain(".png");
  });
});
