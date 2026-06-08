import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

const LockedAssessmentModal = ({
  courseId,
  courseTitle,
  firstName,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <Lock className="h-10 w-10 text-slate-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-950">
          Hold on, {firstName}!
        </h2>
        <p className="mb-6 leading-relaxed text-slate-600">
          This assessment is locked because you have not completed the{" "}
          <strong className="text-slate-800">{courseTitle}</strong> course yet.
          Finish all chapters in that course to unlock the assessment.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to={`/courses/${courseId}`}
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-full bg-blue-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Go to course
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockedAssessmentModal;
