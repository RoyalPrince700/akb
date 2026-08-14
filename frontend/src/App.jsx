import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AssessmentsPage from "./pages/AssessmentsPage";
import AssessmentResultPage from "./pages/AssessmentResultPage";
import AssessmentResultsPage from "./pages/AssessmentResultsPage";
import AdminDashboard from "./pages/AdminDashboard";
import ChapterReaderPage from "./pages/ChapterReaderPage";
import CsrDashboard from "./pages/CsrDashboard";
import TakeAssessmentPage from "./pages/TakeAssessmentPage";
import StaffResultsPage from "./pages/StaffResultsPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
import FeaturesPage from "./pages/FeaturesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import HrAttendancePage from "./pages/HrAttendancePage";
import HrDashboard from "./pages/HrDashboard";
import HrKssAttendanceDetailPage from "./pages/HrKssAttendanceDetailPage";
import HrKssAttendancePage from "./pages/HrKssAttendancePage";
import HrAnonymousMessagesDetailPage from "./pages/HrAnonymousMessagesDetailPage";
import HrAnonymousMessagesPage from "./pages/HrAnonymousMessagesPage";
import HomePage from "./pages/HomePage";
import KssAttendanceMarkPage from "./pages/KssAttendanceMarkPage";
import PublicAnonymousMessagePage from "./pages/PublicAnonymousMessagePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ContentLocksPage from "./pages/ContentLocksPage";
import MaterialsManagementPage from "./pages/MaterialsManagementPage";
import SignupPage from "./pages/SignupPage";
import SecurityDashboard from "./pages/SecurityDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import StaffCourseCompletionsPage from "./pages/StaffCourseCompletionsPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import CrmCustomerDirectoryPage from "./pages/crm/CrmCustomerDirectoryPage";
import CrmCustomerHistoryPage from "./pages/crm/CrmCustomerHistoryPage";
import CrmCsrSalesPage from "./pages/crm/CrmCsrSalesPage";
import CrmCsrTicketsPage from "./pages/crm/CrmCsrTicketsPage";
import CrmInteractionDetailPage from "./pages/crm/CrmInteractionDetailPage";
import CrmInteractionFormPage from "./pages/crm/CrmInteractionFormPage";
import CrmInteractionsPage from "./pages/crm/CrmInteractionsPage";
import CrmReportsPage from "./pages/crm/CrmReportsPage";
import CrmSalesRecordsPage from "./pages/crm/CrmSalesRecordsPage";
import CrmSalesRepPage from "./pages/crm/CrmSalesRepPage";
import CrmSettingsPage from "./pages/crm/CrmSettingsPage";
import CrmSurveysPage from "./pages/crm/CrmSurveysPage";
import CrmSurveyResponsesPage from "./pages/crm/CrmSurveyResponsesPage";
import CrmUploadDataPage from "./pages/crm/CrmUploadDataPage";
import PublicSurveyPage from "./pages/crm/PublicSurveyPage";
import { LEARNING_ROLES } from "./utils/rolePaths";

const hrAdminPanel = (page) => (
  <ProtectedRoute roles={["hr", "admin"]}>{page}</ProtectedRoute>
);

const csrPanel = (page) => (
  <ProtectedRoute roles={["csr", "csrAdmin"]}>{page}</ProtectedRoute>
);

const csrAdminPanel = (page) => (
  <ProtectedRoute roles={["csrAdmin"]}>{page}</ProtectedRoute>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/assessments" element={<AssessmentsPage />} />
      <Route path="/crm/surveys/respond/:token" element={<PublicSurveyPage />} />
      <Route
        path="/anonymous-message/:token"
        element={<PublicAnonymousMessagePage />}
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute roles={LEARNING_ROLES}>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route
        path="/courses/:courseId/chapters/:chapterId"
        element={
          <ProtectedRoute roles={LEARNING_ROLES}>
            <ChapterReaderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assessment"
        element={
          <ProtectedRoute roles={LEARNING_ROLES}>
            <TakeAssessmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assessment/result"
        element={
          <ProtectedRoute roles={LEARNING_ROLES}>
            <AssessmentResultPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/kss-attendance/:token"
        element={
          <ProtectedRoute>
            <KssAttendanceMarkPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute
            roles={["staff", "hr", "admin", "csr", "csrAdmin", "security"]}
          >
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={LEARNING_ROLES}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/results"
        element={
          <ProtectedRoute roles={LEARNING_ROLES}>
            <StaffResultsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/staff" element={hrAdminPanel(<StaffManagementPage />)} />
      <Route
        path="/admin/completions"
        element={hrAdminPanel(<StaffCourseCompletionsPage />)}
      />
      <Route path="/admin/results" element={hrAdminPanel(<AssessmentResultsPage />)} />
      <Route path="/admin/materials" element={hrAdminPanel(<MaterialsManagementPage />)} />
      <Route path="/admin/assessments" element={hrAdminPanel(<ContentLocksPage />)} />
      <Route path="/admin/attendance" element={hrAdminPanel(<HrAttendancePage />)} />
      <Route
        path="/admin/kss-attendance"
        element={hrAdminPanel(<HrKssAttendancePage />)}
      />
      <Route
        path="/admin/kss-attendance/:id"
        element={hrAdminPanel(<HrKssAttendanceDetailPage />)}
      />
      <Route
        path="/admin/anonymous-messages"
        element={hrAdminPanel(<HrAnonymousMessagesPage />)}
      />
      <Route
        path="/admin/anonymous-messages/:id"
        element={hrAdminPanel(<HrAnonymousMessagesDetailPage />)}
      />

      <Route
        path="/hr"
        element={
          <ProtectedRoute roles={["hr"]}>
            <HrDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/hr/staff" element={hrAdminPanel(<StaffManagementPage />)} />
      <Route
        path="/hr/completions"
        element={hrAdminPanel(<StaffCourseCompletionsPage />)}
      />
      <Route path="/hr/results" element={hrAdminPanel(<AssessmentResultsPage />)} />
      <Route path="/hr/materials" element={hrAdminPanel(<MaterialsManagementPage />)} />
      <Route path="/hr/assessments" element={hrAdminPanel(<ContentLocksPage />)} />
      <Route path="/hr/attendance" element={hrAdminPanel(<HrAttendancePage />)} />
      <Route
        path="/hr/kss-attendance"
        element={hrAdminPanel(<HrKssAttendancePage />)}
      />
      <Route
        path="/hr/kss-attendance/:id"
        element={hrAdminPanel(<HrKssAttendanceDetailPage />)}
      />
      <Route
        path="/hr/anonymous-messages"
        element={hrAdminPanel(<HrAnonymousMessagesPage />)}
      />
      <Route
        path="/hr/anonymous-messages/:id"
        element={hrAdminPanel(<HrAnonymousMessagesDetailPage />)}
      />

      <Route
        path="/security"
        element={
          <ProtectedRoute roles={["security"]}>
            <SecurityDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/csr"
        element={
          <ProtectedRoute roles={["csr", "csrAdmin"]}>
            <CsrDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/csr/interactions" element={csrPanel(<CrmInteractionsPage />)} />
      <Route path="/csr/interactions/new" element={csrPanel(<CrmInteractionFormPage />)} />
      <Route
        path="/csr/interactions/:id"
        element={csrPanel(<CrmInteractionDetailPage />)}
      />
      <Route
        path="/csr/interactions/:id/edit"
        element={csrPanel(<CrmInteractionFormPage />)}
      />
      <Route path="/csr/csr-tickets" element={csrAdminPanel(<CrmCsrTicketsPage />)} />
      <Route path="/csr/csr-sales" element={csrAdminPanel(<CrmCsrSalesPage />)} />
      <Route path="/csr/sales-records" element={csrPanel(<CrmSalesRecordsPage />)} />
      <Route path="/csr/customers" element={csrPanel(<CrmCustomerHistoryPage />)} />
      <Route path="/csr/surveys" element={csrPanel(<CrmSurveysPage />)} />
      <Route path="/csr/settings" element={csrPanel(<CrmSettingsPage />)} />
      <Route path="/csr/survey-responses" element={csrAdminPanel(<CrmSurveyResponsesPage />)} />
      <Route path="/csr/staff" element={csrAdminPanel(<StaffManagementPage />)} />
      <Route path="/csr/sales-reps" element={csrAdminPanel(<CrmSalesRepPage />)} />
      <Route path="/csr/upload-data" element={csrAdminPanel(<CrmUploadDataPage />)} />
      <Route path="/csr/directory" element={csrAdminPanel(<CrmCustomerDirectoryPage />)} />
      <Route path="/csr/reports" element={csrAdminPanel(<CrmReportsPage />)} />
    </Routes>
  );
};

export default App;
