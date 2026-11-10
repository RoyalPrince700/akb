import { useState } from "react";
import { X } from "lucide-react";
import {
  TASK_COMPLETION_ACCEPT,
  TASK_COMPLETION_MAX_BYTES,
  formatFileSize,
  primaryButton,
} from "../constants.js";

export default function CompleteTaskModal({ task, busy, onClose, onConfirm }) {
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(0);
  const [localError, setLocalError] = useState("");

  const handleFileChange = (event) => {
    const chosen = event.target.files?.[0] || null;
    setLocalError("");
    if (!chosen) {
      setFile(null);
      return;
    }
    if (chosen.size > TASK_COMPLETION_MAX_BYTES) {
      setLocalError("Choose a file 2MB or smaller.");
      setFile(null);
      setInputKey((current) => current + 1);
      return;
    }
    setFile(chosen);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Mark as done
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">{task?.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add a small photo or document as proof if you have one. Files stay under 2MB to save
              space.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <label className="mt-5 block" htmlFor="task-complete-file">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Attachment (optional)
          </span>
          <input
            key={inputKey}
            id="task-complete-file"
            type="file"
            accept={TASK_COMPLETION_ACCEPT}
            disabled={busy}
            onChange={handleFileChange}
            className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-800 hover:file:bg-violet-100"
          />
        </label>
        {file ? (
          <p className="mt-2 text-xs font-medium text-slate-700">
            Selected: {file.name} ({formatFileSize(file.size)})
          </p>
        ) : null}
        {localError ? <p className="mt-2 text-sm text-rose-600">{localError}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(file)}
            disabled={busy}
            className={primaryButton}
          >
            {busy ? "Completing..." : file ? "Complete with file" : "Complete without file"}
          </button>
        </div>
      </div>
    </div>
  );
};