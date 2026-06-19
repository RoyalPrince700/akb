import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useMemo, useState } from "react";

import LockedAssessmentModal from "./LockedAssessmentModal";
import { useAuth } from "../context/AuthContext";
import { useAssessmentAccess } from "../hooks/useAssessmentAccess";
import courses, { getCourseById } from "../courses";

const AssessmentCourseAction = ({
  assessment,
}) => {
  const { user } = useAuth();
  const { canAccessCourses, canTakeAssessment, isReady, isStaff } =
    useAssessmentAccess(assessment.courseId);
  const [modalOpen, setModalOpen] = useState(false);
  const course = getCourseById(courses, assessment.courseId);
  const firstName = useMemo(() => {
    const rawFirstName = user?.name?.split(" ")[0] || "Staff";
    return (
      rawFirstName.charAt(0).toUpperCase() +
      rawFirstName.slice(1).toLowerCase()
    );
  }, [user?.name]);

  if (isStaff && !isReady) {
    return (
      <p className="mt-10 text-[13px] font-medium text-slate-500">
        Checking course progress…
      </p>
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

  if (isStaff) {
    return (
      <>
        <LockedAssessmentModal
          courseId={assessment.courseId}
          courseTitle={course?.title || "this course"}
          firstName={firstName}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />

        <div className="mt-10 space-y-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-[13px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
          >
            <Lock className="h-3.5 w-3.5" />
            Locked assessment
          </button>

          <p className="text-[13px] font-medium text-slate-500">
            Complete the course to unlock
          </p>
        </div>
      </>
    );
  }

  if (canAccessCourses) {
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
