if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}

import { Router } from "express";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { requireAuth } from "../lib/auth.js";
import { ApiError, asyncRoute } from "../lib/http.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const importRouter = Router();

/**
 * POST /api/surveys/extract-document-text
 * Robust document text extraction for researcher survey imports.
 * Uses mammoth for DOCX extraction and pdf-parse for PDF documents.
 */
importRouter.post(
  "/extract-document-text",
  requireAuth("researcher", "admin", "super_admin"),
  upload.single("file"),
  asyncRoute(async (req, res) => {
    let buffer: Buffer;
    let filename: string;

    if (req.file) {
      buffer = req.file.buffer;
      filename = req.file.originalname;
    } else if (req.body && typeof req.body.base64 === "string") {
      buffer = Buffer.from(req.body.base64, "base64");
      filename = req.body.filename || "document";
    } else {
      throw new ApiError(400, "MISSING_FILE", "Please upload a document file (DOCX, PDF, TXT, CSV).");
    }

    const extension = filename.split(".").pop()?.toLowerCase();
    let extractedText = "";

    if (extension === "docx") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || "";
      } catch (err: any) {
        throw new ApiError(422, "DOCX_EXTRACTION_FAILED", `Failed to parse DOCX document: ${err.message || err}`);
      }
    } else if (extension === "pdf") {
      try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        extractedText = (typeof result === "string" ? result : result?.text || "") || "";
        await parser.destroy();
      } catch (err: any) {
        throw new ApiError(422, "PDF_EXTRACTION_FAILED", `Failed to parse PDF document: ${err.message || err}`);
      }
    } else if (extension === "txt" || extension === "csv") {
      extractedText = buffer.toString("utf-8");
    } else {
      throw new ApiError(400, "UNSUPPORTED_FORMAT", "Unsupported file type. Supported formats: DOCX, PDF, TXT, CSV.");
    }

    const trimmed = extractedText.trim();
    if (!trimmed) {
      throw new ApiError(422, "EMPTY_DOCUMENT", "The uploaded document contains no readable text.");
    }

    res.json({
      success: true,
      filename,
      charactersExtracted: trimmed.length,
      text: trimmed,
    });
  }),
);
