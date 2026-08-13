import { useState, type ChangeEvent } from "react";
import { Icon, Notice } from "../ui";
import { api, ApiRequestError } from "@/lib/api";

interface ComplianceSectionProps {
  complianceRequired: boolean | null;
  complianceDocumentUrl: string | null;
  complianceAttestedAt: string | null;
  onChange: (updates: {
    complianceRequired: boolean | null;
    complianceDocumentUrl: string | null;
    complianceAttestedAt: string | null;
  }) => void;
  disabled?: boolean;
}

export function ComplianceSection({
  complianceRequired,
  complianceDocumentUrl,
  complianceAttestedAt,
  onChange,
  disabled = false,
}: ComplianceSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleModeSelect = (required: boolean) => {
    if (disabled) return;
    if (required) {
      onChange({
        complianceRequired: true,
        complianceDocumentUrl: complianceDocumentUrl,
        complianceAttestedAt: null,
      });
    } else {
      onChange({
        complianceRequired: false,
        complianceDocumentUrl: null,
        complianceAttestedAt: complianceAttestedAt || new Date().toISOString(),
      });
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await api<{ url: string; fileName: string }>("/surveys/compliance-document", {
        method: "POST",
        body: formData,
      });

      setUploadedFileName(result.fileName || file.name);
      onChange({
        complianceRequired: true,
        complianceDocumentUrl: result.url,
        complianceAttestedAt: null,
      });
    } catch (err) {
      setUploadError(
        err instanceof ApiRequestError ? err.message : "Failed to upload clearance document. Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAttestationToggle = (checked: boolean) => {
    if (disabled) return;
    onChange({
      complianceRequired: false,
      complianceDocumentUrl: null,
      complianceAttestedAt: checked ? new Date().toISOString() : null,
    });
  };

  const isCompliant =
    (complianceRequired === true && Boolean(complianceDocumentUrl)) ||
    (complianceRequired === false && Boolean(complianceAttestedAt));

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
              3
            </span>
            <h2 className="font-title-sm text-title-sm text-on-surface">
              Research Legal &amp; Ethical Compliance
            </h2>
          </div>
          <p className="mt-1 text-body-sm text-on-surface-variant text-xs">
            Ethiopian research standards require verifying whether your study involves clinical, health, institutional, or human-subject clearance.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            isCompliant
              ? "bg-status-passed/10 text-status-passed border border-status-passed/30"
              : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
          }`}
        >
          <Icon className="text-[14px]" name={isCompliant ? "verified" : "pending"} />
          {isCompliant ? "Compliance Verified" : "Pending Selection"}
        </span>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-on-surface">
          Does this study require legal or ethical clearance (e.g. IRB, EPHI, EBI, or Ministry approval)?
        </p>

        {/* Path Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* YES Path */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeSelect(true)}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              complianceRequired === true
                ? "border-primary bg-primary-fixed/20 shadow-sm"
                : "border-outline-variant bg-surface-container-low hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`flex h-4 w-4 rounded-full border items-center justify-center ${
                  complianceRequired === true ? "border-primary" : "border-outline"
                }`}
              >
                {complianceRequired === true && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span className="font-semibold text-sm text-on-surface">
                YES — Clearance Required
              </span>
            </div>
            <p className="text-xs text-on-surface-variant pl-6">
              Health, clinical, minor-involving, or institutional studies requiring formal IRB/EPHI approval.
            </p>
          </button>

          {/* NO Path */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeSelect(false)}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
              complianceRequired === false
                ? "border-primary bg-primary-fixed/20 shadow-sm"
                : "border-outline-variant bg-surface-container-low hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`flex h-4 w-4 rounded-full border items-center justify-center ${
                  complianceRequired === false ? "border-primary" : "border-outline"
                }`}
              >
                {complianceRequired === false && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span className="font-semibold text-sm text-on-surface">
                NO — Exempt / Non-clinical
              </span>
            </div>
            <p className="text-xs text-on-surface-variant pl-6">
              Standard consumer, market research, or public opinion surveys not subject to institutional bioethics review.
            </p>
          </button>
        </div>

        {/* YES Path Document Upload */}
        {complianceRequired === true && (
          <div className="rounded-xl border border-primary/30 bg-surface-container-low p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wide">
                Upload Clearance Document / Certificate
              </span>
              <span className="text-[11px] text-on-surface-variant">PDF, PNG, JPG, DOCX (Max 8MB)</span>
            </div>

            {uploadError && <Notice tone="error">{uploadError}</Notice>}

            {complianceDocumentUrl ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-status-passed/40">
                <div className="flex items-center gap-2 text-xs">
                  <Icon className="text-status-passed text-[18px]" name="check_circle" />
                  <span className="font-medium text-on-surface truncate max-w-[280px]">
                    {uploadedFileName || complianceDocumentUrl.split("/").pop() || "Clearance Document Attached"}
                  </span>
                </div>
                <label className="text-xs text-primary hover:underline cursor-pointer">
                  Replace File
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                    onChange={handleFileUpload}
                    disabled={disabled || uploading}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-6 cursor-pointer bg-surface-container-lowest transition-colors">
                <Icon className="text-primary text-3xl mb-1" name="upload_file" />
                <span className="text-xs font-semibold text-on-surface">
                  {uploading ? "Uploading clearance certificate…" : "Click or drag clearance document to upload"}
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  Institutional Review Board (IRB), EPHI, or Ministry authorization
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                  onChange={handleFileUpload}
                  disabled={disabled || uploading}
                />
              </label>
            )}
          </div>
        )}

        {/* NO Path Attestation Checkbox */}
        {complianceRequired === false && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                checked={Boolean(complianceAttestedAt)}
                onChange={(e) => handleAttestationToggle(e.target.checked)}
                disabled={disabled}
              />
              <span className="text-xs text-on-surface leading-relaxed">
                <strong>Legal Attestation:</strong> I confirm that this survey study is exempt from mandatory institutional ethical review under Ethiopian research regulations and complies with Federal Democratic Republic of Ethiopia Proclamation 1321/2024.
              </span>
            </label>

            {complianceAttestedAt && (
              <p className="text-[11px] text-on-surface-variant/80 pl-7">
                Attested on {new Date(complianceAttestedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
