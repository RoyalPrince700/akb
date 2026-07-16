import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useAssessmentAccess } from "../hooks/useAssessmentAccess";
import LockedAssessmentModal from "./LockedAssessmentModal";
import courses, { getCourseById } from "../courses";

const AssessmentCourseAction = ({ assessment }) => {
  const { user } = useAuth();
  const { canTakeAssessment, assessmentLockedByHr, isReady } =
    useAssessmentAccess(assessment.courseId);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const course = getCourseById(courses, assessment.courseId);
  const rawFirstName = user?.name?.split(" ")[0] || "Staff";
  const firstName =
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  if (!isReady) {
    return (
      <span className="mt-10 inline-flex h-9 w-fit items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-[13px] font-semibold text-slate-500">
        Checking access...
      </span>
    );
  }

  if (assessmentLockedByHr) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowLockedModal(true)}
          className="mt-10 inline-flex h-9 w-fit items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3.5 text-[13px] font-semibold text-red-700 transition hover:bg-red-100"
        >
          Locked by HR
        </button>
        <LockedAssessmentModal
          courseId={assessment.courseId}
          courseTitle={course?.title || assessment.title}
          firstName={firstName}
          isOpen={showLockedModal}
          onClose={() => setShowLockedModal(false)}
          reason="hr-lock"
        />
      </>
    );
  }

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
