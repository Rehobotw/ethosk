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
import { WithdrawalHistoryPage } from "./pages/respondent/WithdrawalHistoryPage";
import { RespondentNotificationCenterPage } from "./pages/respondent/RespondentNotificationCenterPage";
import { RespondentHelpCenterPage } from "./pages/respondent/RespondentHelpCenterPage";

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
const SurveyCreationSuccessPage = lazy(() =>
  import("./pages/researcher/SurveyCreationSuccessPage").then((m) => ({ default: m.SurveyCreationSuccessPage })),
);
const SurveyPostingWizardPage = lazy(() =>
  import("./pages/researcher/SurveyPostingWizardPage").then((m) => ({ default: m.SurveyPostingWizardPage })),
);
const SurveyAnalyticsPage = lazy(() =>
  import("./pages/researcher/SurveyAnalyticsPage").then((m) => ({
    default: m.SurveyAnalyticsPage,
  })),
);
const RawDataExportPage = lazy(() =>
  import("./pages/researcher/RawDataExportPage").then((m) => ({
    default: m.RawDataExportPage,
  })),
);
const ResearcherWalletPage = lazy(() =>
  import("./pages/researcher/WalletPage").then((m) => ({ default: m.ResearcherWalletPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/researcher/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const HelpCenterPage = lazy(() =>
  import("./pages/researcher/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })),
);
const ResearcherNotificationCenterPage = lazy(() =>
  import("./pages/researcher/ResearcherNotificationCenterPage").then((m) => ({
    default: m.ResearcherNotificationCenterPage,
  })),
);
const ResearcherProfilePage = lazy(() =>
  import("./pages/researcher/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SubscriptionPage = lazy(() =>
  import("./pages/researcher/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })),
);
const ChooseSubscriptionPlanPage = lazy(() =>
  import("./pages/researcher/ChooseSubscriptionPlanPage").then((m) => ({
    default: m.ChooseSubscriptionPlanPage,
  })),
);
const SubscriptionCheckoutReadyPage = lazy(() =>
  import("./pages/researcher/SubscriptionCheckoutReadyPage").then((m) => ({
    default: m.SubscriptionCheckoutReadyPage,
  })),
);
const SubscriptionCheckoutProcessingPage = lazy(() =>
  import("./pages/researcher/SubscriptionCheckoutProcessingPage").then((m) => ({
    default: m.SubscriptionCheckoutProcessingPage,
  })),
);
const SubscriptionCheckoutSuccessPage = lazy(() =>
  import("./pages/researcher/SubscriptionCheckoutSuccessPage").then((m) => ({
    default: m.SubscriptionCheckoutSuccessPage,
  })),
);
const PaymentConfirmationPage = lazy(() =>
  import("./pages/researcher/PaymentConfirmationPage").then((m) => ({
    default: m.PaymentConfirmationPage,
  })),
);
const ContactSupportPage = lazy(() =>
  import("./pages/public/ContactSupportPage").then((m) => ({
    default: m.ContactSupportPage,
  })),
);
const ContactSupportSuccessPage = lazy(() =>
  import("./pages/public/ContactSupportSuccessPage").then((m) => ({
    default: m.ContactSupportSuccessPage,
  })),
);
const TermsAndConditionsPage = lazy(() =>
  import("./pages/public/TermsAndConditionsPage").then((m) => ({
    default: m.TermsAndConditionsPage,
  })),
);
const PrivacyPolicyPage = lazy(() =>
  import("./pages/public/PrivacyPolicyPage").then((m) => ({
    default: m.PrivacyPolicyPage,
  })),
);
const AccessDeniedPage = lazy(() =>
  import("./pages/error/AccessDeniedPage").then((m) => ({
    default: m.AccessDeniedPage,
  })),
);
const SessionExpiredPage = lazy(() =>
  import("./pages/error/SessionExpiredPage").then((m) => ({
    default: m.SessionExpiredPage,
  })),
);
const ServerErrorPage = lazy(() =>
  import("./pages/error/ServerErrorPage").then((m) => ({
    default: m.ServerErrorPage,
  })),
);
const NetworkErrorPage = lazy(() =>
  import("./pages/error/NetworkErrorPage").then((m) => ({
    default: m.NetworkErrorPage,
  })),
);
const MaintenancePage = lazy(() =>
  import("./pages/error/MaintenancePage").then((m) => ({
    default: m.MaintenancePage,
  })),
);
const NoSearchResultsPage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.NoSearchResultsPage,
  })),
);
const SurveyNotFoundPage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.SurveyNotFoundPage,
  })),
);
const SurveyClosedPage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.SurveyClosedPage,
  })),
);
const SurveyPausedPage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.SurveyPausedPage,
  })),
);
const SurveyNotEligiblePage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.SurveyNotEligiblePage,
  })),
);
const SurveyCompletedPage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.SurveyCompletedPage,
  })),
);
const SurveySubmissionErrorPage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.SurveySubmissionErrorPage,
  })),
);
const SurveySubmissionSuccessPage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.SurveySubmissionSuccessPage,
  })),
);
const EmptyStateShowcasePage = lazy(() =>
  import("./pages/survey/SurveyStatePages").then((m) => ({
    default: m.EmptyStateShowcasePage,
  })),
);
const SurveyCompletionSuccessDesktopPage = lazy(() =>
  import("./pages/respondent/SurveyCompletionSuccessDesktopPage").then((m) => ({
    default: m.SurveyCompletionSuccessDesktopPage,
  })),
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
const SurveyReviewDetailPage = lazy(() =>
  import("./pages/admin/SurveyReviewDetailPage").then((m) => ({ default: m.SurveyReviewDetailPage })),
);
const ClearanceDocumentReviewPage = lazy(() =>
  import("./pages/admin/ClearanceDocumentReviewPage").then((m) => ({
    default: m.ClearanceDocumentReviewPage,
  })),
);
const SurveyApprovedSuccessPage = lazy(() =>
  import("./pages/admin/SurveyApprovedSuccessPage").then((m) => ({
    default: m.SurveyApprovedSuccessPage,
  })),
);
const SurveyRejectedSuccessPage = lazy(() =>
  import("./pages/admin/SurveyRejectedSuccessPage").then((m) => ({
    default: m.SurveyRejectedSuccessPage,
  })),
);
const CorrectionQueuePage = lazy(() =>
  import("./pages/admin/CorrectionQueuePage").then((m) => ({
    default: m.CorrectionQueuePage,
  })),
);
const ResubmissionReviewPage = lazy(() =>
  import("./pages/admin/ResubmissionReviewPage").then((m) => ({
    default: m.ResubmissionReviewPage,
  })),
);
const RevenueDashboardPage = lazy(() =>
  import("./pages/admin/RevenueDashboardPage").then((m) => ({ default: m.RevenueDashboardPage })),
);
const ResearcherQueuePage = lazy(() =>
  import("./pages/admin/ResearcherQueuePage").then((m) => ({ default: m.AdminResearcherQueuePage })),
);
const ReconciliationQueuePage = lazy(() =>
  import("./pages/admin/ReconciliationQueuePage").then((m) => ({
    default: m.ReconciliationQueuePage,
  })),
);
const DataSubjectRequestsPage = lazy(() =>
  import("./pages/admin/DataSubjectRequestsPage").then((m) => ({
    default: m.DataSubjectRequestsPage,
  })),
);
const UserManagementPage = lazy(() =>
  import("./pages/admin/UserManagementPage").then((m) => ({ default: m.UserManagementPage })),
);
const AdminNotificationCenterPage = lazy(() =>
  import("./pages/admin/AdminNotificationCenterPage").then((m) => ({
    default: m.AdminNotificationCenterPage,
  })),
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
      <Route element={<LoginPage />} path="/login/respondent" />
      <Route element={<LoginPage />} path="/login/researcher" />

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
      <Route element={<ContactSupportPage />} path="/contact" />
      <Route element={<ContactSupportPage />} path="/support" />
      <Route element={<ContactSupportPage />} path="/contact-support" />
      <Route element={<ContactSupportSuccessPage />} path="/contact/success" />
      <Route element={<ContactSupportSuccessPage />} path="/support/success" />
      <Route element={<TermsAndConditionsPage />} path="/terms" />
      <Route element={<TermsAndConditionsPage />} path="/terms-and-conditions" />
      <Route element={<TermsAndConditionsPage />} path="/legal/terms" />
      <Route element={<PrivacyPolicyPage />} path="/privacy" />
      <Route element={<PrivacyPolicyPage />} path="/privacy-policy" />
      <Route element={<PrivacyPolicyPage />} path="/legal/privacy" />
      <Route element={<AccessDeniedPage />} path="/403" />
      <Route element={<AccessDeniedPage />} path="/access-denied" />
      <Route element={<SessionExpiredPage />} path="/session-expired" />
      <Route element={<ServerErrorPage />} path="/500" />
      <Route element={<ServerErrorPage />} path="/server-error" />
      <Route element={<NetworkErrorPage />} path="/network-error" />
      <Route element={<MaintenancePage />} path="/maintenance" />
      <Route element={<NoSearchResultsPage />} path="/search/no-results" />
      <Route element={<SurveyNotFoundPage />} path="/survey/not-found" />
      <Route element={<SurveyClosedPage />} path="/survey/closed" />
      <Route element={<SurveyPausedPage />} path="/survey/paused" />
      <Route element={<SurveyNotEligiblePage />} path="/survey/not-eligible" />
      <Route element={<SurveyCompletedPage />} path="/survey/already-completed" />
      <Route element={<SurveySubmissionErrorPage />} path="/survey/submission-error" />
      <Route element={<SurveySubmissionSuccessPage />} path="/survey/submission-success" />
      <Route element={<EmptyStateShowcasePage />} path="/empty-states" />
      <Route element={<SurveyCompletionSuccessDesktopPage />} path="/survey/completion-success" />
      <Route element={<SurveyCompletionSuccessDesktopPage />} path="/survey/success/desktop" />

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
        <Route element={<WithdrawalHistoryPage />} path="/wallet/history" />
        <Route element={<WithdrawalHistoryPage />} path="/respondent/wallet/history" />
        <Route element={<ProfilePage />} path="/profile" />
        <Route element={<ProfilePage />} path="/respondent/profile" />
        <Route element={<VerificationPage />} path="/verify" />
        <Route element={<VerificationPage />} path="/respondent/profile/verification" />
        <Route element={<RespondentNotificationCenterPage />} path="/respondent/notifications" />
        <Route element={<RespondentNotificationCenterPage />} path="/notifications/respondent" />
        <Route element={<DocumentsPage />} path="/documents" />
        <Route element={<RespondentHelpCenterPage />} path="/respondent/help" />
        <Route element={<RespondentHelpCenterPage />} path="/respondent/help-center" />
      </Route>
      <Route element={<RespondentHelpCenterPage />} path="/help/respondent" />

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
        <Route element={<SurveyImportPage />} path="/survey-builder/import/:id" />
        <Route element={<SurveyAiPage />} path="/researcher/surveys/new/ai" />
        <Route element={<SurveyAiPage />} path="/survey-builder/ai" />
        <Route element={<SurveyAiPage />} path="/survey-builder/ai/:id" />
        <Route element={<SurveyCreationSuccessPage />} path="/survey-builder/success" />
        <Route element={<SurveyCreationSuccessPage />} path="/survey-builder/success/:id" />
        <Route element={<SurveyCreationSuccessPage />} path="/researcher/surveys/success" />
        <Route element={<SurveyCreationSuccessPage />} path="/researcher/surveys/:id/success" />
        <Route element={<SurveyPostingWizardPage />} path="/survey-posting" />
        <Route element={<SurveyPostingWizardPage />} path="/survey-posting/:id" />
        <Route element={<SurveyPostingWizardPage />} path="/researcher/posting" />
        <Route element={<SurveyPostingWizardPage />} path="/researcher/posting/:id" />
        <Route element={<SurveyPostingWizardPage />} path="/researcher/surveys/:id/post" />
        <Route element={<SurveyBuilderPage />} path="/researcher/surveys/:id/edit" />
        <Route element={<SurveyAnalyticsPage />} path="/researcher/analytics" />
        <Route element={<SurveyAnalyticsPage />} path="/researcher/surveys/:id/dashboard" />
        <Route element={<RawDataExportPage />} path="/researcher/surveys/:id/export" />
        <Route element={<RawDataExportPage />} path="/researcher/export-raw-data" />
        <Route element={<ResearcherWalletPage />} path="/researcher/wallet" />
        <Route element={<TelebirrDemoPage />} path="/researcher/wallet/telebirr-demo" />
        <Route element={<SubscriptionPage />} path="/researcher/subscription" />
        <Route element={<ChooseSubscriptionPlanPage />} path="/subscription/plans" />
        <Route element={<ChooseSubscriptionPlanPage />} path="/researcher/subscription/plans" />
        <Route element={<ChooseSubscriptionPlanPage />} path="/subscription" />
        <Route element={<SubscriptionCheckoutReadyPage />} path="/subscription/checkout" />
        <Route element={<SubscriptionCheckoutReadyPage />} path="/researcher/subscription/checkout" />
        <Route element={<SubscriptionCheckoutProcessingPage />} path="/subscription/checkout/processing" />
        <Route element={<SubscriptionCheckoutProcessingPage />} path="/researcher/subscription/checkout/processing" />
        <Route element={<SubscriptionCheckoutSuccessPage />} path="/subscription/checkout/success" />
        <Route element={<SubscriptionCheckoutSuccessPage />} path="/researcher/subscription/checkout/success" />
        <Route element={<PaymentConfirmationPage />} path="/subscription/confirmation" />
        <Route element={<PaymentConfirmationPage />} path="/researcher/subscription/confirmation" />
        <Route element={<ResearcherProfilePage />} path="/researcher/profile" />
        <Route element={<SettingsPage />} path="/researcher/settings" />
        <Route element={<SettingsPage />} path="/profile/settings" />
        <Route element={<HelpCenterPage />} path="/researcher/help" />
        <Route element={<HelpCenterPage />} path="/help" />
        <Route element={<ResearcherNotificationCenterPage />} path="/researcher/notifications" />
        <Route element={<ResearcherNotificationCenterPage />} path="/notifications" />
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
        <Route element={<CorrectionQueuePage />} path="/admin/correction-queue" />
        <Route element={<ResubmissionReviewPage />} path="/admin/resubmission-review/:id" />
        <Route element={<ResubmissionReviewPage />} path="/admin/resubmission-review" />
        <Route element={<SurveyReviewDetailPage />} path="/admin/survey-approvals/:id" />
        <Route element={<SurveyApprovedSuccessPage />} path="/admin/survey-approvals/:id/success" />
        <Route element={<SurveyRejectedSuccessPage />} path="/admin/survey-approvals/:id/rejected" />
        <Route element={<SurveyReviewDetailPage />} path="/admin/survey-review/:id" />
        <Route element={<ClearanceDocumentReviewPage />} path="/admin/compliance-docs/:id" />
        <Route element={<ClearanceDocumentReviewPage />} path="/admin/document-review/:id" />
        <Route element={<RevenueDashboardPage />} path="/admin/revenue" />
        <Route element={<ResearcherQueuePage />} path="/admin/researcher-approvals" />
        <Route element={<ReconciliationQueuePage />} path="/admin/reconciliation" />
        <Route element={<DataSubjectRequestsPage />} path="/admin/data-requests" />
        <Route element={<AdminNotificationCenterPage />} path="/admin/notifications" />
        <Route element={<AdminNotificationCenterPage />} path="/admin/notification-center" />
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
