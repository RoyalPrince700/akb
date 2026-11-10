import { LoaderCircle, X } from "lucide-react";
import { primaryButton } from "../constants.js";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  tone = "danger",
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  const confirmClass =
    tone === "danger"
      ? "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(225,29,72,0.25)] transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      : primaryButton;

  const labelClass =
    tone === "danger"
      ? "text-xs font-semibold uppercase tracking-[0.16em] text-rose-600"
      : "text-xs font-semibold uppercase tracking-[0.16em] text-violet-600";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close dialog"
        disabled={busy}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={labelClass}>Confirm</p>
            <h2
              id="confirm-modal-title"
              className="mt-1 text-lg font-bold tracking-tight text-slate-950"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={confirmClass}>
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
