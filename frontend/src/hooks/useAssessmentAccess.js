import { useAuth } from "../context/AuthContext";
import { isLearningRole } from "../utils/rolePaths";
import { useContentLock } from "./useContentLocks";
import { useProgress } from "./useProgress";

export const useAssessmentAccess = (courseId) => {
  const { isAuthenticated, user } = useAuth();
  const { courseCompleted, isReady: progressReady } = useProgress(courseId);
  const { lock, isReady: lockReady } = useContentLock(courseId);

  const canAccessCourses = isAuthenticated && isLearningRole(user?.role);
  const isPrivilegedUser = ["hr", "admin"].includes(user?.role);
  const assessmentLockedByHr =
    Boolean(lock?.assessmentLocked) && !isPrivilegedUser;
  const courseLockedByHr = Boolean(lock?.courseLocked) && !isPrivilegedUser;
  const isLocked = assessmentLockedByHr;
  const canTakeAssessment = canAccessCourses && !isLocked && lockReady;

  return {
    assessmentLockedByHr,
    canAccessCourses,
    canTakeAssessment,
    courseCompleted,
    courseLockedByHr,
    isLocked,
    isPrivilegedUser,
    isReady: progressReady && lockReady,
    requiresCourseCompletion: false,
    progressReady,
  };
};
