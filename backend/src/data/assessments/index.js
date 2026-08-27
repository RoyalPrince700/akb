const aiForStaff = require("./ai-for-staff");
const companyHistory = require("./company-history");
const conflictResolution = require("./conflict-resolution");
const consultativeSelling = require("./consultative-selling");
const cultureOfExcellence = require("./culture-of-excellence");
const customerService = require("./customer-service");
const digitalTransformation = require("./digital-transformation");
const finance = require("./finance");
const humanResourceManagement = require("./human-resource-management");
const solutionSelling = require("./solution-selling");

const assessments = [
  aiForStaff,
  companyHistory,
  conflictResolution,
  consultativeSelling,
  cultureOfExcellence,
  customerService,
  digitalTransformation,
  finance,
  humanResourceManagement,
  solutionSelling,
];

const getAssessmentByCourseId = (courseId) =>
  assessments.find((assessment) => assessment.courseId === courseId);

module.exports = {
  assessments,
  getAssessmentByCourseId,
};
