const COURSE_CHAPTERS = require("../data/courseChapters");

const getCourseChapterIds = (courseId) => COURSE_CHAPTERS[courseId] || null;

const isCourseFullyComplete = (courseId, completedChapters) => {
  const required = getCourseChapterIds(courseId);
  if (!required) return false;
  return required.every((id) => completedChapters.includes(id));
};

const isProgressRecordComplete = (record) => {
  if (!record) return false;
  if (record.gemsAwarded) return true;
  return isCourseFullyComplete(record.courseId, record.completedChapters);
};

module.exports = {
  getCourseChapterIds,
  isCourseFullyComplete,
  isProgressRecordComplete,
};
