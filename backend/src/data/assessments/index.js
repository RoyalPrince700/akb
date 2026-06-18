const aiForStaff = require("./ai-for-staff");
const companyHistory = require("./company-history");
const conflictResolution = require("./conflict-resolution");
const customerService = require("./customer-service");
const finance = require("./finance");
const humanResourceManagement = require("./human-resource-management");

const assessments = [
  aiForStaff,
  companyHistory,
  conflictResolution,
  customerService,
  finance,
  humanResourceManagement,
];

const getAssessmentByCourseId = (courseId) =>
  assessments.find((assessment) => assessment.courseId === courseId);

module.exports = {
  assessments,
  getAssessmentByCourseId,
};
