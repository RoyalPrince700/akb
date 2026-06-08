export const stripCorrectAnswers = (questions) =>
  questions.map(({ id, type, question, options }) => ({
    id,
    type,
    question,
    options,
  }));

export const getAssessmentByCourseId = (assessments, courseId) =>
  assessments.find((assessment) => assessment.courseId === courseId);
