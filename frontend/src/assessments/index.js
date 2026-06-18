import aiAssessment from "./ai-for-staff";
import companyHistoryAssessment from "./company-history";
import conflictResolutionAssessment from "./conflict-resolution";
import criticalThinkingAssessment from "./critical-thinking";
import customerServiceAssessment from "./customer-service";
import financeAssessment from "./finance";
import hrmAssessment from "./human-resource-management";
import { getAssessmentByCourseId } from "./utils";

const assessmentRegistry = [
  aiAssessment,
  companyHistoryAssessment,
  conflictResolutionAssessment,
  criticalThinkingAssessment,
  customerServiceAssessment,
  financeAssessment,
  hrmAssessment,
];

export const assessments = assessmentRegistry;

export { getAssessmentByCourseId };

export default assessments;
