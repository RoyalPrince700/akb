import { Link } from "react-router-dom";

import { useAssessmentAccess } from "../hooks/useAssessmentAccess";

const AssessmentCourseAction = ({ assessment }) => {
  const { canTakeAssessment } = useAssessmentAccess(assessment.courseId);

  if (canTakeAssessment) {
    return (
      <Link
        to={`/courses/${assessment.courseId}/assessment`}
        className="mt-10 inline-flex h-9 w-fit items-center justify-center rounded-xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700"
      >
        Take assessment
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      state={{
        from: {
          pathname: `/courses/${assessment.courseId}/assessment`,
        },
      }}
      className="mt-10 inline-flex h-9 w-fit items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-[13px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
    >
      Sign in to take
    </Link>
  );
};

export default AssessmentCourseAction;
