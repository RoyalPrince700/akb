import aiAssessment from "./ai-for-staff";
import companyHistoryAssessment from "./company-history";
import financeAssessment from "./finance";
import { getAssessmentByCourseId } from "./utils";

const assessmentRegistry = [
  aiAssessment,
  financeAssessment,
  companyHistoryAssessment,
];

export const assessments = assessmentRegistry;

export { getAssessmentByCourseId };

export default assessments;
