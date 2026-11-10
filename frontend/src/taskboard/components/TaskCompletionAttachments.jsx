import { ExternalLink, FileText, LoaderCircle, Paperclip, Trash2 } from "lucide-react";
import {
  TASK_COMPLETION_ACCEPT,
  TASK_COMPLETION_MAX_FILES,
  formatFileSize,
  isImageCompletionFile,
  isPdfCompletionFile,
} from "../constants.js";
import { ExpandableImage } from "./ChatAttachment.jsx";

export default function TaskCompletionAttachments({
  task,
  canUpload,
  uploading,
  inputKey,
  onPickFile,
  deletingAttachmentId,
  onDeleteAttachment,
}) {
  const items = task?.completionAttachments || [];
  const atLimit = items.length >= TASK_COMPLETION_MAX_FILES;

  return (
    <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-800">
        <Paperclip className="h-3.5 w-3.5" />
        Attachments
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">
        Images or documents for this task (max 2MB each, up to {TASK_COMPLETION_MAX_FILES}).
      </p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item._id || item.url}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100"
            >
              {isImageCompletionFile(item) ? (
                <ExpandableImage
                  src={item.url}
                  name={item.originalName}
                  className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-100"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <FileText className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.originalName || "Attachment"}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(item.size)}
                  {item.uploadedBy?.name ? ` · ${item.uploadedBy.name}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {isImageCompletionFile(item) ? null : (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={isPdfCompletionFile(item) ? undefined : item.originalName || true}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  {isPdfCompletionFile(item) ? "Open" : "Download"}
                  <ExternalLink className="h-3 w-3" />
                </a>
                )}
                {canUpload ? (
                  <button
                    type="button"
                    disabled={Boolean(deletingAttachmentId)}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteAttachment?.(item);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    aria-label={`Remove ${item.originalName || "attachment"}`}
                    title="Remove file"
                  >
                    {deletingAttachmentId === String(item._id) ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No files attached yet.</p>
      )}
      {canUpload && !atLimit ? (
        <label className="mt-3 block" htmlFor="task-detail-completion-file">
          <input
            key={inputKey}
            id="task-detail-completion-file"
            type="file"
            accept={TASK_COMPLETION_ACCEPT}
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (chosen) {
                onPickFile(chosen);
              }
              event.target.value = "";
            }}
          />
          <span
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {uploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Add image or document"}
          </span>
        </label>
      ) : null}
      {atLimit ? (
        <p className="mt-2 text-xs text-slate-500">This task already has the maximum number of files.</p>
      ) : null}
    </div>
  );
};