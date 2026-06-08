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
      <p className="mt-4 text-sm text-slate-500">Checking course progress…</p>
    );
  }

  if (canTakeAssessment) {
    return (
      <Link
        to={`/courses/${assessment.courseId}/assessment`}
        className="mt-4 inline-flex w-fit rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
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

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <Lock className="h-4 w-4" />
            Locked assessment
          </button>

          <p className="text-sm font-medium text-slate-600">
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
        className="mt-4 inline-flex w-fit rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
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
      className="mt-4 inline-flex w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Sign in to take
    </Link>
  );
};

export default AssessmentCourseAction;
