import { useAuth } from "../context/AuthContext";
import {
  isCourseLearnerRole,
  isLearningRole,
} from "../utils/rolePaths";
import { useProgress } from "./useProgress";

export const useAssessmentAccess = (courseId) => {
  const { isAuthenticated, user } = useAuth();
  const { courseCompleted, isReady: progressReady } = useProgress(courseId);

  const canAccessCourses = isAuthenticated && isLearningRole(user?.role);
  const requiresCourseCompletion = isCourseLearnerRole(user?.role);
  const isPrivilegedUser = ["hr", "admin"].includes(user?.role);
  const needsCourseCompletion =
    canAccessCourses && requiresCourseCompletion;
  const isReady = !needsCourseCompletion || progressReady;
  const isLocked = needsCourseCompletion && !courseCompleted;
  const canTakeAssessment =
    canAccessCourses && (!needsCourseCompletion || courseCompleted);

  return {
    canAccessCourses,
    canTakeAssessment,
    courseCompleted,
    isLocked,
    isPrivilegedUser,
    isReady,
    requiresCourseCompletion,
    progressReady,
  };
};
