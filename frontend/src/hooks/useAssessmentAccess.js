import { useAuth } from "../context/AuthContext";
import { useProgress } from "./useProgress";

export const useAssessmentAccess = (courseId) => {
  const { isAuthenticated, user } = useAuth();
  const { courseCompleted, isReady: progressReady } = useProgress(courseId);

  const canAccessCourses =
    isAuthenticated && ["staff", "hr", "admin"].includes(user?.role);
  const isStaff = user?.role === "staff";
  const isPrivilegedUser = ["hr", "admin"].includes(user?.role);
  const needsCourseCompletion = canAccessCourses && isStaff;
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
    isStaff,
    progressReady,
  };
};
