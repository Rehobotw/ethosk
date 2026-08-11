import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Field, Input, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FaydaVerifyForm } from "../respondent/FaydaVerifyForm";

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["researcher-profile"],
    queryFn: () => api<any>("/researchers/profile"),
  });

  // Step 1 states
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  
  // Step 2 states
  const [phoneOtp, setPhoneOtp] = useState("");
  const [devPhoneOtp, setDevPhoneOtp] = useState("");

  // Step 3 states
  const [researcherType, setResearcherType] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [institution, setInstitution] = useState("");
  const [instEmail, setInstEmail] = useState("");

  // Step 4 states
  const [emailOtp, setEmailOtp] = useState("");
  const [devEmailOtp, setDevEmailOtp] = useState("");

  useEffect(() => {
    if (profile) {
      if (profile.onboarding_completed) {
        navigate("/researcher", { replace: true });
      }
      if (profile.dob) setDob(profile.dob);
      if (profile.phone) setPhone(profile.phone);
      if (profile.researcher_type) setResearcherType(profile.researcher_type);
      if (profile.years_experience) setYearsExperience(profile.years_experience.toString());
      if (profile.institution) setInstitution(profile.institution);
      if (profile.institutional_email) setInstEmail(profile.institutional_email);
    }
  }, [profile, navigate]);

  const updateProfile = useMutation({
    mutationFn: (payload: any) => api("/researchers/profile", { body: payload }),
  });

  const requestPhoneOtp = useMutation({
    mutationFn: () => api<any>("/researchers/verify-phone/request", { body: { phone } }),
    onSuccess: (data) => {
      setDevPhoneOtp(data._dev_otp);
      setStep(2);
    }
  });

  const confirmPhoneOtp = useMutation({
    mutationFn: () => api("/researchers/verify-phone/confirm", { body: { code: phoneOtp } }),
    onSuccess: () => {
      refetch();
      setStep(3);
    }
  });

  const requestEmailOtp = useMutation({
    mutationFn: () => api<any>("/researchers/verify-institutional-email/request", { body: { email: instEmail } }),
    onSuccess: (data) => {
      setDevEmailOtp(data._dev_otp);
      setStep(4);
    }
  });

  const confirmEmailOtp = useMutation({
    mutationFn: () => api("/researchers/verify-institutional-email/confirm", { body: { code: emailOtp } }),
    onSuccess: () => {
      refetch();
      setStep(5);
    }
  });

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({ dob, phone });
    requestPhoneOtp.mutate();
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      researcher_type: researcherType,
      years_experience: parseInt(yearsExperience),
      institution,
      institutional_email: instEmail
    });
    requestEmailOtp.mutate();
  };

  const finishOnboarding = async () => {
    await updateProfile.mutateAsync({ onboarding_completed: true });
    refetch();
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-surface-bright py-12 px-4 flex justify-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-headline-lg font-bold text-primary mb-2">Researcher Onboarding</h1>
        <p className="font-body-md text-on-surface-variant mb-8">
          Welcome to Ethosk! Please complete this one-time verification to access the platform.
        </p>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-primary' : 'bg-outline-variant'}`} />
          ))}
        </div>

        <Card className="p-8">
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Step 1: Personal Details</h2>
              <Field label="Full Name">
                <Input value={user?.full_name} disabled />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} required />
              </Field>
              <Field label="Phone Number (for OTP)">
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2519..." required />
              </Field>
              <Button type="submit" loading={updateProfile.isPending || requestPhoneOtp.isPending}>
                Continue
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); confirmPhoneOtp.mutate(); }} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Step 2: Phone Verification</h2>
              <Notice tone="info">
                In a real environment, an SMS would be sent to {phone}. For this demo, your OTP is: <strong>{devPhoneOtp}</strong>
              </Notice>
              <Field label="Enter OTP">
                <Input value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} required />
              </Field>
              {confirmPhoneOtp.error && <Notice tone="error">Invalid code</Notice>}
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" loading={confirmPhoneOtp.isPending}>Verify Phone</Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Step 3: Professional Context</h2>
              <Field label="Researcher Type">
                <select 
                  className="w-full rounded-md border-outline-variant bg-surface text-on-surface p-2"
                  value={researcherType} 
                  onChange={e => setResearcherType(e.target.value)}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="academic">Academic</option>
                  <option value="corporate">Corporate</option>
                  <option value="ngo">NGO / Non-profit</option>
                  <option value="independent">Independent</option>
                </select>
              </Field>
              <Field label="Years of Experience">
                <Input type="number" min="0" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} required />
              </Field>
              <Field label="Institution Name">
                <Input value={institution} onChange={e => setInstitution(e.target.value)} required />
              </Field>
              <Field label="Institutional Email">
                <Input type="email" value={instEmail} onChange={e => setInstEmail(e.target.value)} required />
              </Field>
              <Button type="submit" loading={updateProfile.isPending || requestEmailOtp.isPending}>
                Continue
              </Button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={e => { e.preventDefault(); confirmEmailOtp.mutate(); }} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Step 4: Institutional Email Verification</h2>
              <Notice tone="info">
                In a real environment, an email would be sent to {instEmail}. For this demo, your OTP is: <strong>{devEmailOtp}</strong>
              </Notice>
              <Field label="Enter OTP">
                <Input value={emailOtp} onChange={e => setEmailOtp(e.target.value)} required />
              </Field>
              {confirmEmailOtp.error && <Notice tone="error">Invalid code</Notice>}
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
                <Button type="submit" loading={confirmEmailOtp.isPending}>Verify Email</Button>
              </div>
            </form>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Step 5: National ID (Fayda) Verification</h2>
              
              {profile?.verification_level === "id_verified" ? (
                <div>
                  <Notice tone="success">Your identity has been verified.</Notice>
                  <Button className="mt-4" onClick={finishOnboarding} loading={updateProfile.isPending}>
                    Complete Onboarding
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="mb-4 font-body-md text-on-surface-variant">
                    Please provide your 12-digit Fayda ID to verify your identity.
                  </p>
                  <FaydaVerifyForm onVerified={async () => {
                     // In the real app, Fayda verification might update the DB directly via webhook or user-side mutation.
                     // Because this is a mocked form that completes locally, we mark id_verified ourselves.
                     await updateProfile.mutateAsync({ verification_level: "id_verified" });
                     refetch();
                  }} />
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
