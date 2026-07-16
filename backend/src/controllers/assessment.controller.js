const {
  assessments,
  getAssessmentByCourseId,
} = require("../data/assessments");
const { GEMS_PER_CORRECT_ANSWER } = require("../constants/gems");
const Result = require("../models/Result");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const gradeAssessment = require("../utils/gradeAssessment");

const listAssessments = asyncHandler(async (req, res) => {
  res.json({
    assessments: assessments.map(
      ({ courseId, title, totalQuestions, pointsPerQuestion, passMark }) => ({
        courseId,
        title,
        totalQuestions,
        pointsPerQuestion,
        passMark,
      })
    ),
  });
});

const submitAssessment = asyncHandler(async (req, res) => {
  const assessment = getAssessmentByCourseId(req.params.courseId);

  if (!assessment) {
    res.status(404);
    throw new Error("Assessment not found for this course");
  }

  const { answers } = req.body;

  // Allow empty object on timeout — unanswered questions count as incorrect.
  if (answers == null || typeof answers !== "object" || Array.isArray(answers)) {
    res.status(400);
    throw new Error("Answers are required");
  }

  const priorAttempt = await Result.exists({
    user: req.user._id,
    courseId: assessment.courseId,
  });
  const isFirstAttempt = !priorAttempt;

  const graded = gradeAssessment(assessment, answers);
  const gemsEarned = isFirstAttempt
    ? graded.score * GEMS_PER_CORRECT_ANSWER
    : 0;

  let totalGems = req.user.gems ?? 0;

  if (gemsEarned > 0) {
    const user = await User.findById(req.user._id);
    user.gems = (user.gems ?? 0) + gemsEarned;
    await user.save();
    totalGems = user.gems;
    req.user.gems = user.gems;
  } else {
    const userRecord = await User.findById(req.user._id).select("gems");
    totalGems = userRecord?.gems ?? 0;
  }

  const result = await Result.create({
    user: req.user._id,
    courseId: assessment.courseId,
    assessmentTitle: assessment.title,
    answers: graded.answers,
    score: graded.score,
    totalQuestions: graded.totalQuestions,
    percentage: graded.percentage,
    passed: graded.passed,
    isFirstAttempt,
    gemsEarned,
  });

  await result.populate("user", "name staffId department");

  res.status(201).json({
    result: {
      _id: result._id,
      courseId: result.courseId,
      assessmentTitle: result.assessmentTitle,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      passed: result.passed,
      submittedAt: result.submittedAt,
      answers: result.answers,
      isFirstAttempt: result.isFirstAttempt,
      gemsEarned: result.gemsEarned,
    },
    gemsEarned,
    totalGems,
  });
});

module.exports = {
  listAssessments,
  submitAssessment,
};
