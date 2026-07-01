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
import HrDashboard from "./pages/HrDashboard";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MaterialsManagementPage from "./pages/MaterialsManagementPage";
import SignupPage from "./pages/SignupPage";
import StaffDashboard from "./pages/StaffDashboard";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import StaffCourseCompletionsPage from "./pages/StaffCourseCompletionsPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import CrmCustomerHistoryPage from "./pages/crm/CrmCustomerHistoryPage";
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
        path="/leaderboard"
        element={
          <ProtectedRoute roles={["staff", "hr", "admin"]}>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route
        path="/courses/:courseId/chapters/:chapterId"
        element={
          <ProtectedRoute roles={["staff", "hr", "admin"]}>
            <ChapterReaderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assessment"
        element={
          <ProtectedRoute roles={["staff", "hr", "admin"]}>
            <TakeAssessmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/assessment/result"
        element={
          <ProtectedRoute roles={["staff", "hr", "admin"]}>
            <AssessmentResultPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={["staff", "hr", "admin", "csr", "csrAdmin"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["staff", "hr", "admin"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/results"
        element={
          <ProtectedRoute roles={["staff", "hr", "admin"]}>
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
        path="/csr/interactions/:id/edit"
        element={csrPanel(<CrmInteractionFormPage />)}
      />
      <Route path="/csr/sales-records" element={csrPanel(<CrmSalesRecordsPage />)} />
      <Route path="/csr/customers" element={csrPanel(<CrmCustomerHistoryPage />)} />
      <Route path="/csr/surveys" element={csrPanel(<CrmSurveysPage />)} />
      <Route path="/csr/settings" element={csrPanel(<CrmSettingsPage />)} />
      <Route path="/csr/survey-responses" element={csrAdminPanel(<CrmSurveyResponsesPage />)} />
      <Route path="/csr/staff" element={csrAdminPanel(<StaffManagementPage />)} />
      <Route path="/csr/sales-reps" element={csrAdminPanel(<CrmSalesRepPage />)} />
      <Route path="/csr/upload-data" element={csrAdminPanel(<CrmUploadDataPage />)} />
      <Route path="/csr/reports" element={csrAdminPanel(<CrmReportsPage />)} />
    </Routes>
  );
};

export default App;
