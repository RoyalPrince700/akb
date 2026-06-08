const Result = require("../models/Result");
const asyncHandler = require("../utils/asyncHandler");

const formatResult = (result) => ({
  _id: result._id,
  courseId: result.courseId,
  assessmentTitle: result.assessmentTitle,
  score: result.score,
  totalQuestions: result.totalQuestions,
  percentage: result.percentage,
  passed: result.passed,
  submittedAt: result.submittedAt,
  staffName: result.user?.name,
  staffId: result.user?.staffId,
  department: result.user?.department,
});

const listMyResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ user: req.user._id })
    .sort({ submittedAt: -1 })
    .populate("user", "name staffId department");

  res.json({
    results: results.map(formatResult),
  });
});

const listAllResults = asyncHandler(async (req, res) => {
  const results = await Result.find()
    .sort({ submittedAt: -1 })
    .populate("user", "name staffId department");

  res.json({
    results: results.map(formatResult),
  });
});

const listStaffResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ user: req.params.id })
    .sort({ submittedAt: -1 })
    .populate("user", "name staffId department");

  res.json({
    results: results.map(formatResult),
  });
});

module.exports = {
  listAllResults,
  listMyResults,
  listStaffResults,
};
