import aiForStaff from "./ai-for-staff";
import companyHistory from "./company-history";
import finance from "./finance";
import humanResourceManagement from "./human-resource-management";
import {
  getAdjacentChapters,
  getAllCourses,
  getChapterById,
  getCourseById,
  getSortedChapters,
} from "./utils";

const courseRegistry = [
  aiForStaff,
  companyHistory,
  finance,
  humanResourceManagement,
];

export const courses = getAllCourses(courseRegistry);

export { getAdjacentChapters, getChapterById, getCourseById, getSortedChapters };

export default courses;
