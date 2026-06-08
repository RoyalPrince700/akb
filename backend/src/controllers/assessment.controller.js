const {
  assessments,
  getAssessmentByCourseId,
} = require("../data/assessments");
const CourseProgress = require("../models/CourseProgress");
const Result = require("../models/Result");
const asyncHandler = require("../utils/asyncHandler");
const { isCourseFullyComplete } = require("../utils/courseCompletion");
const gradeAssessment = require("../utils/gradeAssessment");

const assertStaffCompletedCourse = async (user, courseId, res) => {
  if (user.role !== "staff") {
    return;
  }

  const record = await CourseProgress.findOne({
    user: user._id,
    courseId,
  });
  const completedChapters = record?.completedChapters ?? [];

  if (!isCourseFullyComplete(courseId, completedChapters)) {
    res.status(403);
    throw new Error(
      "Complete all chapters in this course before taking the assessment"
    );
  }
};

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

  if (!answers || typeof answers !== "object") {
    res.status(400);
    throw new Error("Answers are required");
  }

  await assertStaffCompletedCourse(req.user, assessment.courseId, res);

  const graded = gradeAssessment(assessment, answers);

  const result = await Result.create({
    user: req.user._id,
    courseId: assessment.courseId,
    assessmentTitle: assessment.title,
    answers: graded.answers,
    score: graded.score,
    totalQuestions: graded.totalQuestions,
    percentage: graded.percentage,
    passed: graded.passed,
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
    },
  });
});

module.exports = {
  listAssessments,
  submitAssessment,
};
