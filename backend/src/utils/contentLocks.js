const ContentLock = require("../models/ContentLock");

const PRIVILEGED_ROLES = ["hr", "admin"];

const isPrivilegedRole = (role) => PRIVILEGED_ROLES.includes(role);

const getLockForCourse = async (courseId) => {
  const lock = await ContentLock.findOne({ courseId }).lean();

  return {
    courseId,
    courseLocked: Boolean(lock?.courseLocked),
    assessmentLocked: Boolean(lock?.assessmentLocked),
  };
};

const assertCourseNotLocked = async (user, courseId) => {
  if (isPrivilegedRole(user?.role)) {
    return;
  }

  const lock = await getLockForCourse(courseId);

  if (lock.courseLocked) {
    const error = new Error("This course is currently locked by HR");
    error.statusCode = 403;
    throw error;
  }
};

const assertAssessmentNotLocked = async (user, courseId) => {
  if (isPrivilegedRole(user?.role)) {
    return;
  }

  const lock = await getLockForCourse(courseId);

  if (lock.assessmentLocked) {
    const error = new Error("This assessment is currently locked by HR");
    error.statusCode = 403;
    throw error;
  }
};

module.exports = {
  assertAssessmentNotLocked,
  assertCourseNotLocked,
  getLockForCourse,
  isPrivilegedRole,
};
