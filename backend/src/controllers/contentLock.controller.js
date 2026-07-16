const ContentLock = require("../models/ContentLock");
const COURSE_CATALOG = require("../data/courses");
const { assessments } = require("../data/assessments");
const asyncHandler = require("../utils/asyncHandler");
const { getLockForCourse } = require("../utils/contentLocks");

const assessmentTitleByCourseId = Object.fromEntries(
  assessments.map((assessment) => [assessment.courseId, assessment.title])
);

const toLockResponse = (course, lock = {}) => ({
  courseId: course.id,
  courseTitle: course.title,
  category: course.category,
  hasAssessment: Boolean(assessmentTitleByCourseId[course.id]),
  assessmentTitle: assessmentTitleByCourseId[course.id] || null,
  courseLocked: Boolean(lock.courseLocked),
  assessmentLocked: Boolean(lock.assessmentLocked),
  updatedAt: lock.updatedAt || null,
});

const listContentLocks = asyncHandler(async (req, res) => {
  const locks = await ContentLock.find({
    courseId: { $in: COURSE_CATALOG.map((course) => course.id) },
  }).lean();

  const lockByCourseId = Object.fromEntries(
    locks.map((lock) => [lock.courseId, lock])
  );

  res.json({
    locks: COURSE_CATALOG.map((course) =>
      toLockResponse(course, lockByCourseId[course.id])
    ),
  });
});

const getContentLock = asyncHandler(async (req, res) => {
  const course = COURSE_CATALOG.find((item) => item.id === req.params.courseId);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const lock = await getLockForCourse(course.id);
  const record = await ContentLock.findOne({ courseId: course.id }).lean();

  res.json({
    lock: toLockResponse(course, {
      ...lock,
      updatedAt: record?.updatedAt,
    }),
  });
});

const updateContentLock = asyncHandler(async (req, res) => {
  const course = COURSE_CATALOG.find((item) => item.id === req.params.courseId);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const { courseLocked, assessmentLocked } = req.body;
  const updates = { updatedBy: req.user._id };

  if (typeof courseLocked === "boolean") {
    updates.courseLocked = courseLocked;
  }

  if (typeof assessmentLocked === "boolean") {
    if (!assessmentTitleByCourseId[course.id] && assessmentLocked) {
      res.status(400);
      throw new Error("This course does not have an assessment");
    }
    updates.assessmentLocked = assessmentLocked;
  }

  if (
    typeof courseLocked !== "boolean" &&
    typeof assessmentLocked !== "boolean"
  ) {
    res.status(400);
    throw new Error("Provide courseLocked and/or assessmentLocked");
  }

  const lock = await ContentLock.findOneAndUpdate(
    { courseId: course.id },
    { $set: updates, $setOnInsert: { courseId: course.id } },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({
    lock: toLockResponse(course, lock),
  });
});

module.exports = {
  getContentLock,
  listContentLocks,
  updateContentLock,
};
