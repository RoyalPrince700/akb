import { useRef } from "react";
import { LoaderCircle, MessagesSquare, Upload } from "lucide-react";
import {
  TASK_COMPLETION_ACCEPT,
  TASK_COMPLETION_MAX_FILES,
} from "../constants.js";
import { involves } from "../utils.js";

export const taskChatCount = (task) => (task?.chat || []).length;

export const taskAttachmentCount = (task) => (task?.completionAttachments || []).length;

export const TaskUploadButton = ({
  task,
  myId,
  onUpload,
  uploadingTaskId,
  compact = false,
}) => {
  const inputRef = useRef(null);
  if (!involves(task, myId)) {
    return null;
  }
  const count = taskAttachmentCount(task);
  const atLimit = count >= TASK_COMPLETION_MAX_FILES;
  const busy = uploadingTaskId === task._id;

  return (
    <div
      data-row-ignore
      className="inline-flex"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={TASK_COMPLETION_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const chosen = event.target.files?.[0];
          if (chosen) {
            onUpload(task, chosen);
          }
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={atLimit || busy}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (atLimit || busy || !inputRef.current) {
            return;
          }
          const input = inputRef.current;
          // Opening the picker fires a click that reaches the task row. Another
          // click is dispatched when the dialog closes. Swallow both.
          const swallow = (followUp) => {
            followUp.stopPropagation();
          };
          document.addEventListener("click", swallow, true);
          let released = false;
          const release = () => {
            if (released) {
              return;
            }
            released = true;
            window.setTimeout(() => {
              document.removeEventListener("click", swallow, true);
            }, 400);
          };
          input.addEventListener("change", release, { once: true });
          input.addEventListener("cancel", release, { once: true });
          window.addEventListener("focus", release, { once: true });
          window.setTimeout(release, 120000);
          input.click();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className={`relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? "h-8 w-8" : "h-9 w-9"
        }`}
        aria-label={
          atLimit
            ? "Maximum attachments reached"
            : count
              ? `Attach file, ${count} on this task`
              : "Attach image or document"
        }
        title={atLimit ? "Maximum 3 attachments" : "Attach image or document (max 2MB)"}
      >
        {busy ? (
          <LoaderCircle className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin`} />
        ) : (
          <Upload className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        )}
        {count > 0 && !busy && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
    </div>
  );
};

export const TaskChatButton = ({ task, myId, onOpenChat, compact = false }) => {
  if (!involves(task, myId)) {
    return null;
  }
  const count = taskChatCount(task);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpenChat(task);
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={`relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 ${
        compact ? "h-8 w-8" : "h-9 w-9"
      }`}
      aria-label={count ? `Team chat, ${count} messages` : "Open team chat"}
      title="Team chat"
    >
      <MessagesSquare className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold leading-none text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
};
