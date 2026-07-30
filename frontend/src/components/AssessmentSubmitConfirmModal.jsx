import { AlertTriangle, X } from "lucide-react";

const AssessmentSubmitConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  unansweredCount = 0,
  submitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_28px_70px_rgba(15,23,42,0.18)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-br from-amber-100/70 via-white to-white" />
        <div className="relative">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <AlertTriangle className="h-[18px] w-[18px] stroke-[1.8]" />
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-950">
            Submit assessment?
          </h2>

          <div className="mb-6 space-y-4 text-slate-700">
            <p className="leading-relaxed">
              You are about to submit your answers.{" "}
              <strong>You cannot retake this assessment</strong> after
              submitting.
            </p>

            {unansweredCount > 0 && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm text-amber-900">
                You have {unansweredCount} unanswered question
                {unansweredCount === 1 ? "" : "s"}. Unanswered questions count
                as incorrect.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Confirm submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSubmitConfirmModal;
