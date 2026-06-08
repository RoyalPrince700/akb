export const getAllCourses = (courses) =>
  [...courses].sort((a, b) => a.order - b.order);

export const getCourseById = (courses, courseId) =>
  courses.find((course) => course.id === courseId);

export const getSortedChapters = (course) =>
  [...(course?.chapters || [])].sort((a, b) => a.order - b.order);

export const getChapterById = (course, chapterId) =>
  course?.chapters?.find((chapter) => chapter.id === chapterId);

export const getAdjacentChapters = (course, chapterId) => {
  const chapters = getSortedChapters(course);
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);

  return {
    previous: index > 0 ? chapters[index - 1] : null,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null,
  };
};
