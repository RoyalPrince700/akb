import { AlertTriangle, Clock, Trophy, X } from "lucide-react";

const AssessmentStartWarningModal = ({ isOpen, onConfirm, onCancel, assessmentTitle, timeLimitMinutes }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mb-3 text-2xl font-bold text-slate-950">Ready to begin?</h2>

        <div className="mb-6 space-y-4 text-slate-700">
          <p className="leading-relaxed">
            You are about to start the <strong>{assessmentTitle}</strong> assessment.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <div className="mb-3 flex items-center gap-2 font-semibold text-amber-900">
              <Clock className="h-4 w-4" /> Important rules:
            </div>
            <ul className="space-y-2 text-amber-800">
              <li>• The timer starts immediately after you click "Start Test".</li>
              <li>• <strong>You cannot pause or cancel</strong> once the test begins.</li>
              <li>• The test will auto-submit when time runs out.</li>
              <li>• Your score is recorded only on your <strong>first attempt</strong>.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <Trophy className="h-4 w-4 shrink-0" />
            <span>
              You have <strong>{timeLimitMinutes} minutes</strong> to complete all questions.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            I'm not ready yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            I'm ready, start the test
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentStartWarningModal;
