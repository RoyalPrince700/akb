const aiForStaff = require("./ai-for-staff");
const companyHistory = require("./company-history");
const finance = require("./finance");
const humanResourceManagement = require("./human-resource-management");

const assessments = [aiForStaff, finance, companyHistory, humanResourceManagement];

const getAssessmentByCourseId = (courseId) =>
  assessments.find((assessment) => assessment.courseId === courseId);

module.exports = {
  assessments,
  getAssessmentByCourseId,
};
