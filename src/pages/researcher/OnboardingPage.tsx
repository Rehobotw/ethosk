import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ORG_TYPE_OPTIONS = [
  { value: "academic", label: "Academic institution", icon: "school" },
  { value: "market_research", label: "Market research firm", icon: "storefront" },
  { value: "ngo", label: "NGO / Nonprofit", icon: "volunteer_activism" },
  { value: "government", label: "Government", icon: "account_balance" },
  { value: "independent", label: "Independent researcher", icon: "person" },
  { value: "other", label: "Other", icon: "more_horiz" },
];
const SUGGESTED_CHIPS = [
  "Market Research",
  "Product Feedback",
  "Brand Tracking",
  "UX Testing",
  "Academic Survey",
  "Customer Satisfaction",
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<2 | 3>(2);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["researcher-profile"],
    queryFn: () => api<any>("/researchers/profile"),
  });

  // Step 2 states (Organization Details - matching Stitch Screen 15610326077724710836)
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");

  // Step 3 states (Research Profile - matching Stitch Screen 2c57384b465a4b209efa7fb42454a370)
  const [primaryResearch, setPrimaryResearch] = useState("");
  const [surveyVolume, setSurveyVolume] = useState<"exploring" | "few" | "regular">("exploring");

  // Step 4 (Confirmation)
  const [isCompleted, setIsCompleted] = useState(false);

  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside handler for custom dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (profile) {
      if (profile.onboarding_completed) {
        setIsCompleted(true);
      }
      if (profile.institution) setOrgName(profile.institution);
      if (profile.researcher_type) setOrgType(profile.researcher_type);
      if (profile.bio) setRoleTitle(profile.bio);
      if (profile.social_links?.website) setOrgWebsite(profile.social_links.website);
      if (profile.social_links?.primary_research) setPrimaryResearch(profile.social_links.primary_research);
      if (profile.social_links?.survey_volume) setSurveyVolume(profile.social_links.survey_volume);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (payload: any) => api("/researchers/profile", { body: payload }),
  });

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      institution: orgName,
      researcher_type: orgType,
      bio: roleTitle,
      social_links: {
        ...(profile?.social_links || {}),
        website: orgWebsite,
      },
    });
    setStep(3);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      onboarding_completed: true,
      social_links: {
        ...(profile?.social_links || {}),
        website: orgWebsite,
        primary_research: primaryResearch,
        survey_volume: surveyVolume,
      },
    });
    setIsCompleted(true);
    refetch();
  };

  const handleChipClick = (chip: string) => {
    if (!primaryResearch) {
      setPrimaryResearch(chip);
    } else if (!primaryResearch.includes(chip)) {
      setPrimaryResearch(`${primaryResearch}, ${chip}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#eff4ff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-[3px] border-slate-200 border-t-[#004162] animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your profile…</p>
        </div>
      </div>
    );
  }

  // ── Confirmation Screen (Stitch Screen 3496493918650713228) ──
  if (isCompleted) {
    return (
      <div className="bg-[#cbe6ff] min-h-screen flex flex-col font-['Inter',sans-serif] text-[#191c20] antialiased relative overflow-x-hidden">
        {/* Ambient Gradient Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-white/40 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#d3e5f1]/50 blur-[150px]" />
        </div>

        {/* Minimal Header */}
        <header className="w-full px-6 md:px-10 py-6 flex justify-center items-center absolute top-0 left-0 z-10">
          <div className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-extrabold text-[#004162] tracking-tight">
            Ethosk
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-grow flex items-center justify-center px-4 md:px-10 py-24 relative z-10">
          <div className="bg-white/90 backdrop-blur-xl border border-[#c0c7d0]/30 rounded-xl shadow-[0_8px_30px_rgb(0,89,133,0.08)] p-8 md:p-12 max-w-lg w-full flex flex-col items-center text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-[#2872a1]/20 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full border-2 border-[#2872a1] opacity-50 animate-[ping_3s_ease-in-out_infinite]" />
              <span className="material-symbols-outlined text-4xl text-[#004162]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>

            {/* Typography */}
            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl md:text-3xl font-bold text-[#191c20] mb-4 tracking-tight">
              You&rsquo;re ready to go.
            </h1>
            <p className="text-sm md:text-base text-[#41484e] mb-10 max-w-md leading-relaxed">
              Your researcher account is set up. Fund your wallet to launch your first survey and start gathering enterprise-grade insights.
            </p>

            {/* Actions */}
            <div className="flex flex-col w-full gap-4">
              <Link to="/researcher">
                <button
                  type="button"
                  className="w-full py-3.5 px-6 rounded-full bg-[#004162] text-white font-semibold text-sm hover:bg-[#00314a] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </Link>
              <Link to="/researcher/wallet">
                <button
                  type="button"
                  className="w-full py-3.5 px-6 rounded-full bg-transparent border-2 border-[#c0c7d0] text-[#004162] font-semibold text-sm hover:border-[#004162] hover:bg-[#004162]/5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span>Add funds to wallet</span>
                </button>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-[#c0c7d0]/20 w-full">
              <p className="text-xs text-[#41484e]/70 text-center">
                Need help getting started?{" "}
                <Link to="/researcher" className="text-[#004162] font-semibold hover:underline">
                  Read the documentation
                </Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#f8f9ff] border-t border-[#c0c7d0]/40 w-full py-8 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 z-10 relative">
          <div className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-extrabold text-[#004162]">
            Ethosk
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#41484e]">
            <Link className="hover:text-[#004162] transition-colors" to="/terms">Terms of Service</Link>
            <Link className="hover:text-[#004162] transition-colors" to="/privacy">Privacy Policy</Link>
            <span className="text-[#41484e]">Security Compliance</span>
            <span className="text-[#41484e]">Contact Support</span>
          </div>
          <div className="text-xs text-[#41484e]">
            &copy; {new Date().getFullYear()} Ethosk. All rights reserved. Enterprise Research Infrastructure.
          </div>
        </footer>
      </div>
    );
  }

  // ── Step 2 & Step 3 Flow (Stitch Screens 15610326077724710836 & 2c57384b465a4b209efa7fb42454a370) ──
  return (
    <div className="bg-[#eff4ff] min-h-screen flex flex-col font-['Inter',sans-serif] text-[#191c20] antialiased">
      {/* Top Header Bar with Step Progress */}
      <header className="w-full px-6 md:px-10 py-6 flex justify-between items-center z-50">
        <Link className="flex items-center gap-2" to="/">
          <span className="material-symbols-outlined text-[#004162]" style={{ fontVariationSettings: "'FILL' 1" }}>
            analytics
          </span>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-extrabold text-[#004162] tracking-tight">
            Ethosk
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-[#41484e] text-xs font-semibold">Step {step} of 3</div>
          <div className="flex gap-1.5">
            <div className="w-8 h-1 rounded-full bg-[#004162]/20" />
            <div className={`w-8 h-1 rounded-full ${step === 2 ? "bg-[#004162]" : "bg-[#004162]/20"}`} />
            <div className={`w-8 h-1 rounded-full ${step === 3 ? "bg-[#004162]" : "bg-[#004162]/20"}`} />
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center py-8 px-4 md:px-10 relative">
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
          <div className="w-[800px] h-[800px] bg-[#004162]/5 rounded-full blur-[100px]" />
        </div>

        {/* ── Step 2: Organization Details (Stitch Screen 15610326077724710836) ── */}
        {step === 2 && (
          <div className="w-full max-w-[520px] bg-white rounded-xl border border-[#c0c7d0]/50 shadow-[0_8px_30px_rgb(0,89,133,0.08)] p-8 md:p-10 relative z-10">
            <div className="mb-8">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-[#191c20] mb-2 tracking-tight">
                Tell us about your organization
              </h1>
              <p className="text-sm text-[#41484e] leading-relaxed">
                This helps us tailor your dashboard and keep the respondent panel safe for everyone.
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="flex flex-col gap-6">
              {/* Organization Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#41484e]" htmlFor="orgName">
                  Organization name
                </label>
                <input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Research Corp"
                  required
                  className="w-full bg-[#eff4ff] border border-transparent rounded-lg px-4 py-3 text-sm text-[#191c20] focus:outline-none focus:border-[#004162] focus:ring-1 focus:ring-[#004162] transition-all placeholder:text-[#71787f]"
                  type="text"
                />
              </div>

              {/* Organization Type — Custom Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#41484e]">
                  Organization type
                </label>
                <div className="relative" ref={dropdownRef}>
                  {/* Hidden native input for form validation */}
                  <input
                    type="text"
                    value={orgType}
                    required
                    onChange={() => {}}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  {/* Custom trigger button */}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full flex items-center justify-between bg-[#eff4ff] rounded-lg px-4 py-3 text-sm text-left transition-all cursor-pointer ${
                      dropdownOpen
                        ? "ring-2 ring-[#004162] border border-[#004162]"
                        : "border border-transparent hover:border-[#c0c7d0]/60"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {orgType ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] text-[#004162]">
                            {ORG_TYPE_OPTIONS.find((o) => o.value === orgType)?.icon || "business"}
                          </span>
                          <span className="text-[#191c20] font-medium">
                            {ORG_TYPE_OPTIONS.find((o) => o.value === orgType)?.label}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#71787f]">Select an organization type</span>
                      )}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[20px] text-[#71787f] transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#c0c7d0]/40 shadow-[0_12px_40px_rgba(0,65,98,0.12)] z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      {ORG_TYPE_OPTIONS.map((option) => {
                        const isSelected = orgType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setOrgType(option.value);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#004162]/8 text-[#004162] font-medium"
                                : "text-[#191c20] hover:bg-[#eff4ff]"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                isSelected ? "text-[#004162]" : "text-[#71787f]"
                              }`}
                            >
                              {option.icon}
                            </span>
                            <span className="flex-1">{option.label}</span>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[18px] text-[#004162]">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Role / Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#41484e]" htmlFor="roleTitle">
                  Role/title
                </label>
                <input
                  id="roleTitle"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Lead Researcher"
                  required
                  className="w-full bg-[#eff4ff] border border-transparent rounded-lg px-4 py-3 text-sm text-[#191c20] focus:outline-none focus:border-[#004162] focus:ring-1 focus:ring-[#004162] transition-all placeholder:text-[#71787f]"
                  type="text"
                />
              </div>

              {/* Organization Website */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-semibold text-[#41484e]" htmlFor="orgWebsite">
                    Organization website
                  </label>
                  <span className="text-xs text-[#71787f]">Optional</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#71787f] pointer-events-none material-symbols-outlined text-[18px]">
                    language
                  </span>
                  <input
                    id="orgWebsite"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://"
                    className="w-full bg-[#eff4ff] border border-transparent rounded-lg pl-11 pr-4 py-3 text-sm text-[#191c20] focus:outline-none focus:border-[#004162] focus:ring-1 focus:ring-[#004162] transition-all placeholder:text-[#71787f]"
                    type="url"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-col items-center gap-4">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full bg-[#004162] text-white font-semibold text-sm py-3.5 rounded-full active:scale-95 transition-all duration-200 hover:bg-[#00314a] flex justify-center items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {updateProfile.isPending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/researcher")}
                  className="text-[#004162] text-xs font-semibold hover:underline transition-colors bg-transparent border-none cursor-pointer"
                >
                  Save and continue later
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: Research Profile (Stitch Screen 2c57384b465a4b209efa7fb42454a370) ── */}
        {step === 3 && (
          <div className="w-full max-w-[520px] bg-white rounded-xl border border-[#c0c7d0]/30 shadow-[0_8px_30px_rgb(0,89,133,0.08)] p-8 md:p-10 relative overflow-hidden backdrop-blur-md z-10">
            {/* Silk glass ambient glow inside card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#cbe6ff]/30 rounded-full blur-[80px] pointer-events-none -z-10 transform translate-x-1/2 -translate-y-1/2" />

            <div className="text-center mb-8">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-[#191c20] mb-2 tracking-tight">
                Set up your research profile
              </h2>
              <p className="text-sm text-[#41484e] leading-relaxed">
                Configure your research preferences to get started.
              </p>
            </div>

            <form onSubmit={handleStep3Submit} className="flex flex-col gap-6">
              {/* Field 1: Primary Research */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#41484e]">
                  What will you primarily research?
                </label>
                <div className="relative">
                  <input
                    value={primaryResearch}
                    onChange={(e) => setPrimaryResearch(e.target.value)}
                    placeholder="e.g., Consumer behavior, B2B SaaS..."
                    required
                    className="w-full bg-[#eff4ff] border border-[#c0c7d0]/40 rounded-lg px-4 py-3 text-sm text-[#191c20] placeholder:text-[#71787f] focus:outline-none focus:ring-2 focus:ring-[#004162] focus:border-[#004162] transition-shadow"
                    type="text"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-[#71787f] pointer-events-none text-[20px]">
                    search
                  </span>
                </div>
                {/* Suggested Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {SUGGESTED_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="px-3 py-1.5 rounded-full border border-[#c0c7d0]/50 text-xs font-medium text-[#41484e] hover:bg-[#d5e3fc] hover:text-[#004162] transition-colors hover:border-[#004162]/30 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Segmented Control (Estimated Survey Volume) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#41484e]">
                  Estimated survey volume
                </label>
                <div className="bg-[#eceef3] rounded-lg p-1 flex flex-col sm:flex-row gap-1 border border-[#c0c7d0]/20 shadow-inner">
                  {/* Option 1 */}
                  <label className="flex-1 text-center cursor-pointer relative">
                    <input
                      className="sr-only peer"
                      name="volume"
                      type="radio"
                      value="exploring"
                      checked={surveyVolume === "exploring"}
                      onChange={() => setSurveyVolume("exploring")}
                    />
                    <div className="px-3 py-2.5 rounded-md text-xs font-medium text-[#41484e] peer-checked:bg-white peer-checked:text-[#004162] peer-checked:font-semibold peer-checked:shadow-xs transition-all">
                      Just exploring
                    </div>
                  </label>
                  {/* Option 2 */}
                  <label className="flex-1 text-center cursor-pointer relative">
                    <input
                      className="sr-only peer"
                      name="volume"
                      type="radio"
                      value="few"
                      checked={surveyVolume === "few"}
                      onChange={() => setSurveyVolume("few")}
                    />
                    <div className="px-3 py-2.5 rounded-md text-xs font-medium text-[#41484e] peer-checked:bg-white peer-checked:text-[#004162] peer-checked:font-semibold peer-checked:shadow-xs transition-all">
                      A few surveys/mo
                    </div>
                  </label>
                  {/* Option 3 */}
                  <label className="flex-1 text-center cursor-pointer relative">
                    <input
                      className="sr-only peer"
                      name="volume"
                      type="radio"
                      value="regular"
                      checked={surveyVolume === "regular"}
                      onChange={() => setSurveyVolume("regular")}
                    />
                    <div className="px-3 py-2.5 rounded-md text-xs font-medium text-[#41484e] peer-checked:bg-white peer-checked:text-[#004162] peer-checked:font-semibold peer-checked:shadow-xs transition-all">
                      Regular ongoing
                    </div>
                  </label>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-t border-[#c0c7d0]/40 my-1" />

              {/* Actions */}
              <div className="flex flex-col gap-3 items-center">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full bg-[#004162] text-white font-semibold text-sm rounded-full py-3.5 px-6 shadow-md hover:bg-[#00314a] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updateProfile.isPending ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  <span>Finish setup</span>
                </button>
                <p className="text-xs text-[#71787f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>You can update this anytime from your dashboard.</span>
                </p>
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-[#41484e] hover:text-[#004162] transition-colors cursor-pointer"
                  >
                    Back to Step 2
                  </button>
                  <span className="text-[#c0c7d0]">•</span>
                  <button
                    type="button"
                    onClick={() => navigate("/researcher")}
                    className="text-xs text-[#41484e] hover:text-[#004162] underline-offset-4 hover:underline transition-colors cursor-pointer"
                  >
                    Save and continue later
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Simple Footer matching Stitch */}
      <footer className="bg-[#f8f9ff] text-[#004162] text-xs border-t border-[#c0c7d0]/40 w-full py-8 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-extrabold text-[#004162] tracking-tight">
          Ethosk
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-[#41484e]">
          <Link className="hover:text-[#004162] transition-colors" to="/terms">Terms of Service</Link>
          <Link className="hover:text-[#004162] transition-colors" to="/privacy">Privacy Policy</Link>
          <span>Security Compliance</span>
          <span>Contact Support</span>
        </div>
        <div className="text-[#41484e]">
          &copy; {new Date().getFullYear()} Ethosk. All rights reserved. Enterprise Research Infrastructure.
        </div>
      </footer>
    </div>
  );
}
