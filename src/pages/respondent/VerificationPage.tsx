import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TIER_RANK } from "@shared/types";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Notice } from "@/components/ui";
import { validateDocumentFile } from "@shared/validation/schemas";
import { useLanguage } from "@/lib/language";

export function VerificationPage() {
  const { user, refresh } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [faydaNumber, setFaydaNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    phone: "",
    dob: "",
    gender: "",
    region: "addis_ababa",
    city: "",
    education: "bachelors",
    employment: "employed",
  });

  const currentRank = user ? TIER_RANK[user.verification_tier] : 0;
  const isTier1Verified = currentRank >= TIER_RANK["1_id_verified"];

  const handleFileChange = (file: File) => {
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Invalid document file");
      return;
    }
    setErrorMsg("");
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleVerifyFayda = async () => {
    if (!faydaNumber || faydaNumber.length < 6) {
      setErrorMsg(isAm ? "እባክዎ ትክክለኛ የፋይዳ መታወቂያ ቁጥር ያስገቡ።" : "Please enter a valid Fayda National ID number.");
      return;
    }
    setIsVerifying(true);
    setErrorMsg("");
    try {
      await api("/respondents/verify/fayda", {
        body: { fayda_id: faydaNumber },
      });
      setVerifySuccess(true);
      if (refresh) await refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || (isAm ? "የፋይዳ ማረጋገጫ አልተሳካም። እባክዎ እንደገና ይሞክሩ።" : "Fayda verification failed. Please check your credentials and retry."));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // Save demographic profile
      await api("/respondents/profile", {
        body: {
          full_name: formData.fullName,
          phone: formData.phone,
          dob: formData.dob,
          gender: formData.gender,
          region: formData.region,
          city: formData.city,
          education_level: formData.education,
          employment_status: formData.employment,
        },
      });

      // If document was uploaded, submit it
      if (selectedFile) {
        await api("/respondents/verify-document", {
          body: {
            document_type: "kebele_id",
            file_name: selectedFile.name,
            file_size: selectedFile.size,
            mime_type: selectedFile.type,
          },
        });
      }

      if (refresh) await refresh();
      navigate("/documents");
    } catch (err: any) {
      setErrorMsg(err?.message || (isAm ? "መረጃውን ማስገባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።" : "Failed to save verification profile. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-body-md text-on-surface pb-16 max-w-4xl mx-auto">
      {/* ── Page Header (Stitch Screen 5501739850a0499db043b3e4d2267711) ── */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4 shadow-[0_12px_24px_rgba(0,75,99,0.08)]">
          <span className="material-symbols-outlined text-3xl">verified_user</span>
        </div>
        <h1 className="font-headline font-bold text-2xl md:text-3xl lg:text-4xl text-primary mb-3">
          {isAm ? "ደረጃ 1 ማረጋገጫ፡ የማንነት ዋስትና" : "Tier 1 Verification: Identity Guaranteed"}
        </h1>
        <p className="font-body text-sm md:text-base text-on-surface-variant max-w-2xl mx-auto">
          {isAm
            ? "የማንነት መረጃዎን በማጠናቀቅ ከፍተኛ ሽልማት ያላቸው ጥናቶችን ያግኙ። መረጃዎ የተመሰጠረ ሲሆን ለተመራማሪዎች አይጋራም።"
            : "Unlock premium surveys, high-value rewards, and instant payouts by completing your identity profile. Your data is encrypted and used only for researcher matching."}
        </p>
      </div>

      {errorMsg ? <Notice tone="error">{errorMsg}</Notice> : null}
      {verifySuccess || isTier1Verified ? (
        <Notice tone="info" title={isAm ? "የፋይዳ መታወቂያ ተረጋግጧል" : "Fayda ID Verified"}>
          {isAm
            ? "ብሔራዊ ማንነትዎ በeSignet በኩል ተረጋግጧል። አሁን የደረጃ 1 መዳረሻ አለዎት።"
            : "Your national identity has been successfully validated via eSignet. You now have Tier 1 access."}
        </Notice>
      ) : null}

      {/* ── Form Container ── */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-[0_12px_24px_rgba(0,75,99,0.05)] p-6 md:p-8 relative overflow-hidden">
        {/* Decorative subtle corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/30 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

        <form onSubmit={handleSubmitForm} className="space-y-8 relative z-10">
          {/* Form Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Legal Name */}
            <div className="col-span-1 md:col-span-2">
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="fullName">
                {isAm ? "ሙሉ ህጋዊ ስም (በመታወቂያው ላይ እንዳለው)" : "Full Legal Name (as per official records)"}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder={isAm ? "ምሳሌ፡ አበበ በቀለ" : "e.g., Abebe Bekele"}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="phone">
                {isAm ? "ስልክ ቁጥር" : "Phone Number"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant pointer-events-none">
                  <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+251 9..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="dob">
                {isAm ? "የትውልድ ቀን" : "Date of Birth"}
              </label>
              <div className="relative">
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="col-span-1 md:col-span-2">
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="gender">
                {isAm ? "ጾታ" : "Gender"}
              </label>
              <div className="relative">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow appearance-none pr-9 cursor-pointer"
                >
                  <option disabled value="">{isAm ? "ጾታ ይምረጡ" : "Select Gender"}</option>
                  <option value="male">{isAm ? "ወንድ" : "Male"}</option>
                  <option value="female">{isAm ? "ሴት" : "Female"}</option>
                  <option value="other">{isAm ? "መግለጽ አልፈልግም" : "Prefer not to say"}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="region">
                {isAm ? "ክልል" : "Region"}
              </label>
              <div className="relative">
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow appearance-none pr-9 cursor-pointer"
                >
                  <option value="addis_ababa">{isAm ? "አዲስ አበባ" : "Addis Ababa"}</option>
                  <option value="amhara">{isAm ? "አማራ" : "Amhara"}</option>
                  <option value="oromia">{isAm ? "ኦሮሚያ" : "Oromia"}</option>
                  <option value="tigray">{isAm ? "ትግራይ" : "Tigray"}</option>
                  <option value="sidama">{isAm ? "ሲዳማ" : "Sidama"}</option>
                  <option value="snnpr">{isAm ? "ደቡብ" : "SNNPR"}</option>
                  <option value="somali">{isAm ? "ሶማሌ" : "Somali"}</option>
                  <option value="dire_dawa">{isAm ? "ድሬዳዋ" : "Dire Dawa"}</option>
                  <option value="other">{isAm ? "ሌላ" : "Other"}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="city">
                {isAm ? "ከተማ" : "City"}
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder={isAm ? "ምሳሌ፡ ሀዋሳ" : "e.g., Hawassa"}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow"
              />
            </div>

            {/* Highest Education Level */}
            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="education">
                {isAm ? "የትምህርት ደረጃ" : "Highest Education Level"}
              </label>
              <div className="relative">
                <select
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow appearance-none pr-9 cursor-pointer"
                >
                  <option value="secondary">{isAm ? "ሁለተኛ ደረጃ" : "Secondary School"}</option>
                  <option value="bachelors">{isAm ? "የመጀመሪያ ዲግሪ" : "Bachelor's Degree"}</option>
                  <option value="masters">{isAm ? "ሁለተኛ ዲግሪ" : "Master's Degree"}</option>
                  <option value="phd">{isAm ? "ዶክትሬት / PhD" : "Doctorate / PhD"}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Current Employment Status */}
            <div>
              <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="employment">
                {isAm ? "የስራ ሁኔታ" : "Employment Status"}
              </label>
              <div className="relative">
                <select
                  id="employment"
                  name="employment"
                  value={formData.employment}
                  onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                  className="w-full bg-surface-bright border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow appearance-none pr-9 cursor-pointer"
                >
                  <option value="employed">{isAm ? "ሙሉ ጊዜ ተቀጣሪ" : "Employed Full-Time"}</option>
                  <option value="part_time">{isAm ? "የትርፍ ጊዜ ተቀጣሪ" : "Employed Part-Time"}</option>
                  <option value="self_employed">{isAm ? "የግል ስራ" : "Self-Employed / Freelance"}</option>
                  <option value="student">{isAm ? "ተማሪ" : "Student"}</option>
                  <option value="unemployed">{isAm ? "ስራ ፈላጊ" : "Unemployed"}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* ── Fayda National ID Integration Box ── */}
          <div className="mt-8 bg-[#f2f6fa]/60 border border-primary-container/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-primary-container text-white p-2 rounded-lg">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <h3 className="font-headline font-semibold text-lg text-primary">
                {isAm ? "ብሔራዊ መታወቂያ ማረጋገጫ (ፋይዳ)" : "National ID Verification (Fayda)"}
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider" htmlFor="fayda_id">
                  {isAm ? "12-ዲጂት የፋይዳ መለያ ቁጥር (FIN)" : "12-Digit Fayda Identification Number (FIN)"}
                </label>
                <input
                  id="fayda_id"
                  name="fayda_id"
                  type="text"
                  placeholder={isAm ? "የ12-ዲጂት መለያ ቁጥር ያስገቡ" : "Enter 12-digit ID"}
                  value={isTier1Verified ? "FAN-VERIFIED-eSIGNET" : faydaNumber}
                  disabled={isTier1Verified}
                  onChange={(e) => setFaydaNumber(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container focus:border-primary-container focus:outline-none transition-shadow font-mono tracking-widest"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyFayda}
                disabled={isVerifying || isTier1Verified}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white hover:bg-surface-tint font-body font-semibold text-sm rounded-full px-6 py-3 transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                <span>
                  {isVerifying
                    ? (isAm ? "በeSignet በመረጋገጥ ላይ..." : "Verifying with eSignet...")
                    : isTier1Verified
                    ? (isAm ? "ማንነት ተረጋግጧል" : "Identity Guaranteed")
                    : (isAm ? "በፋይዳ eSignet አረጋግጥ" : "Authorize with Fayda eSignet")}
                </span>
              </button>

              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-outline-variant/40" />
                <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                  {isAm ? "ወይም" : "or"}
                </span>
                <div className="flex-1 h-px bg-outline-variant/40" />
              </div>

              {/* Document Upload Fallback */}
              <div>
                <label className="block font-body text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                  {isAm ? "የመታወቂያ ፎቶ ይጫኑ" : "Upload physical ID photo"}
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer group ${
                    dragActive
                      ? "border-primary bg-surface-container-low"
                      : selectedFile
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-outline-variant/60 hover:bg-surface-container-low hover:border-primary"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <span className={`material-symbols-outlined text-4xl mb-2 transition-colors ${selectedFile ? "text-emerald-600" : "text-outline-variant group-hover:text-primary"}`}>
                    {selectedFile ? "task_alt" : "cloud_upload"}
                  </span>
                  <p className="font-body text-xs sm:text-sm font-semibold text-on-surface mb-1">
                    {selectedFile ? selectedFile.name : (isAm ? "ለመጫን ይጫኑ ወይም ፋይሉን ይጎትቱ" : "Drag and drop or click to browse")}
                  </p>
                  <p className="font-body text-[11px] text-on-surface-variant">
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "JPG, PNG, or PDF under 10MB"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="pt-6 border-t border-outline-variant/40 flex flex-col-reverse md:flex-row items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/inbox")}
              className="w-full md:w-auto px-6 py-3 font-body font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              {isAm ? "ለጊዜው ይለፉ" : "Skip for now"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary text-white hover:bg-surface-tint font-body font-bold text-sm rounded-full px-8 py-3.5 transition-colors duration-200 shadow-[0_4px_12px_rgba(0,75,99,0.15)] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>{isAm ? "ለግምገማ አስገባ" : "Submit for Verification Review"}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center font-body text-xs text-on-surface-variant/70 pt-2">
        <span className="material-symbols-outlined text-[16px] align-middle mr-1">lock</span>
        {isAm ? "በኤቶስክ የተቋም እምነት ፕሮቶኮል የተጠበቀ" : "Secured by Ethosk Institutional Trust Protocol"}
      </p>
    </div>
  );
}
