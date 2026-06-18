import aiForStaff from "./ai-for-staff";
import companyHistory from "./company-history";
import conflictResolution from "./conflict-resolution";
import criticalThinking from "./critical-thinking";
import customerService from "./customer-service";
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
  conflictResolution,
  criticalThinking,
  customerService,
  finance,
  humanResourceManagement,
];

export const courses = getAllCourses(courseRegistry);

export { getAdjacentChapters, getChapterById, getCourseById, getSortedChapters };

export default courses;
