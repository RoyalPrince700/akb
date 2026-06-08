import courses, { getCourseById, getSortedChapters } from "../courses";

export const getChapterIdsForCourse = (courseId) => {
  const course = getCourseById(courses, courseId);
  return getSortedChapters(course).map((chapter) => chapter.id);
};

export const isCourseFullyComplete = (courseId, completedChapters) => {
  const required = getChapterIdsForCourse(courseId);
  if (!required.length) {
    return false;
  }
  return required.every((id) => completedChapters.includes(id));
};
