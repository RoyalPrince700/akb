const {
  assessments,
  getAssessmentByCourseId,
} = require("../data/assessments");
const { GEMS_PER_CORRECT_ANSWER } = require("../constants/gems");
const HrAssessment = require("../models/HrAssessment");
const Result = require("../models/Result");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const {
  assertAssessmentNotLocked,
  getLockForCourse,
  isPrivilegedRole,
} = require("../utils/contentLocks");
const {
  idFromHrCourseId,
  isHrAssessmentCourseId,
  reviewByQuestionId,
  toGradingAssessment,
} = require("../utils/hrAssessment");
const gradeAssessment = require("../utils/gradeAssessment");

const listAssessments = asyncHandler(async (req, res) => {
  const locks = await Promise.all(
    assessments.map((assessment) => getLockForCourse(assessment.courseId))
  );
  const lockByCourseId = Object.fromEntries(
    locks.map((lock) => [lock.courseId, lock])
  );

  res.json({
    assessments: assessments.map(
      ({ courseId, title, totalQuestions, pointsPerQuestion, passMark }) => ({
        courseId,
        title,
        totalQuestions,
        pointsPerQuestion,
        passMark,
        assessmentLocked: Boolean(lockByCourseId[courseId]?.assessmentLocked),
        courseLocked: Boolean(lockByCourseId[courseId]?.courseLocked),
      })
    ),
  });
});

const submitAssessment = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  let assessment;
  let review = null;

  if (isHrAssessmentCourseId(courseId)) {
    const doc = await HrAssessment.findById(idFromHrCourseId(courseId));

    if (!doc || doc.status !== "published") {
      res.status(404);
      throw new Error("Assessment not found");
    }

    if (doc.locked && !isPrivilegedRole(req.user?.role)) {
      res.status(403);
      throw new Error("This assessment is currently locked by HR");
    }

    assessment = toGradingAssessment(doc);
    review = reviewByQuestionId(doc);
  } else {
    assessment = getAssessmentByCourseId(courseId);

    if (!assessment) {
      res.status(404);
      throw new Error("Assessment not found for this course");
    }

    await assertAssessmentNotLocked(req.user, assessment.courseId);
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

  if (priorAttempt) {
    res.status(409);
    throw new Error(
      "You have already submitted this assessment. Retakes are not allowed."
    );
  }

  const graded = gradeAssessment(assessment, answers);
  const gemsEarned = graded.score * GEMS_PER_CORRECT_ANSWER;

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
    isFirstAttempt: true,
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
      answers: result.answers.map((answer) => {
        const base = {
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect,
        };
        const extra = review?.[answer.questionId];
        return extra ? { ...base, ...extra } : base;
      }),
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
