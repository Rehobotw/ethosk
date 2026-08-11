import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LoadingBlock } from "./ui";

export function RequireOnboarding({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["researcher-profile"],
    queryFn: () => api<any>("/researchers/profile"),
  });

  if (isLoading) return <LoadingBlock label="Loading profile..." />;

  // Only redirect if explicitly marked as not completed
  if (profile && profile.onboarding_completed === false) {
    return <Navigate replace state={{ from: location.pathname }} to="/researcher/onboarding" />;
  }

  return <>{children}</>;
}
