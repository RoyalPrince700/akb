const aiForStaff = require("./ai-for-staff");
const companyHistory = require("./company-history");
const finance = require("./finance");

const assessments = [aiForStaff, finance, companyHistory];

const getAssessmentByCourseId = (courseId) =>
  assessments.find((assessment) => assessment.courseId === courseId);

module.exports = {
  assessments,
  getAssessmentByCourseId,
};
