import aiForStaff from "./ai-for-staff";
import companyHistory from "./company-history";
import finance from "./finance";
import {
  getAdjacentChapters,
  getAllCourses,
  getChapterById,
  getCourseById,
  getSortedChapters,
} from "./utils";

const courseRegistry = [aiForStaff, companyHistory, finance];

export const courses = getAllCourses(courseRegistry);

export { getAdjacentChapters, getChapterById, getCourseById, getSortedChapters };

export default courses;
