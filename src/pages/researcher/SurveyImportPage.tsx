import { Link } from "react-router-dom";
import {
  Card,
  Icon,
  Notice,
  SectionHeading,
} from "@/components/ui";

/**
 * §4.3 Survey Import — placeholder page.
 *
 * The actual file parsing (CSV / DOCX / PDF → questions) is a future sprint.
 * This page shows the upload UI and a "coming soon" notice for the
 * processing step so the entry-point card is functional from day one.
 */
export function SurveyImportPage() {
  return (
    <div className="space-y-stack-lg max-w-2xl mx-auto">
      <Link
        to="/researcher/surveys/new"
        className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline mb-2"
      >
        <Icon className="text-[16px]" name="arrow_back" />
        Back to Survey Creation
      </Link>

      <SectionHeading
        subtitle="Upload an existing survey file and we'll convert it into the Ethosk builder format."
        title="Import Survey"
      />

      <Card className="p-8 border-2 border-dashed border-outline-variant/50 bg-surface-container-low/30">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Upload icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#2e7d32]/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[40px] text-[#2e7d32]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              upload_file
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-on-surface mb-2">
              Drag & Drop Your Survey File
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Supported formats: <strong>CSV</strong>, <strong>DOCX</strong>, <strong>PDF</strong>
            </p>

            <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-[#003450] transition-colors cursor-pointer active:scale-95">
              <Icon className="text-[18px]" name="folder_open" />
              Browse Files
              <input type="file" className="sr-only" accept=".csv,.docx,.pdf" />
            </label>
          </div>

          <p className="text-xs text-on-surface-variant">
            Maximum file size: 10 MB
          </p>
        </div>
      </Card>

      <Notice tone="info">
        <strong>Coming Soon:</strong> Automatic question extraction from uploaded files is being
        developed. For now, please use the{" "}
        <Link to="/researcher/surveys/new/manual" className="text-primary font-semibold underline">
          Manual Builder
        </Link>{" "}
        or the{" "}
        <Link to="/researcher/surveys/new/ai" className="text-primary font-semibold underline">
          AI Survey Generator
        </Link>
        .
      </Notice>

      {/* Format guide */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
          <Icon className="text-[18px] text-on-surface-variant" name="help_outline" />
          Supported Format Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-on-surface-variant">
          <div className="p-3 rounded-lg bg-surface-container-low">
            <p className="font-bold text-on-surface mb-1">CSV</p>
            <p>One row per question. Columns: question text, type, option 1, option 2, …</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <p className="font-bold text-on-surface mb-1">DOCX</p>
            <p>Numbered list with question text. Bulleted sub-items become answer options.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <p className="font-bold text-on-surface mb-1">PDF</p>
            <p>Scanned or text-based survey forms. OCR extraction applied automatically.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
