export const stripCorrectAnswers = (questions) =>
  questions.map(({ id, type, question, options }) => ({
    id,
    type,
    question,
    options,
  }));

export const getAssessmentByCourseId = (assessments, courseId) =>
  assessments.find((assessment) => assessment.courseId === courseId);

export const HR_ASSESSMENT_PREFIX = "custom-";

export const isHrAssessmentCourseId = (courseId) =>
  typeof courseId === "string" && courseId.startsWith(HR_ASSESSMENT_PREFIX);

export const hrAssessmentIdFromCourseId = (courseId) =>
  isHrAssessmentCourseId(courseId)
    ? courseId.slice(HR_ASSESSMENT_PREFIX.length)
    : "";
