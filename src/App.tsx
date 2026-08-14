import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "./components/layout/MarketingLayout";
import { RespondentLayout } from "./components/layout/RespondentLayout";
import { RequireRole } from "./components/RequireRole";
import { RequireOnboarding } from "./components/RequireOnboarding";
import { LoadingBlock } from "./components/ui";
import { AuthRoleRedirect } from "./pages/auth/AuthRoleRedirect";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { HomePage } from "./pages/HomePage";
import { LearnRespondentsPage } from "./pages/LearnRespondentsPage";
import { LearnResearchersPage } from "./pages/LearnResearchersPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { DocumentsPage } from "./pages/respondent/DocumentsPage";
import { HistoryPage } from "./pages/respondent/HistoryPage";
import { InboxPage } from "./pages/respondent/InboxPage";
import { ProfilePage } from "./pages/respondent/ProfilePage";
import { SurveyFillPage } from "./pages/respondent/SurveyFillPage";
import { VerificationPage } from "./pages/respondent/VerificationPage";
import { WalletPage } from "./pages/respondent/WalletPage";

/**
 * The researcher and admin screens are loaded on demand. They pull in the
 * charting library, which a respondent on a throttled 3G connection should never
 * have to download to answer a survey (§4, accessibility NFR).
 */
const ResearcherLayout = lazy(() =>
  import("./components/layout/ResearcherLayout").then((m) => ({ default: m.ResearcherLayout })),
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
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminReviewQueuePage = lazy(() =>
  import("./pages/admin/ReviewQueuePage").then((m) => ({ default: m.AdminReviewQueuePage })),
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
        <Route element={<LearnResearchersPage />} path="learn/researchers" />
        <Route element={<LearnRespondentsPage />} path="learn/respondents" />
      </Route>

      <Route element={<LoginPage forcedRole="researcher" />} path="/login/researcher" />
      <Route element={<LoginPage forcedRole="respondent" />} path="/login/respondent" />
      <Route element={<AuthRoleRedirect mode="login" />} path="/login" />
      <Route
        element={
          <Suspense fallback={<LoadingBlock />}>
            <AdminLoginPage />
          </Suspense>
        }
        path="/admin/login"
      />
      <Route element={<SignupPage forcedRole="researcher" />} path="/signup/researcher" />
      <Route element={<SignupPage forcedRole="respondent" />} path="/signup/respondent" />
      <Route element={<AuthRoleRedirect mode="signup" />} path="/signup" />
      <Route element={<VerifyEmailPage />} path="/verify-email" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />

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
        <Route element={<VerificationPage />} path="/verify" />
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
        <Route element={<SurveyBuilderPage />} path="/researcher/surveys/new" />
        <Route element={<SurveyBuilderPage />} path="/researcher/surveys/:id/edit" />
        <Route element={<SurveyAnalyticsPage />} path="/researcher/surveys/:id/dashboard" />
        <Route element={<ResearcherWalletPage />} path="/researcher/wallet" />
        <Route element={<TelebirrDemoPage />} path="/researcher/wallet/telebirr-demo" />
        <Route element={<SubscriptionPage />} path="/researcher/subscription" />
        <Route element={<ResearcherProfilePage />} path="/researcher/profile" />
        <Route element={<SettingsPage />} path="/researcher/settings" />
      </Route>

      {/* Admin */}
      <Route
        element={
          <RequireRole roles={["admin"]}>
            <Suspense fallback={<LoadingBlock />}>
              <ResearcherLayout />
            </Suspense>
          </RequireRole>
        }
      >
        <Route element={<AdminDashboardPage />} path="/admin" />
        <Route element={<AdminReviewQueuePage />} path="/admin/review-queue" />
        <Route element={<ResearcherQueuePage />} path="/admin/researcher-approvals" />
      </Route>

      {/* Super Admin only */}
      <Route
        element={
          <RequireRole roles={["super_admin"]}>
            <Suspense fallback={<LoadingBlock />}>
              <ResearcherLayout />
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
