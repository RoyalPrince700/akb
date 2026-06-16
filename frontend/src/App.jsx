import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AssessmentsPage from "./pages/AssessmentsPage";
import AssessmentResultPage from "./pages/AssessmentResultPage";
import AssessmentResultsPage from "./pages/AssessmentResultsPage";
import AdminDashboard from "./pages/AdminDashboard";
import ChapterReaderPage from "./pages/ChapterReaderPage";
import TakeAssessmentPage from "./pages/TakeAssessmentPage";
import StaffResultsPage from "./pages/StaffResultsPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
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

const hrAdminPanel = (page) => (
  <ProtectedRoute roles={["hr", "admin"]}>{page}</ProtectedRoute>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/assessments" element={<AssessmentsPage />} />
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
          <ProtectedRoute roles={["staff", "hr", "admin"]}>
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
    </Routes>
  );
};

export default App;
