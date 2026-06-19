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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05),0_28px_70px_rgba(15,23,42,0.18)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-br from-slate-100 via-white to-white" />
        <div className="relative">
        <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <Lock className="h-[18px] w-[18px] stroke-[1.8]" />
        </div>
        <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-950">
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
            className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition-colors hover:bg-violet-700"
          >
            Go to course
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-slate-300 hover:bg-white"
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LockedAssessmentModal;
