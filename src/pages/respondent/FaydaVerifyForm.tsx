import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { decodeImage, type FaydaErrorCode, type FaydaResult, type FaydaSuccess } from "fayda-decoder";
import { verifySignature } from "fayda-decoder/verify";
import type { VerificationTier } from "@shared/types";
import { Button, Field, Input, Notice } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useLanguage } from "@/lib/language";

interface VerifyResult {
  verification_tier: VerificationTier;
  verified_at: string;
  live: boolean;
  method?: string;
  decoded?: {
    full_name: string | null;
    gender: string | null;
    date_of_birth: string | null;
    fan: string | null;
    face_base64: string | null;
    signature_verified: boolean | null;
  };
}

export function FaydaVerifyForm({ onVerified }: { onVerified: () => Promise<void> | void }) {
  const { language } = useLanguage();
  const isAm = language === "am";

  const [mode, setMode] = useState<"qr" | "manual">("qr");
  const [fin, setFin] = useState("");
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedSuccess, setDecodedSuccess] = useState<FaydaSuccess | null>(null);
  const [isSignatureVerified, setIsSignatureVerified] = useState<boolean | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const digits = fin.replace(/\D/g, "");
  const complete = digits.length >= 12;

  const verifyMutation = useMutation({
    mutationFn: (bodyPayload: {
      fayda_id?: string;
      qr_payload?: string;
      full_name?: string;
      gender?: "M" | "F" | "Other";
      dob?: string;
      signature_verified?: boolean;
    }) => api<VerifyResult>("/respondents/verify-fayda", { body: bodyPayload }),
    onSuccess: async () => {
      setFin("");
      await onVerified();
    },
  });

  const mapFaydaErrorCodeToMessage = (code: FaydaErrorCode) => {
    switch (code) {
      case "NO_QR_FOUND":
        return isAm
          ? "በፎቶው ላይ የፋይዳ QR ኮድ አልተገኘም። እባክዎ ካርዱን በማብራት የተሻለ ፎቶ ያንሱ።"
          : "No QR code detected. Please ensure the Fayda card back is clearly visible with good lighting.";
      case "QR_UNREADABLE":
        return isAm
          ? "የQR ኮዱ ግልጽ አይደለም። እባክዎ ጠጋ ብለው ወይም የተሻለ ጥራት ያለው ፎቶ ይሞክሩ።"
          : "The QR code was detected but could not be read. Please get closer or avoid glare.";
      case "NOT_FAYDA":
        return isAm
          ? "የተገኘው QR ኮድ የፋይዳ መታወቂያ አይደለም። እባክዎ የካርዱን ጀርባ ይሞክሩ።"
          : "A QR code was detected, but it is not a valid Fayda ID payload. Please upload the back of your Fayda card.";
      case "UNSUPPORTED_VERSION":
        return isAm
          ? "የማይታወቅ የፋይዳ QR ቅጽ።"
          : "Unsupported Fayda payload version.";
      default:
        return isAm
          ? "የፋይዳ QR ማረጋገጫ አልተሳካም።"
          : "Failed to decode Fayda card QR code.";
    }
  };

  const readFileBytes = async (file: File): Promise<Uint8Array> => {
    if (typeof file.arrayBuffer === "function") {
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error("Failed to read file as ArrayBuffer"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleProcessImageFile = async (file: File) => {
    setIsDecoding(true);
    setDecodeError(null);
    setDecodedSuccess(null);
    setIsSignatureVerified(null);
    setSelectedFileName(file.name);

    try {
      const bytes = await readFileBytes(file);
      const result: FaydaResult = await decodeImage(bytes, { includeFace: true });

      if (!result.ok) {
        setDecodeError(mapFaydaErrorCodeToMessage(result.error.code));
        return;
      }

      setDecodedSuccess(result);

      // Verify digital signature offline
      try {
        const verification = await verifySignature(result);
        setIsSignatureVerified(verification.verified);
      } catch {
        setIsSignatureVerified(false);
      }
    } catch (err: any) {
      setDecodeError(err?.message || (isAm ? "ፎቶውን ማንበብ አልተሳካም።" : "Could not process image file."));
    } finally {
      setIsDecoding(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmQrVerification = () => {
    if (!decodedSuccess) return;

    verifyMutation.mutate({
      qr_payload: decodedSuccess.raw.payload,
      fayda_id: decodedSuccess.fields.fan || undefined,
      full_name: decodedSuccess.fields.full_name || undefined,
      gender: decodedSuccess.fields.gender || undefined,
      dob: decodedSuccess.fields.date_of_birth || undefined,
      signature_verified: isSignatureVerified ?? undefined,
    });
  };

  const handleFillDemo = () => {
    setFin("3000 0000 0001");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (complete && !verifyMutation.isPending) {
      verifyMutation.mutate({ fayda_id: digits });
    }
  };

  return (
    <div className="mt-stack-md space-y-stack-md">
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-outline-variant/40 gap-4 mb-4">
        <button
          type="button"
          onClick={() => setMode("qr")}
          className={`pb-3 font-semibold text-xs md:text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            mode === "qr"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          <span>{isAm ? "የካርድ QR ኮድ ስካን (ፈጣን/አውቶማቲክ)" : "Scan Fayda Card QR (Instant)"}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`pb-3 font-semibold text-xs md:text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            mode === "manual"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pin</span>
          <span>{isAm ? "በመለያ ቁጥር (FIN)" : "Enter ID Number (FIN)"}</span>
        </button>
      </div>

      {mode === "qr" ? (
        <div className="space-y-4">
          {/* Dropzone for QR Image */}
          {!decodedSuccess ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/40 hover:border-primary bg-primary-container/20 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-primary-container/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">qr_code_2</span>
              </div>

              <h4 className="font-bold text-sm md:text-base text-on-surface mb-1">
                {isAm ? "የፋይዳ ካርድ ጀርባ ፎቶ ይስቀሉ ወይም እዚህ ይጎትቱ" : "Upload photo of the back of your Fayda ID card"}
              </h4>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-4">
                {isAm
                  ? "የካርዱን QR ኮድ በቀጥታ በስልክዎ ወይም በኮምፒውተርዎ ላይ በመፈተሽ ወዲያውኑ ያረጋግጣል። ምንም መረጃ አይቀመጥም።"
                  : "Decodes the embedded QR code completely offline on your device with cryptographic signature verification."}
              </p>

              <button
                type="button"
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 inline-flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>{isAm ? "ፎቶ ይምረጡ" : "Choose Card Photo"}</span>
              </button>

              {isDecoding ? (
                <div className="mt-4 flex items-center justify-center gap-2 text-primary text-xs font-medium animate-pulse">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>{isAm ? "QR ኮዱን በመፈተሽ ላይ..." : "Scanning and verifying QR cryptography..."}</span>
                </div>
              ) : null}
            </div>
          ) : (
            /* Decoded Fayda ID Preview Card */
            <div className="bg-white border border-outline-variant/60 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1b6d24]/10 text-[#1b6d24] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">
                      {isAm ? "የፋይዳ መታወቂያ ተገኝቷል" : "Fayda ID Card Decoded"}
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      {selectedFileName ? `${selectedFileName} • ` : ""}
                      {isAm ? "ስሪት" : "Version"} {decodedSuccess.payload_version}
                    </p>
                  </div>
                </div>

                {isSignatureVerified !== null ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isSignatureVerified
                        ? "bg-[#1b6d24]/10 text-[#1b6d24] border border-[#1b6d24]/30"
                        : "bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isSignatureVerified ? "verified_user" : "warning"}
                    </span>
                    <span>
                      {isSignatureVerified
                        ? isAm
                          ? "የዲጂታል ፊርማ ተረጋግጧል (NIDP)"
                          : "NIDP Cryptographic Signature Verified"
                        : isAm
                          ? "ያልተረጋገጠ ፊርማ"
                          : "Unverified Signature"}
                    </span>
                  </span>
                ) : null}
              </div>

              {/* Identity Details Grid */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Face thumbnail if present */}
                {decodedSuccess.fields.face?.base64 ? (
                  <div className="shrink-0 flex flex-col items-center">
                    <img
                      src={`data:image/${decodedSuccess.fields.face.format};base64,${decodedSuccess.fields.face.base64}`}
                      alt="Fayda Face Thumbnail"
                      className="w-24 h-24 rounded-lg object-cover border border-outline-variant shadow-xs"
                    />
                    <span className="text-[10px] text-on-surface-variant mt-1">
                      {isAm ? "ከQR የወጣ ፎቶ" : "QR Face Photo"}
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 text-xs">
                  <div>
                    <span className="text-on-surface-variant block font-medium">
                      {isAm ? "ሙሉ ስም" : "Full Name"}
                    </span>
                    <span className="font-bold text-sm text-on-surface">
                      {decodedSuccess.fields.full_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block font-medium">
                      {isAm ? "የፋይዳ ቁጥር (FAN)" : "Fayda Account Number (FAN)"}
                    </span>
                    <span className="font-mono font-semibold text-on-surface">
                      {decodedSuccess.fields.fan
                        ? `${decodedSuccess.fields.fan.slice(0, 4)} **** **** ${decodedSuccess.fields.fan.slice(-4)}`
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block font-medium">
                      {isAm ? "የትውልድ ቀን" : "Date of Birth"}
                    </span>
                    <span className="font-semibold text-on-surface">
                      {decodedSuccess.fields.date_of_birth || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block font-medium">
                      {isAm ? "ጾታ" : "Gender"}
                    </span>
                    <span className="font-semibold text-on-surface">
                      {decodedSuccess.fields.gender === "M"
                        ? isAm
                          ? "ወንድ"
                          : "Male"
                        : decodedSuccess.fields.gender === "F"
                          ? isAm
                            ? "ሴት"
                            : "Female"
                          : decodedSuccess.fields.gender || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-outline-variant/30">
                <Button
                  onClick={handleConfirmQrVerification}
                  loading={verifyMutation.isPending}
                  icon="verified_user"
                  className="!bg-[#1b6d24] hover:!bg-[#1b6d24]/90 !text-white shadow-xs"
                >
                  {isAm ? "ይህንን መረጃ አረጋግጥና ቀጥል" : "Confirm & Complete Verification"}
                </Button>
                <Button
                  onClick={() => {
                    setDecodedSuccess(null);
                    setSelectedFileName(null);
                  }}
                  variant="outline"
                  type="button"
                >
                  {isAm ? "ሌላ ፎቶ ምረጥ" : "Choose Another Photo"}
                </Button>
              </div>
            </div>
          )}

          {decodeError ? (
            <Notice tone="error" title={isAm ? "የማረጋገጫ ስህተት" : "Card Decoding Issue"}>
              <p>{decodeError}</p>
            </Notice>
          ) : null}
        </div>
      ) : (
        /* Manual FIN Input Fallback */
        <form className="space-y-stack-sm" onSubmit={handleManualSubmit}>
          <Field
            action={
              <button
                className="font-label-caps text-[11px] font-semibold uppercase text-primary hover:underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFillDemo();
                }}
                type="button"
              >
                ⚡ {isAm ? "የሙከራ ቁጥር ሙላ" : "Auto-Fill Demo ID"}
              </button>
            }
            error={fin.length > 0 && !complete ? (isAm ? "የፋይዳ ቁጥር 12 ወይም 16 ዲጂት ነው" : "A Fayda ID is 12 to 16 digits") : undefined}
            hint={isAm ? "በፋይዳ ካርድዎ ላይ ያለውን 12-ዲጂት መለያ ቁጥር (FIN) ያስገቡ።" : "Find this 12-digit number on your Fayda card. We check it and never store the plaintext number."}
            label={isAm ? "የፋይዳ መለያ ቁጥር (FIN)" : "Fayda ID number (FIN)"}
          >
            <Input
              autoComplete="off"
              inputMode="numeric"
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 16);
                setFin(next.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
              }}
              placeholder="3000 0000 0001"
              value={fin}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-stack-sm pt-1">
            <Button
              className={
                complete
                  ? "!bg-status-passed hover:!bg-status-passed/90 !text-white shadow-md ring-2 ring-status-passed/40 transition-all duration-200"
                  : undefined
              }
              disabled={!complete}
              icon={complete ? "verified_user" : "fingerprint"}
              loading={verifyMutation.isPending}
              type="submit"
            >
              {isAm ? "በፋይዳ አረጋግጥ" : "Verify with Fayda"}
            </Button>
            <Button onClick={handleFillDemo} type="button" variant="outline">
              {isAm ? "የሙከራ ቁጥር" : "Use Demo FIN"}
            </Button>
          </div>
        </form>
      )}

      {verifyMutation.error ? (
        <Notice tone="error">
          {verifyMutation.error instanceof ApiRequestError
            ? verifyMutation.error.message
            : isAm
              ? "ማረጋገጥ አልተሳካም። እባክዎ እንደገና ይሞክሩ።"
              : "Verification could not complete. Please try again."}
        </Notice>
      ) : null}

      {verifyMutation.data && !verifyMutation.data.live && verifyMutation.data.method === "stub" ? (
        <Notice tone="warning" title={isAm ? "በሙከራ መረጃ ተረጋግጧል" : "Verified against the demo directory"}>
          {isAm
            ? "የቀጥታ የፋይዳ አገልግሎት ስላልተዋቀረ የሙከራ መታወቂያ ተቀባይነት አግኝቷል።"
            : "Live Fayda credentials are not configured in this environment, so a seeded demo ID was accepted."}
        </Notice>
      ) : null}
    </div>
  );
}
