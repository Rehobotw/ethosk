import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "./components/layout/MarketingLayout";
import { RespondentLayout } from "./components/layout/RespondentLayout";
import { RequireRole } from "./components/RequireRole";
import { RequireOnboarding } from "./components/RequireOnboarding";
import { LoadingBlock } from "./components/ui";
import { AuthCallbackPage } from "./pages/auth/AuthCallbackPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { LoginPage } from "./pages/auth/LoginPage";

import { SignupPage } from "./pages/auth/SignupPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { DocumentsPage } from "./pages/respondent/DocumentsPage";
import { HistoryPage } from "./pages/respondent/HistoryPage";
import { InboxPage } from "./pages/respondent/InboxPage";
import { ProfilePage } from "./pages/respondent/ProfilePage";
import { SurveyFillPage } from "./pages/respondent/SurveyFillPage";
import { VerificationPage } from "./pages/respondent/VerificationPage";
import { RespondentOnboardingPage } from "./pages/respondent/RespondentOnboardingPage";
import { WalletPage } from "./pages/respondent/WalletPage";

/**
 * The researcher and admin screens are loaded on demand. They pull in the
 * charting library, which a respondent on a throttled 3G connection should never
 * have to download to answer a survey (§4, accessibility NFR).
 */
const ResearcherLayout = lazy(() =>
  import("./components/layout/ResearcherLayout").then((m) => ({ default: m.ResearcherLayout })),
);
const AdminLayout = lazy(() =>
  import("./components/layout/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const DashboardPage = lazy(() =>
  import("./pages/researcher/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const SurveyListPage = lazy(() =>
  import("./pages/researcher/SurveyListPage").then((m) => ({ default: m.SurveyListPage })),
);
const SurveyBuilderPage = lazy(() =>
  import("./pages/researcher/SurveyBuilderPage").then((m) => ({ default: m.SurveyBuilderPage })),
);
const SurveyNewLandingPage = lazy(() =>
  import("./pages/researcher/SurveyNewLandingPage").then((m) => ({ default: m.SurveyNewLandingPage })),
);
const SurveyImportPage = lazy(() =>
  import("./pages/researcher/SurveyImportPage").then((m) => ({ default: m.SurveyImportPage })),
);
const SurveyAiPage = lazy(() =>
  import("./pages/researcher/SurveyAiPage").then((m) => ({ default: m.SurveyAiPage })),
);
const SurveyAnalyticsPage = lazy(() =>
  import("./pages/researcher/SurveyAnalyticsPage").then((m) => ({
    default: m.SurveyAnalyticsPage,
  })),
);
const ResearcherWalletPage = lazy(() =>
  import("./pages/researcher/WalletPage").then((m) => ({ default: m.ResearcherWalletPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/researcher/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const ResearcherProfilePage = lazy(() =>
  import("./pages/researcher/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SubscriptionPage = lazy(() =>
  import("./pages/researcher/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })),
);
const TelebirrDemoPage = lazy(() =>
  import("./pages/researcher/TelebirrDemoPage").then((m) => ({ default: m.TelebirrDemoPage })),
);
const AdminDashboardOverviewPage = lazy(() =>
  import("./pages/admin/AdminDashboardOverviewPage").then((m) => ({
    default: m.AdminDashboardOverviewPage,
  })),
);
const AdminReviewQueuePage = lazy(() =>
  import("./pages/admin/ReviewQueuePage").then((m) => ({ default: m.AdminReviewQueuePage })),
);
const SurveyQueuePage = lazy(() =>
  import("./pages/admin/SurveyQueuePage").then((m) => ({ default: m.SurveyQueuePage })),
);
const RevenueDashboardPage = lazy(() =>
  import("./pages/admin/RevenueDashboardPage").then((m) => ({ default: m.RevenueDashboardPage })),
);
const ResearcherQueuePage = lazy(() =>
  import("./pages/admin/ResearcherQueuePage").then((m) => ({ default: m.AdminResearcherQueuePage })),
);
const UserManagementPage = lazy(() =>
  import("./pages/admin/UserManagementPage").then((m) => ({ default: m.UserManagementPage })),
);
const AdminLoginPage = lazy(() =>
  import("./pages/admin/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })),
);
const ResearcherOnboardingPage = lazy(() =>
  import("./pages/researcher/OnboardingPage").then((m) => ({ default: m.OnboardingPage })),
);

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />} path="/">
        <Route element={<HomePage />} index />
        <Route element={<Navigate replace to="/#how" />} path="learn/researchers" />
        <Route element={<Navigate replace to="/#verification" />} path="learn/respondents" />
      </Route>

      <Route element={<LoginPage />} path="/login" />
      <Route element={<LoginPage role="respondent" />} path="/login/respondent" />
      <Route element={<LoginPage role="researcher" />} path="/login/researcher" />

      <Route
        element={
          <Suspense fallback={<LoadingBlock />}>
            <AdminLoginPage />
          </Suspense>
        }
        path="/admin/login"
      />

      <Route element={<SignupPage />} path="/signup" />
      <Route element={<SignupPage role="respondent" />} path="/signup/respondent" />
      <Route element={<SignupPage role="researcher" />} path="/signup/researcher" />

      <Route element={<AuthCallbackPage />} path="/auth/callback" />
      <Route element={<VerifyEmailPage />} path="/verify-email" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />
      <Route element={<RespondentOnboardingPage />} path="/onboarding" />
      <Route element={<RespondentOnboardingPage />} path="/respondent/onboarding" />

      {/* Respondent */}
      <Route
        element={
          <RequireRole roles={["respondent"]}>
            <RespondentLayout />
          </RequireRole>
        }
      >
        <Route element={<InboxPage />} path="/inbox" />
        <Route element={<HistoryPage />} path="/history" />
        <Route element={<WalletPage />} path="/wallet" />
        <Route element={<ProfilePage />} path="/profile" />
        <Route element={<ProfilePage />} path="/respondent/profile" />
        <Route element={<VerificationPage />} path="/verify" />
        <Route element={<VerificationPage />} path="/respondent/profile/verification" />
        <Route element={<DocumentsPage />} path="/documents" />
      </Route>

      {/* The fill screen is deliberately outside the tab shell: no distractions,
          and no navigation that would abandon a partly-completed survey. */}
      <Route
        element={
          <RequireRole roles={["respondent"]}>
            <SurveyFillPage />
          </RequireRole>
        }
        path="/surveys/:id/fill"
      />

      {/* Researcher Onboarding (outside tab shell) */}
      <Route
        element={
          <RequireRole roles={["researcher"]}>
            <Suspense fallback={<LoadingBlock />}>
              <ResearcherOnboardingPage />
            </Suspense>
          </RequireRole>
        }
        path="/researcher/onboarding"
      />

      {/* Researcher (Main Dashboard & App) */}
      <Route
        element={
          <RequireRole roles={["researcher"]}>
            <Suspense fallback={<LoadingBlock />}>
              <RequireOnboarding>
                <ResearcherLayout />
              </RequireOnboarding>
            </Suspense>
          </RequireRole>
        }
      >
        <Route element={<DashboardPage />} path="/researcher" />
        <Route element={<SurveyListPage />} path="/researcher/surveys" />
        <Route element={<SurveyNewLandingPage />} path="/researcher/surveys/new" />
        <Route element={<SurveyNewLandingPage />} path="/survey-builder" />
        <Route element={<SurveyBuilderPage />} path="/researcher/surveys/new/manual" />
        <Route element={<SurveyBuilderPage />} path="/survey-builder/manual" />
        <Route element={<SurveyBuilderPage />} path="/survey-builder/manual/:id" />
        <Route element={<SurveyImportPage />} path="/researcher/surveys/new/import" />
        <Route element={<SurveyImportPage />} path="/survey-builder/import" />
        <Route element={<SurveyAiPage />} path="/researcher/surveys/new/ai" />
        <Route element={<SurveyAiPage />} path="/survey-builder/ai" />
        <Route element={<SurveyBuilderPage />} path="/researcher/surveys/:id/edit" />
        <Route element={<SurveyAnalyticsPage />} path="/researcher/analytics" />
        <Route element={<SurveyAnalyticsPage />} path="/researcher/surveys/:id/dashboard" />
        <Route element={<ResearcherWalletPage />} path="/researcher/wallet" />
        <Route element={<TelebirrDemoPage />} path="/researcher/wallet/telebirr-demo" />
        <Route element={<SubscriptionPage />} path="/researcher/subscription" />
        <Route element={<ResearcherProfilePage />} path="/researcher/profile" />
        <Route element={<SettingsPage />} path="/researcher/settings" />
        <Route element={<SettingsPage />} path="/profile/settings" />
      </Route>

      {/* Admin */}
      <Route
        element={
          <RequireRole roles={["admin", "super_admin"]}>
            <Suspense fallback={<LoadingBlock />}>
              <AdminLayout />
            </Suspense>
          </RequireRole>
        }
      >
        <Route element={<AdminDashboardOverviewPage />} path="/admin" />
        <Route element={<AdminDashboardOverviewPage />} path="/admin/overview" />
        <Route element={<AdminReviewQueuePage />} path="/admin/review-queue" />
        <Route element={<SurveyQueuePage />} path="/admin/survey-approvals" />
        <Route element={<RevenueDashboardPage />} path="/admin/revenue" />
        <Route element={<ResearcherQueuePage />} path="/admin/researcher-approvals" />
      </Route>

      {/* Super Admin only */}
      <Route
        element={
          <RequireRole roles={["super_admin"]}>
            <Suspense fallback={<LoadingBlock />}>
              <AdminLayout />
            </Suspense>
          </RequireRole>
        }
      >
        <Route element={<UserManagementPage />} path="/admin/users" />
      </Route>

      <Route element={<Navigate replace to="/" />} path="/home" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  );
}
