import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TIER_RANK } from "@shared/types";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Notice } from "@/components/ui";

export function VerificationPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [faydaNumber, setFaydaNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    phone: "",
    dob: "",
    gender: "",
    region: "Addis Ababa",
    education: "bachelors",
    employment: "employed",
  });

  const currentRank = user ? TIER_RANK[user.verification_tier] : 0;
  const isTier1Verified = currentRank >= TIER_RANK["1_id_verified"];

  const handleVerifyFayda = async () => {
    if (!faydaNumber || faydaNumber.length < 6) {
      setErrorMsg("Please enter a valid Fayda National ID number.");
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
      setErrorMsg(err?.message || "Fayda verification failed. Please check your credentials and retry.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!isTier1Verified && !verifySuccess) {
      setErrorMsg("Please complete Fayda ID verification to proceed.");
      return;
    }
    navigate("/documents");
  };

  return (
    <div className="space-y-10 font-body-md text-on-surface pb-16">
      {/* ── Page Header (Stitch Screen 3829637714337328559) ── */}
      <header>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline-lg font-bold text-primary mb-2 tracking-tight">
          Identity Verification &amp; Profile
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant">
          Complete your profile to unlock Tier 1 verified status and access premium surveys.
        </p>
      </header>

      {/* ── 6-Step Horizontal Stepper ── */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] flex items-center justify-between relative px-6">
          {/* Connecting Lines */}
          <div className="absolute top-6 left-12 right-12 h-[2px] bg-outline-variant/40 -translate-y-1/2 z-0" />
          <div
            className="absolute top-6 left-12 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: isTier1Verified ? "40%" : "20%" }}
          />

          {/* Step 1: Completed */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-4 border-[#f8f9ff]">
              <span className="material-symbols-outlined font-bold text-xl">check</span>
            </div>
            <span className="text-xs font-label-md text-primary font-bold text-center">
              Basic Profile
            </span>
          </div>

          {/* Step 2: Active (Fayda ID) */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md border-4 border-[#f8f9ff] ring-2 ring-primary ring-offset-2 ${
              isTier1Verified ? "bg-primary text-white" : "bg-secondary-container text-primary"
            }`}>
              <span className="material-symbols-outlined font-bold text-xl">
                {isTier1Verified ? "check" : "badge"}
              </span>
            </div>
            <span className="text-xs font-label-md text-primary font-bold text-center">
              National ID<br />(Fayda)
            </span>
          </div>

          {/* Step 3: Upcoming */}
          <div className={`relative z-10 flex flex-col items-center gap-2 ${isTier1Verified ? "opacity-100" : "opacity-60"}`}>
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border-4 border-[#f8f9ff]">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
            <span className="text-xs font-label-md text-on-surface-variant text-center font-medium">
              Tier 1<br />Verified
            </span>
          </div>

          {/* Step 4: Upcoming */}
          <div className="relative z-10 flex flex-col items-center gap-2 opacity-60">
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border-4 border-[#f8f9ff]">
              <span className="material-symbols-outlined text-xl">corporate_fare</span>
            </div>
            <span className="text-xs font-label-md text-on-surface-variant text-center font-medium">
              Institutional<br />Info
            </span>
          </div>

          {/* Step 5: Upcoming */}
          <div className="relative z-10 flex flex-col items-center gap-2 opacity-60">
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border-4 border-[#f8f9ff]">
              <span className="material-symbols-outlined text-xl">upload_file</span>
            </div>
            <span className="text-xs font-label-md text-on-surface-variant text-center font-medium">
              Document<br />Upload
            </span>
          </div>

          {/* Step 6: Upcoming */}
          <div className="relative z-10 flex flex-col items-center gap-2 opacity-60">
            <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border-4 border-[#f8f9ff]">
              <span className="material-symbols-outlined text-xl">gpp_good</span>
            </div>
            <span className="text-xs font-label-md text-on-surface-variant text-center font-medium">
              Tier 2<br />Verified
            </span>
          </div>
        </div>
      </div>

      {errorMsg ? <Notice tone="error">{errorMsg}</Notice> : null}
      {verifySuccess || isTier1Verified ? (
        <Notice tone="info" title="Fayda ID Verified">
          Your national identity has been successfully validated via eSignet. You now have Tier 1 access.
        </Notice>
      ) : null}

      {/* ── Form Area (Tier 1 Fayda ID) ── */}
      <section className="bg-white rounded-xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)] border border-outline-variant/40 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">verified_user</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-title-lg text-primary font-bold">
              Basic Demographics &amp; National ID
            </h2>
            <p className="text-sm text-on-surface-variant">
              Complete your profile and verify your identity using Fayda National ID.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basic Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Full Legal Name
              </label>
              <input
                className="w-full bg-[#f2f3f9] border border-transparent rounded-lg px-4 py-3 text-sm text-on-surface focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                type="text"
                value={formData.fullName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Phone Number
              </label>
              <input
                className="w-full bg-[#f2f3f9] border border-transparent rounded-lg px-4 py-3 text-sm text-on-surface focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 9..."
                type="tel"
                value={formData.phone}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Date of Birth
              </label>
              <input
                className="w-full bg-[#f2f3f9] border border-transparent rounded-lg px-4 py-3 text-sm text-on-surface focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                type="date"
                value={formData.dob}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Gender
              </label>
              <select
                className="w-full bg-[#f2f3f9] border border-transparent rounded-lg px-4 py-3 text-sm text-on-surface focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                value={formData.gender}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Region / City
              </label>
              <input
                className="w-full bg-[#f2f3f9] border border-transparent rounded-lg px-4 py-3 text-sm text-on-surface focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g. Addis Ababa"
                type="text"
                value={formData.region}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Education Level
              </label>
              <select
                className="w-full bg-[#f2f3f9] border border-transparent rounded-lg px-4 py-3 text-sm text-on-surface focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                value={formData.education}
              >
                <option value="high-school">High School</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                Employment Status
              </label>
              <select
                className="w-full bg-[#f2f3f9] border border-transparent rounded-lg px-4 py-3 text-sm text-on-surface focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                value={formData.employment}
              >
                <option value="employed">Employed (Full-Time / Part-Time)</option>
                <option value="self-employed">Self-employed / Freelancer</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed / Seeking</option>
              </select>
            </div>
          </div>

          {/* Fayda National ID Integration */}
          <div className="p-6 bg-[#f2f3f9] rounded-xl border border-outline-variant/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">badge</span>
              <h3 className="text-lg font-title-md text-primary font-bold">
                Fayda National ID Verification
              </h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Fayda ID Number
                </label>
                <input
                  className="w-full bg-white border border-outline-variant/40 rounded-lg px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-mono"
                  disabled={isTier1Verified}
                  onChange={(e) => setFaydaNumber(e.target.value)}
                  placeholder="Enter your 12-digit Fayda ID (e.g., FAN-1234567890)"
                  type="text"
                  value={isTier1Verified ? "FAN-VERIFIED-eSIGNET" : faydaNumber}
                />
              </div>

              <button
                className="bg-primary hover:bg-[#003450] text-white px-8 py-3 rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-60"
                disabled={isVerifying || isTier1Verified}
                onClick={handleVerifyFayda}
                type="button"
              >
                {isVerifying ? "Verifying with eSignet…" : isTier1Verified ? "Identity Guaranteed" : "Verify with eSignet"}
              </button>
            </div>
            <p className="mt-3 text-xs text-on-surface-variant">
              Automated deterministic verification via the Ethiopian National ID system (eSignet).
            </p>
          </div>

          {/* Action Area */}
          <div className="pt-6 border-t border-outline-variant/30 flex justify-end">
            <button
              className="bg-gradient-to-r from-primary to-primary-container hover:from-[#003450] hover:to-[#005985] text-white rounded-full px-8 py-3.5 font-semibold text-sm flex items-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              onClick={handleSaveAndContinue}
              type="button"
            >
              <span>Save &amp; Continue</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
