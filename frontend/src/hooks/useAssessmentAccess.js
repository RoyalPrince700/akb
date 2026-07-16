import { useAuth } from "../context/AuthContext";
import { isLearningRole } from "../utils/rolePaths";
import { useProgress } from "./useProgress";

export const useAssessmentAccess = (courseId) => {
  const { isAuthenticated, user } = useAuth();
  const { courseCompleted, isReady: progressReady } = useProgress(courseId);

  const canAccessCourses = isAuthenticated && isLearningRole(user?.role);
  const isPrivilegedUser = ["hr", "admin"].includes(user?.role);

  // Assessments are open regardless of course completion.
  return {
    canAccessCourses,
    canTakeAssessment: canAccessCourses,
    courseCompleted,
    isLocked: false,
    isPrivilegedUser,
    isReady: true,
    requiresCourseCompletion: false,
    progressReady,
  };
};
