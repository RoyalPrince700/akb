import aiAssessment from "./ai-for-staff";
import companyHistoryAssessment from "./company-history";
import conflictResolutionAssessment from "./conflict-resolution";
import consultativeSellingAssessment from "./consultative-selling";
import criticalThinkingAssessment from "./critical-thinking";
import cultureOfExcellenceAssessment from "./culture-of-excellence";
import customerServiceAssessment from "./customer-service";
import digitalTransformationAssessment from "./digital-transformation";
import financeAssessment from "./finance";
import hrmAssessment from "./human-resource-management";
import solutionSellingAssessment from "./solution-selling";
import { getAssessmentByCourseId } from "./utils";

const assessmentRegistry = [
  aiAssessment,
  companyHistoryAssessment,
  conflictResolutionAssessment,
  consultativeSellingAssessment,
  criticalThinkingAssessment,
  cultureOfExcellenceAssessment,
  customerServiceAssessment,
  digitalTransformationAssessment,
  financeAssessment,
  hrmAssessment,
  solutionSellingAssessment,
];

export const assessments = assessmentRegistry;

export { getAssessmentByCourseId };

export default assessments;
