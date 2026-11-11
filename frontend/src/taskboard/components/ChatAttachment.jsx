import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Download, FileText, LoaderCircle, Paperclip, Send, X } from "lucide-react";
import {
  TASK_COMPLETION_ACCEPT,
  TASK_COMPLETION_MAX_BYTES,
  formatFileSize,
  isImageCompletionFile,
  isPdfCompletionFile,
} from "../constants.js";

export const isDeletedChatMessage = (message) =>
  Boolean(message?.deletedAt || message?.deletedKind);

export const deletedChatLabel = (message) =>
  message?.deletedKind === "media" ? "Media deleted" : "This has been deleted";

export const chatPreviewText = (message) => {
  if (isDeletedChatMessage(message)) {
    return deletedChatLabel(message);
  }
  if (message?.body) {
    return message.body;
  }
  if (message?.attachment) {
    return isImageCompletionFile(message.attachment)
      ? "Photo"
      : message.attachment.originalName || "Document";
  }
  return "";
};

export const chatReplyTarget = (message) => {
  const preview = chatPreviewText(message);
  return {
    messageId: String(message?._id || ""),
    authorName: message?.author?.name || "Someone",
    preview: preview.length > 140 ? `${preview.slice(0, 140).trim()}…` : preview,
  };
};

export const chatCopyText = (message) => {
  const body = String(message?.body || "").trim();
  if (body) {
    return body;
  }
  return String(message?.attachment?.url || "");
};

export const ChatReplyQuote = ({ reply, mine = false }) => {
  if (!reply?.preview) {
    return null;
  }
  return (
    <div
      className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 ${
        mine
          ? "border-white/80 bg-white/15"
          : "border-violet-400 bg-violet-50 dark:border-violet-300 dark:bg-violet-500/15"
      }`}
    >
      <p className={`text-[10px] font-semibold ${mine ? "text-white" : "text-violet-700 dark:text-violet-200"}`}>
        {reply.authorName || "Someone"}
      </p>
      <p className={`truncate text-xs ${mine ? "text-violet-100" : "text-slate-500 dark:text-slate-300"}`}>
        {reply.preview}
      </p>
    </div>
  );
};

export const ChatMessageMenu = ({ mine = false, image = false, copyText = "", busy = false, onReply, onDelete }) => {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const imageOnly = Boolean(image);
  const canDelete = Boolean(mine);
  const canReply = !imageOnly;
  const canCopy = !imageOnly && Boolean(copyText);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!canDelete && !canReply && !canCopy) {
    return null;
  }

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const width = 168;
    const itemCount = Number(canReply) + Number(canCopy) + Number(canDelete);
    const height = 16 + itemCount * 36;
    let left = mine ? rect.right - width : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - height - 6);
    }
    setConfirming(false);
    setMenuPos({ top, left });
    setOpen(true);
  };

  const copyMessage = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else {
        const field = document.createElement("textarea");
        field.value = copyText;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.left = "-9999px";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      setCopied(true);
      close();
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={open ? close : openMenu}
        disabled={busy}
        className={`absolute top-2 right-2 z-10 transition ${
          mine
            ? "text-violet-100 hover:text-white"
            : "text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        aria-label="Message options"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && menuPos
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[70] cursor-default"
                aria-label="Close message options"
                onClick={close}
              />
              <div
                role="menu"
                className="fixed z-[71] w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-800"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                {confirming ? (
                  <div className="px-2 py-1.5">
                    <p className="px-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Delete this message?
                    </p>
                    <div className="mt-1.5 flex gap-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          close();
                          onDelete?.();
                        }}
                        className="flex-1 rounded-lg bg-rose-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setConfirming(false)}
                        className="flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {canReply ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          close();
                          onReply?.();
                        }}
                        className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        Reply
                      </button>
                    ) : null}
                    {canCopy ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={copyMessage}
                        className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setConfirming(true)}
                        className="block w-full px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
};

export const downloadRemoteFile = async (url, filename) => {
  const name =
    String(filename || "download")
      .replace(/[/\\?%*:|"<>]/g, "_")
      .slice(0, 180)
      .trim() || "download";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not download the file");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
};

export const ExpandableImage = ({ src, name, className, frameClassName = "" }) => {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block ${frameClassName}`}
        aria-label={`View ${name || "photo"}`}
      >
        <img src={src} alt={name || "Photo"} className={className} />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-6"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div className="relative" onClick={(event) => event.stopPropagation()}>
            <img
              src={src}
              alt={name || "Photo"}
              className="max-h-[78vh] max-w-[min(92vw,40rem)] rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              disabled={downloading}
              onClick={async () => {
                setDownloadFailed(false);
                setDownloading(true);
                try {
                  await downloadRemoteFile(src, name);
                } catch {
                  setDownloadFailed(true);
                } finally {
                  setDownloading(false);
                }
              }}
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-slate-950 disabled:opacity-60"
              aria-label="Download image"
              title={downloadFailed ? "Couldn't download this image" : "Download"}
            >
              {downloading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export const ChatAttachmentView = ({ attachment, mine = false }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!attachment?.url) {
    return null;
  }
  const image = isImageCompletionFile(attachment);
  const pdf = isPdfCompletionFile(attachment);

  if (image) {
    return (
      <ExpandableImage
        src={attachment.url}
        name={attachment.originalName}
        frameClassName="mb-1.5 w-full"
        className="max-h-52 w-full rounded-xl object-cover"
      />
    );
  }

  const saveFile = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadRemoteFile(attachment.url, attachment.originalName);
    } catch {
      setDownloadError("Couldn't download this file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={saveFile}
      disabled={downloading}
      title="Download"
      className={`mb-1.5 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left disabled:opacity-70 ${
        mine ? "bg-white/15 text-white" : "bg-slate-100 text-slate-800"
      }`}
    >
      {downloading ? (
        <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 shrink-0" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {attachment.originalName || "Document"}
        </span>
        <span className={`block text-[10px] ${mine ? "text-violet-100" : "text-slate-500"}`}>
          {downloadError || `${formatFileSize(attachment.size)}${pdf ? " · PDF" : ""}`}
        </span>
      </span>
      <Download className="ml-auto h-3.5 w-3.5 shrink-0 opacity-70" />
    </button>
  );
};

export const ChatComposer = ({
  inputId,
  value,
  onChange,
  onSubmit,
  sending,
  placeholder,
  file,
  onFile,
  allowFiles = false,
  fileError = "",
  reply = null,
  onCancelReply,
}) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!file || !file.type?.startsWith("image/")) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = "";
    if (!chosen) {
      return;
    }
    if (chosen.size > TASK_COMPLETION_MAX_BYTES) {
      onFile(null, "Choose a file 2MB or smaller.");
      return;
    }
    onFile(chosen, "");
  };

  useEffect(() => {
    if (!reply?.preview) {
      return;
    }
    document.getElementById(inputId)?.focus();
  }, [reply, inputId]);

  return (
    <form onSubmit={onSubmit} className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      {reply?.preview ? (
        <div className="mb-2 flex items-start gap-2 rounded-2xl border-l-2 border-violet-500 bg-violet-50 px-3 py-2 dark:bg-violet-500/15">
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-violet-700 dark:text-violet-200">
              Reply to {reply.authorName || "Someone"}
            </span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-300">{reply.preview}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      {file ? (
        <div className="mb-2 flex items-center gap-2 rounded-2xl bg-slate-50 px-2.5 py-2">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500">
              <FileText className="h-4 w-4" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => onFile(null, "")}
            className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-700"
            aria-label="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      {fileError ? <p className="mb-2 text-xs text-rose-600">{fileError}</p> : null}
      <div className="flex items-end gap-2">
        {allowFiles ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={TASK_COMPLETION_ACCEPT}
              className="sr-only"
              onChange={pickFile}
            />
            <button
              type="button"
              disabled={sending}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-50"
              aria-label="Attach image or document"
              title="Attach image or document (max 2MB)"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </>
        ) : null}
        <label className="sr-only" htmlFor={inputId}>
          Write a message
        </label>
        <textarea
          id={inputId}
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit(event);
            }
          }}
          disabled={sending}
          placeholder={placeholder}
          className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="submit"
          disabled={sending || (!value.trim() && !file)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition hover:bg-violet-700 disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
};
