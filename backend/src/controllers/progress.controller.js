const CourseProgress = require("../models/CourseProgress");
const User = require("../models/User");
const COURSE_CATALOG = require("../data/courses");
const { GEMS_PER_COURSE } = require("../constants/gems");
const asyncHandler = require("../utils/asyncHandler");
const {
  getCourseChapterIds,
  isCourseFullyComplete,
  isProgressRecordComplete,
} = require("../utils/courseCompletion");

const courseTitleById = Object.fromEntries(
  COURSE_CATALOG.map((course) => [course.id, course.title])
);

const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const required = getCourseChapterIds(courseId);

  if (!required) {
    res.status(404);
    throw new Error("Course not found");
  }

  const record = await CourseProgress.findOne({
    user: req.user._id,
    courseId,
  });

  const completedChapters = record?.completedChapters ?? [];

  res.json({
    courseId,
    completedChapters,
    courseCompleted: isCourseFullyComplete(courseId, completedChapters),
    gemsAwarded: record?.gemsAwarded ?? false,
    totalChapters: required.length,
  });
});

const completeChapter = asyncHandler(async (req, res) => {
  const { courseId, chapterId } = req.params;
  const required = getCourseChapterIds(courseId);

  if (!required) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (!required.includes(chapterId)) {
    res.status(400);
    throw new Error("Invalid chapter for this course");
  }

  let record = await CourseProgress.findOne({
    user: req.user._id,
    courseId,
  });

  if (!record) {
    record = await CourseProgress.create({
      user: req.user._id,
      courseId,
      completedChapters: [],
    });
  }

  if (!record.completedChapters.includes(chapterId)) {
    record.completedChapters.push(chapterId);
    await record.save();
  }

  const courseCompleted = isCourseFullyComplete(courseId, record.completedChapters);
  let gemsAwarded = false;
  let gemsEarned = 0;

  if (courseCompleted && !record.gemsAwarded) {
    const user = await User.findById(req.user._id);
    user.gems += GEMS_PER_COURSE;
    await user.save();

    record.gemsAwarded = true;
    await record.save();

    req.user.gems = user.gems;
    gemsAwarded = true;
    gemsEarned = GEMS_PER_COURSE;
  }

  const userRecord = await User.findById(req.user._id).select("gems");

  res.json({
    courseId,
    chapterId,
    completedChapters: record.completedChapters,
    courseCompleted,
    gemsAwarded,
    gemsEarned,
    totalGems: userRecord?.gems ?? 0,
    totalChapters: required.length,
  });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const staff = await User.find({
    role: "staff",
    isActive: { $ne: false },
  })
    .select("name department position gems staffId")
    .sort({ gems: -1, name: 1 })
    .lean();

  const leaderboard = staff.map((member, index) => ({
    rank: index + 1,
    id: member._id,
    name: member.name,
    department: member.department,
    position: member.position,
    staffId: member.staffId,
    gems: member.gems ?? 0,
  }));

  res.json({ leaderboard });
});

const getMyProgressSummary = asyncHandler(async (req, res) => {
  const records = await CourseProgress.find({ user: req.user._id });

  const recordByCourse = new Map(records.map((r) => [r.courseId, r]));

  const courseProgress = COURSE_CATALOG.map((course) => {
    const record = recordByCourse.get(course.id);
    const completedChapters = record?.completedChapters ?? [];
    const totalChapters = getCourseChapterIds(course.id)?.length ?? 0;

    return {
      courseId: course.id,
      title: course.title,
      completedChapters: completedChapters.length,
      totalChapters,
      courseCompleted: isCourseFullyComplete(course.id, completedChapters),
    };
  });

  const totalChaptersCompleted = courseProgress.reduce(
    (sum, course) => sum + course.completedChapters,
    0
  );
  const totalChapters = courseProgress.reduce(
    (sum, course) => sum + course.totalChapters,
    0
  );
  const coursesCompleted = courseProgress.filter(
    (course) => course.courseCompleted
  ).length;

  res.json({
    gems: req.user.gems ?? 0,
    coursesCompleted,
    totalCourses: COURSE_CATALOG.length,
    totalChaptersCompleted,
    totalChapters,
    courseProgress,
  });
});

const getStaffCompletions = asyncHandler(async (req, res) => {
  if (!["hr", "admin"].includes(req.user.role)) {
    res.status(403);
    throw new Error("You are not authorized to view course completions");
  }

  const isAdmin = req.user.role === "admin";
  const userFilter = isAdmin ? {} : { role: "staff" };

  const accounts = await User.find(userFilter)
    .select("name staffId department position gems role isActive")
    .sort({ name: 1 })
    .lean();

  const userIds = accounts.map((user) => user._id);
  const progressRecords = await CourseProgress.find({
    user: { $in: userIds },
  });

  const progressByUser = new Map();
  for (const record of progressRecords) {
    const uid = record.user.toString();
    if (!progressByUser.has(uid)) {
      progressByUser.set(uid, []);
    }
    progressByUser.get(uid).push(record);
  }

  const users = accounts.map((user) => {
    const records = progressByUser.get(user._id.toString()) || [];
    const completedCourses = records
      .filter(isProgressRecordComplete)
      .map((record) => ({
        courseId: record.courseId,
        title: courseTitleById[record.courseId] || record.courseId,
      }));

    return {
      id: user._id,
      name: user.name,
      staffId: user.staffId,
      department: user.department,
      position: user.position,
      role: user.role,
      isActive: user.isActive !== false,
      gems: user.gems ?? 0,
      completedCoursesCount: completedCourses.length,
      completedCourses,
    };
  });

  const totalCompletions = users.reduce(
    (sum, member) => sum + member.completedCoursesCount,
    0
  );

  res.json({
    totalCourses: COURSE_CATALOG.length,
    scope: isAdmin ? "all" : "staff",
    summary: {
      totalCompletions,
      usersWithCompletions: users.filter((m) => m.completedCoursesCount > 0)
        .length,
      totalUsers: users.length,
    },
    users,
  });
});

module.exports = {
  completeChapter,
  getCourseProgress,
  getLeaderboard,
  getMyProgressSummary,
  getStaffCompletions,
};
