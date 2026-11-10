export const TASK_COMPLETION_MAX_BYTES = 2 * 1024 * 1024;
export const TASK_COMPLETION_MAX_FILES = 3;
export const TASK_COMPLETION_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf,.doc,.docx,text/plain";

export const formatFileSize = (bytes) => {
  if (!bytes) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
};

export const isImageCompletionFile = (item) =>
  String(item?.mimeType || "").startsWith("image/") || item?.resourceType === "image";

export const isPdfCompletionFile = (item) => {
  const mime = String(item?.mimeType || "").toLowerCase();
  const name = String(item?.originalName || "").toLowerCase();
  return mime === "application/pdf" || name.endsWith(".pdf");
};

export const COLUMNS = [
  {
    id: "todo",
    label: "To do",
    hint: "Not started yet",
    dot: "bg-violet-400",
    wash: "bg-violet-50",
    soft: "bg-violet-100 text-violet-700",
    text: "text-violet-700",
    ring: "ring-violet-300",
    bar: "bg-violet-400",
    accent: "border-l-violet-400",
  },
  {
    id: "in_progress",
    label: "In progress",
    hint: "Being worked on",
    dot: "bg-sky-400",
    wash: "bg-sky-50",
    soft: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    ring: "ring-sky-300",
    bar: "bg-sky-400",
    accent: "border-l-sky-400",
  },
  {
    id: "review",
    label: "In review",
    hint: "Ready for a look",
    dot: "bg-amber-400",
    wash: "bg-amber-50",
    soft: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    ring: "ring-amber-300",
    bar: "bg-amber-400",
    accent: "border-l-amber-400",
  },
  {
    id: "done",
    label: "Done",
    hint: "Finished",
    dot: "bg-emerald-400",
    wash: "bg-emerald-50",
    soft: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    ring: "ring-emerald-300",
    bar: "bg-emerald-400",
    accent: "border-l-emerald-400",
  },
];

export const columnFor = (status) => COLUMNS.find((column) => column.id === status) || COLUMNS[0];

export const PRIORITIES = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

export const PRIORITY_STYLES = {
  low: { chip: "bg-slate-100 text-slate-600", flag: "text-slate-400" },
  medium: { chip: "bg-sky-100 text-sky-700", flag: "text-sky-500" },
  high: { chip: "bg-orange-100 text-orange-700", flag: "text-orange-500" },
  urgent: { chip: "bg-rose-100 text-rose-700", flag: "text-rose-500" },
};

export const AVATAR_SIZES = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-[4.5rem] w-[4.5rem]",
};

export const SIDEBAR_KEY = "taskboard-sidebar-collapsed";
export const LAYOUT_KEY = "taskboard-layout";
export const THEME_KEY = "taskboard-theme";

export const readStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export const primaryButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60";
