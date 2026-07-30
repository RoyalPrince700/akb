const Result = require("../models/Result");
const User = require("../models/User");
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

const deleteResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);

  if (!result) {
    res.status(404);
    throw new Error("Assessment result not found");
  }

  const gemsToRevoke = result.gemsEarned || 0;
  const userId = result.user;
  const resultId = result._id;

  await result.deleteOne();

  if (gemsToRevoke > 0 && userId) {
    const user = await User.findById(userId);

    if (user) {
      user.gems = Math.max(0, (user.gems ?? 0) - gemsToRevoke);
      await user.save();
    }
  }

  res.json({
    message: "Assessment result deleted successfully",
    id: resultId,
  });
});

module.exports = {
  deleteResult,
  listAllResults,
  listMyResults,
  listStaffResults,
};
