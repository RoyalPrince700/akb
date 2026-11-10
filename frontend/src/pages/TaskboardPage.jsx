import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Flag,
  LayoutGrid,
  List,
  ListTodo,
  LoaderCircle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  MessageSquare,
  MessagesSquare,
  Search,
  Send,
  Sparkles,
  Sun,
  Moon,
  Paperclip,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";
import TaskboardChatHub from "../components/TaskboardChatHub";
import { useAuth } from "../context/AuthContext";
import {
  createDailyTodo,
  createTask,
  deleteDailyTodo,
  deleteTask,
  listDailyTodos,
  listStaffChatMessages,
  listStaffConversations,
  listTaskChat,
  listTaskPeople,
  listTasks,
  openStaffConversation,
  sendStaffChatMessage,
  sendTaskChatMessage,
  updateDailyTodo,
  updateProfile,
  updateTask,
  uploadTaskCompletionFile,
} from "../services/api";
import { connectRealtime } from "../services/realtime";
import { AVATARS, avatarIdFor, avatarSrcFor } from "../utils/avatars";
import {
  NOTIFICATIONS_RETURN_KEY,
  requestOpenNotifications,
} from "../utils/notifications";

const TASK_COMPLETION_MAX_BYTES = 2 * 1024 * 1024;
const TASK_COMPLETION_MAX_FILES = 3;
const TASK_COMPLETION_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf,.doc,.docx,text/plain";

const formatFileSize = (bytes) => {
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

const isImageCompletionFile = (item) =>
  String(item?.mimeType || "").startsWith("image/") || item?.resourceType === "image";

const isPdfCompletionFile = (item) => {
  const mime = String(item?.mimeType || "").toLowerCase();
  const name = String(item?.originalName || "").toLowerCase();
  return mime === "application/pdf" || name.endsWith(".pdf");
};

const COLUMNS = [
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

const columnFor = (status) => COLUMNS.find((column) => column.id === status) || COLUMNS[0];

const PRIORITIES = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

const PRIORITY_STYLES = {
  low: { chip: "bg-slate-100 text-slate-600", flag: "text-slate-400" },
  medium: { chip: "bg-sky-100 text-sky-700", flag: "text-sky-500" },
  high: { chip: "bg-orange-100 text-orange-700", flag: "text-orange-500" },
  urgent: { chip: "bg-rose-100 text-rose-700", flag: "text-rose-500" },
};

const AVATAR_SIZES = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-[4.5rem] w-[4.5rem]",
};

const SIDEBAR_KEY = "taskboard-sidebar-collapsed";
const LAYOUT_KEY = "taskboard-layout";
const THEME_KEY = "taskboard-theme";

const readStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const primaryButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60";

const personId = (person) => {
  if (person == null || person === "") {
    return "";
  }
  if (typeof person === "string" || typeof person === "number") {
    return String(person);
  }
  return personId(person._id || person.id || "");
};

const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const shiftDateKey = (key, days) => {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const monthText = String(date.getMonth() + 1).padStart(2, "0");
  const dayText = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${monthText}-${dayText}`;
};

const boardDateOf = (task) => {
  const explicit = String(task?.boardDate || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit)) {
    return explicit;
  }
  if (!task?.createdAt) {
    return "";
  }
  const created = new Date(task.createdAt);
  if (Number.isNaN(created.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(created);
};

const formatDayLabel = (key) => {
  const [year, month, day] = String(key).split("-").map(Number);
  if (!year || !month || !day) {
    return key;
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const formatShortDate = (key) => {
  const [year, month, day] = String(key || "").split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const formatStamp = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDuration = (ms) => {
  const minutes = Math.round(Number(ms) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "";
  }
  if (minutes < 1) {
    return "Less than a minute";
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 48) {
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const hourRest = hours % 24;
  return hourRest ? `${days}d ${hourRest}h` : `${days}d`;
};

const taskDurationMs = (task) => {
  if (task?.status !== "done") {
    return null;
  }
  if (typeof task.durationMs === "number") {
    return task.durationMs;
  }
  if (!task?.createdAt || !task?.completedAt) {
    return null;
  }
  const start = new Date(task.createdAt).getTime();
  const end = new Date(task.completedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, end - start);
};

const firstName = (name) => String(name || "").trim().split(/\s+/)[0] || "there";

const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const involves = (task, id) => {
  if (!id) {
    return false;
  }
  if (personId(task.owner) === id || personId(task.createdBy) === id) {
    return true;
  }
  return (task.assignees || []).some((person) => personId(person) === id);
};

const canManageTask = (task, id) =>
  personId(task?.owner) === id || personId(task?.createdBy) === id;

const taskRelation = (task, id) => {
  if (!id || !task) {
    return null;
  }
  if (personId(task.createdBy) === id) {
    return "created";
  }
  if (personId(task.owner) === id) {
    return "assigned";
  }
  if ((task.assignees || []).some((person) => personId(person) === id)) {
    return "assigned";
  }
  return null;
};

const RELATION_STYLES = {
  created: { chip: "bg-violet-100 text-violet-700", label: "Created by you" },
  assigned: { chip: "bg-sky-100 text-sky-700", label: "Assigned to you" },
};

const emptyDraft = (status, ownerId) => ({
  title: "",
  description: "",
  status: status || "todo",
  priority: "medium",
  dueDate: "",
  owner: ownerId || "",
  assignees: [],
});

const taskToDraft = (task) => ({
  title: task.title || "",
  description: task.description || "",
  status: task.status || "todo",
  priority: task.priority || "medium",
  dueDate: task.dueDate || "",
  owner: personId(task.owner),
  assignees: (task.assignees || []).map(personId).filter(Boolean),
});

const Avatar = ({ person, size = "sm", className = "", style }) => (
  <img
    src={avatarSrcFor(person)}
    alt={person?.name || "Staff"}
    title={person?.name || ""}
    draggable={false}
    style={style}
    className={`shrink-0 rounded-full bg-slate-100 object-cover ring-2 ring-white shadow-[0_0_0_1px_rgba(15,23,42,0.04)] ${AVATAR_SIZES[size]} ${className}`}
  />
);

const AvatarStack = ({ people = [], max = 3, size = "sm", emptyLabel = "Unassigned" }) => {
  const list = (people || []).filter(Boolean);
  if (!list.length) {
    return <span className="text-xs font-medium text-slate-300">{emptyLabel}</span>;
  }
  const shown = list.slice(0, max);
  const extra = list.length - shown.length;
  const overlap = size === "md" || size === "lg" ? -12 : -10;
  return (
    <div className="flex items-center" title={list.map((person) => person.name).join(", ")}>
      {shown.map((person, index) => (
        <Avatar
          key={personId(person)}
          person={person}
          size={size}
          className="transition hover:z-20 hover:scale-110"
          style={{ marginLeft: index === 0 ? 0 : overlap, zIndex: shown.length - index }}
        />
      ))}
      {extra > 0 && (
        <span
          style={{ marginLeft: overlap, zIndex: 0 }}
          className={`relative inline-flex items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white ring-2 ring-white ${AVATAR_SIZES[size]}`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
};

const TeamStrip = ({ people, meId, onChangeMine }) => {
  const list = (people || []).slice(0, 10);
  const extra = Math.max(0, (people || []).length - list.length);
  if (!list.length) {
    return null;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Team
      </span>
      <div className="flex items-center">
        {list.map((person, index) => {
          const mine = personId(person) === meId;
          return (
            <button
              key={personId(person)}
              type="button"
              onClick={mine ? onChangeMine : undefined}
              title={mine ? "Change your avatar" : person.name}
              className={`rounded-full ${mine ? "cursor-pointer" : "cursor-default"}`}
              style={{ marginLeft: index === 0 ? 0 : -10, zIndex: list.length - index }}
            >
              <Avatar
                person={person}
                size="sm"
                className={mine ? "ring-2 ring-violet-400" : ""}
              />
            </button>
          );
        })}
        {extra > 0 && (
          <span
            style={{ marginLeft: -10 }}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-500 ring-2 ring-white"
          >
            +{extra}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onChangeMine}
        className="hidden text-xs font-semibold text-violet-600 transition hover:text-violet-800 sm:inline"
      >
        Change yours
      </button>
    </div>
  );
};

const PriorityPill = ({ priority, className = "" }) => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${style.chip} ${className}`}
    >
      <Flag className={`h-3 w-3 ${style.flag}`} />
      {priority}
    </span>
  );
};

const PRIORITY_FILTER_OPTIONS = [
  { id: "all", label: "All priorities" },
  ...PRIORITIES,
];

const PriorityFilter = ({ value, onChange, className = "" }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current =
    PRIORITY_FILTER_OPTIONS.find((item) => item.id === value) || PRIORITY_FILTER_OPTIONS[0];

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className={`${fieldClass} inline-flex w-full min-w-[11rem] items-center justify-between gap-2 text-left md:w-44`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by priority"
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Filter by priority"
          className="absolute right-0 z-30 mt-1.5 min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        >
          {PRIORITY_FILTER_OPTIONS.map((item) => {
            const active = value === item.id;
            const style =
              item.id === "all" ? null : PRIORITY_STYLES[item.id] || PRIORITY_STYLES.medium;
            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    active ? "bg-violet-50 text-violet-800" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {style ? (
                    <Flag className={`h-3.5 w-3.5 shrink-0 ${style.flag}`} />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-violet-600" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

const TaskRelationBadge = ({ task, myId, className = "" }) => {
  const relation = taskRelation(task, myId);
  if (!relation) {
    return null;
  }
  const style = RELATION_STYLES[relation];
  const Icon = relation === "created" ? Sparkles : Users;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 ${style.chip} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0 opacity-80" />
      {style.label}
    </span>
  );
};

const TaskTiming = ({ task }) => {
  const history = Array.isArray(task?.statusHistory) ? task.statusHistory : [];
  const duration = taskDurationMs(task);
  const rows = [{ label: "Created", value: formatStamp(task?.createdAt) }];

  history.forEach((entry, index) => {
    rows.push({
      key: entry._id || `${entry.status}-${entry.createdAt}-${index}`,
      label: columnFor(entry.status).label,
      value: formatStamp(entry.createdAt),
    });
  });

  if (!history.length && task?.statusChangedAt) {
    rows.push({
      key: "status-changed",
      label: "Status changed",
      value: formatStamp(task.statusChangedAt),
    });
  }

  const historyHasCompletion = history.some(
    (entry) => entry.status === "done" && entry.createdAt
  );
  if (task?.completedAt && !historyHasCompletion) {
    rows.push({
      key: "completed",
      label: "Completed",
      value: formatStamp(task.completedAt),
    });
  }

  if (duration != null) {
    rows.push({
      key: "duration",
      label: "Start to finish",
      value: formatDuration(duration),
    });
  }

  const visible = rows.filter((row) => row.value);
  if (!visible.length) {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Timeline
      </p>
      <dl className="mt-2 space-y-1.5">
        {visible.map((row, index) => (
          <div
            key={row.key || `${row.label}-${index}`}
            className="flex items-baseline justify-between gap-3 text-xs"
          >
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="text-right font-semibold text-slate-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const DurationNote = ({ task, className = "" }) => {
  const duration = taskDurationMs(task);
  if (duration == null) {
    return null;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 ${className}`}>
      <Clock className="h-3 w-3" />
      Took {formatDuration(duration)}
    </span>
  );
};

const StatusPill = ({ status }) => {
  const column = columnFor(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${column.soft}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
      {column.label}
    </span>
  );
};

const TaskTime = ({ task, hideIcon = false }) => {
  const stamp = formatStamp(task?.createdAt);
  if (!stamp) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
      {!hideIcon ? <Clock className="h-3.5 w-3.5 shrink-0" /> : null}
      {stamp}
    </span>
  );
};

const DueBadge = ({ dueDate, status, today, hideIcon = false }) => {
  if (!dueDate) {
    return <span className="text-xs font-medium text-slate-300">No date</span>;
  }
  const done = status === "done";
  const overdue = !done && dueDate < today;
  const isToday = !done && dueDate === today;
  const tone = overdue
    ? "bg-rose-50 text-rose-600"
    : isToday
      ? "bg-amber-50 text-amber-700"
      : "text-slate-500";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}
    >
      {!hideIcon ? <CalendarDays className="h-3.5 w-3.5" /> : null}
      {isToday ? "Today" : formatShortDate(dueDate)}
    </span>
  );
};

const PersonPicker = ({ people, selectedIds, ownerId, disabled, onChange }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const selected = selectedIds
    .map((id) => people.find((person) => personId(person) === id))
    .filter(Boolean);
  const needle = query.trim().toLowerCase();
  const matches = people
    .filter((person) => {
      const id = personId(person);
      if (selectedIds.includes(id)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return `${person.name} ${person.department} ${person.position}`
        .toLowerCase()
        .includes(needle);
    })
    .slice(0, 6);

  const addPerson = (id) => {
    onChange([...selectedIds, id]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removePerson = (id) => {
    if (id === ownerId) {
      return;
    }
    onChange(selectedIds.filter((item) => item !== id));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex min-h-[46px] w-full flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-500/10 ${
          disabled ? "cursor-not-allowed bg-slate-50" : "cursor-text"
        }`}
      >
        {selected.length === 0 && !disabled && (
          <Search className="ml-1.5 h-4 w-4 shrink-0 text-slate-400" />
        )}
        {selected.map((person) => {
          const id = personId(person);
          const isOwner = id === ownerId;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pr-1 pl-0.5"
            >
              <Avatar person={person} size="xs" />
              <span className="text-xs font-semibold text-slate-800">
                {person.name}
                {isOwner ? (
                  <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                    Owner
                  </span>
                ) : null}
              </span>
              {!disabled && !isOwner ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removePerson(id);
                  }}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                  aria-label={`Remove ${person.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : (
                <span className="w-1" />
              )}
            </span>
          );
        })}
        {!disabled && (
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (matches[0]) {
                  addPerson(personId(matches[0]));
                }
              }
              if (event.key === "Backspace" && !query && selectedIds.length) {
                const last = selectedIds[selectedIds.length - 1];
                if (last !== ownerId) {
                  onChange(selectedIds.slice(0, -1));
                }
              }
              if (event.key === "Escape" && (open || query)) {
                event.stopPropagation();
                setOpen(false);
                setQuery("");
              }
            }}
            placeholder={selected.length ? "Search to add another" : "Search staff by name"}
            aria-label="Search staff by name"
            className="min-w-[9rem] flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        )}
      </div>
      {!disabled && open && (matches.length > 0 || needle) && (
        <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">No staff match “{query.trim()}”.</p>
          ) : (
            matches.map((person) => (
              <button
                key={personId(person)}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addPerson(personId(person))}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-violet-50"
              >
                <Avatar person={person} size="md" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {person.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {[person.position, person.department].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const FieldLabel = ({ children }) => (
  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
    {children}
  </span>
);

const TaskFields = ({ draft, people, disabled, showStatus = true, onChange }) => {
  const setField = (key, value) => onChange({ ...draft, [key]: value });

  const chooseOwner = (owner) => {
    const assignees = draft.assignees.includes(owner)
      ? draft.assignees
      : [...draft.assignees, owner];
    onChange({ ...draft, owner, assignees });
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <FieldLabel>Title</FieldLabel>
        <input
          value={draft.title}
          disabled={disabled}
          onChange={(event) => setField("title", event.target.value)}
          placeholder="What needs to get done?"
          className={fieldClass}
        />
      </label>
      <label className="block">
        <FieldLabel>Description</FieldLabel>
        <textarea
          value={draft.description}
          disabled={disabled}
          onChange={(event) => setField("description", event.target.value)}
          rows={4}
          placeholder="Add context, links, or the outcome you expect."
          className={`${fieldClass} resize-none`}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {showStatus && (
          <label className="block">
            <FieldLabel>Status</FieldLabel>
            <select
              value={draft.status}
              disabled={disabled}
              onChange={(event) => setField("status", event.target.value)}
              className={fieldClass}
            >
              {COLUMNS.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <FieldLabel>Priority</FieldLabel>
          <select
            value={draft.priority}
            disabled={disabled}
            onChange={(event) => setField("priority", event.target.value)}
            className={fieldClass}
          >
            {PRIORITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <FieldLabel>Due date</FieldLabel>
          <input
            type="date"
            value={draft.dueDate || ""}
            disabled={disabled}
            onChange={(event) => setField("dueDate", event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <FieldLabel>Owner</FieldLabel>
          <select
            value={draft.owner}
            disabled={disabled}
            onChange={(event) => chooseOwner(event.target.value)}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose an owner
            </option>
            {people.map((person) => (
              <option key={personId(person)} value={personId(person)}>
                {person.name}
                {person.department ? ` · ${person.department}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <FieldLabel>Working on it</FieldLabel>
        <p className="mb-2 text-xs leading-5 text-slate-500">
          Add everyone who should work on this. The owner stays on the task, and each person can move the status when their part is done.
        </p>
        <PersonPicker
          people={people}
          selectedIds={draft.assignees}
          ownerId={draft.owner}
          disabled={disabled}
          onChange={(assignees) => setField("assignees", assignees)}
        />
      </div>
    </div>
  );
};

const QuickTaskFields = ({ draft, people, disabled, onChange }) => {
  const descriptionRef = useRef(null);
  const setField = (key, value) => onChange({ ...draft, [key]: value });

  return (
    <div className="space-y-4">
      <label className="block">
        <FieldLabel>Title</FieldLabel>
        <input
          autoFocus
          value={draft.title}
          disabled={disabled}
          onChange={(event) => setField("title", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              descriptionRef.current?.focus();
            }
          }}
          placeholder="What needs to get done?"
          className={fieldClass}
        />
      </label>
      <label className="block">
        <FieldLabel>Description</FieldLabel>
        <textarea
          ref={descriptionRef}
          value={draft.description}
          disabled={disabled}
          onChange={(event) => setField("description", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          placeholder="Optional. A line of context is enough."
          className={`${fieldClass} resize-none`}
        />
      </label>
      <div>
        <FieldLabel>People</FieldLabel>
        <PersonPicker
          people={people}
          selectedIds={draft.assignees}
          ownerId=""
          disabled={disabled}
          onChange={(assignees) => setField("assignees", assignees)}
        />
      </div>
    </div>
  );
};

const TaskboardSidebar = ({
  collapsed,
  onToggleCollapse,
  onClose,
  view,
  views,
  counts,
  me,
  onChangeAvatar,
  onSelectView,
}) => {
  const showLabels = !collapsed;

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={`flex items-center border-b border-slate-100 py-3 ${
          showLabels ? "justify-between gap-3 px-4" : "justify-center px-2"
        }`}
      >
        {showLabels && (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_6px_14px_rgba(99,102,241,0.3)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">Taskboard</p>
              <p className="truncate text-[11px] font-medium text-slate-400">Team workspace</p>
            </div>
          </div>
        )}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3" aria-label="Taskboard views">
        {showLabels && (
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Views
          </p>
        )}
        {views.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          const count = counts[item.id] ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={active ? "page" : undefined}
              title={showLabels ? item.hint : `${item.label} (${count})`}
              className={`flex w-full items-center rounded-2xl text-sm font-semibold transition ${
                showLabels ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
              } ${
                active
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  active ? `${item.tone} text-white` : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {showLabels && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate">{item.label}</span>
                    <span
                      className={`block truncate text-[11px] font-medium ${
                        active ? "text-violet-500" : "text-slate-400"
                      }`}
                    >
                      {item.hint}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      active ? "bg-white text-violet-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-slate-100 ${showLabels ? "p-3" : "p-2"}`}>
        {showLabels ? (
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onChangeAvatar}
                className="group relative shrink-0 rounded-full"
                title="Change your avatar"
              >
                <Avatar person={me} size="lg" />
                <span className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-white ring-2 ring-white transition group-hover:bg-violet-600">
                  <Pencil className="h-2.5 w-2.5" />
                </span>
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{me?.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {[me?.position, me?.department].filter(Boolean).join(" · ") || "Team member"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onChangeAvatar}
            className="flex w-full justify-center rounded-2xl py-1 transition hover:bg-slate-50"
            title="Change your avatar"
          >
            <Avatar person={me} size="md" />
          </button>
        )}
      </div>
    </div>
  );
};

const CompleteTaskModal = ({ task, busy, onClose, onConfirm }) => {
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

const TaskCompletionAttachments = ({
  task,
  canUpload,
  uploading,
  inputKey,
  onPickFile,
}) => {
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
                <img
                  src={item.url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-100"
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
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                download={
                  isImageCompletionFile(item) || isPdfCompletionFile(item)
                    ? undefined
                    : item.originalName || true
                }
                onClick={(event) => event.stopPropagation()}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                {isImageCompletionFile(item) || isPdfCompletionFile(item) ? "Open" : "Download"}
                <ExternalLink className="h-3 w-3" />
              </a>
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

const TaskboardPage = () => {
  const { token, user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const myId = personId(user);
  const today = useMemo(() => todayKey(), []);
  const yesterday = useMemo(() => shiftDateKey(today, -1), [today]);
  const skipClick = useRef(false);
  const draggingId = useRef("");

  const [view, setView] = useState("all");
  const [layout, setLayout] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "board" ? "board" : "list";
    } catch {
      return "list";
    }
  });
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingPriority, setPendingPriority] = useState(null);
  const [createDraft, setCreateDraft] = useState(() => emptyDraft("todo", ""));
  const [activeId, setActiveId] = useState(null);
  const [fromNotifications, setFromNotifications] = useState(false);
  const [draft, setDraft] = useState(null);
  const [todoText, setTodoText] = useState("");
  const [dropStatus, setDropStatus] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({});
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarChoice, setAvatarChoice] = useState(1);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [colorScheme, setColorScheme] = useState(readStoredTheme);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [taskDrawerTab, setTaskDrawerTab] = useState("details");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEndRef = useRef(null);
  const activeIdRef = useRef(null);
  const taskDrawerTabRef = useRef("details");
  const activeChatRef = useRef(null);
  const myIdRef = useRef(myId);
  myIdRef.current = myId;
  const [chatFilter, setChatFilter] = useState("all");
  const [chatSearch, setChatSearch] = useState("");
  const [dmConversations, setDmConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [hubMessages, setHubMessages] = useState([]);
  const [hubDraft, setHubDraft] = useState("");
  const [hubSending, setHubSending] = useState(false);
  const [hubError, setHubError] = useState("");
  const [previousOpen, setPreviousOpen] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState("");
  const [completeModalTask, setCompleteModalTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(false);
  const [uploadingAttachmentTaskId, setUploadingAttachmentTaskId] = useState("");
  const [completionInputKey, setCompletionInputKey] = useState(0);

  const activeTask = tasks.find((task) => task._id === activeId) || null;
  activeIdRef.current = activeId;
  taskDrawerTabRef.current = taskDrawerTab;
  activeChatRef.current = activeChat;

  const me = useMemo(() => {
    const fromDirectory = people.find((person) => personId(person) === myId);
    return { ...(user || {}), ...(fromDirectory || {}), _id: myId };
  }, [people, myId, user]);

  const assignablePeople = useMemo(() => {
    if (!myId || !user?.name || people.some((person) => personId(person) === myId)) {
      return people;
    }
    return [
      {
        _id: myId,
        name: user.name,
        department: user.department,
        position: user.position,
        role: user.role,
        avatar: user.avatar,
      },
      ...people,
    ];
  }, [people, myId, user]);

  const directory = useMemo(() => {
    const map = new Map(assignablePeople.map((person) => [personId(person), person]));
    if (draft?.owner && !map.has(draft.owner) && activeTask?.owner?.name) {
      map.set(personId(activeTask.owner), activeTask.owner);
    }
    (activeTask?.assignees || []).forEach((person) => {
      if (person?.name && !map.has(personId(person))) {
        map.set(personId(person), person);
      }
    });
    return [...map.values()];
  }, [assignablePeople, draft?.owner, activeTask]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [taskData, peopleData, todoData, dmData] = await Promise.all([
          listTasks(),
          listTaskPeople(),
          listDailyTodos(today),
          listStaffConversations().catch(() => ({ conversations: [] })),
        ]);
        if (cancelled) {
          return;
        }
        setTasks(taskData.tasks || []);
        setPeople(peopleData.people || []);
        setTodos(todoData.todos || []);
        setDmConversations(dmData.conversations || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError, "The taskboard could not be loaded."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId || loading) {
      return;
    }
    const task = tasks.find((item) => item._id === taskId);
    if (task && involves(task, myId)) {
      setFormError("");
      setActiveId(task._id);
      setDraft(taskToDraft(task));
      setChatMessages(task.chat || []);
      try {
        setFromNotifications(sessionStorage.getItem(NOTIFICATIONS_RETURN_KEY) === "1");
      } catch {
        setFromNotifications(false);
      }
    }
    const next = new URLSearchParams(searchParams);
    next.delete("task");
    setSearchParams(next, { replace: true });
  }, [loading, myId, searchParams, setSearchParams, tasks]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }
      setCreating(false);
      setPendingPriority(null);
      setActiveId(null);
      setDraft(null);
      setFormError("");
      setMobileSidebarOpen(false);
      setAvatarPickerOpen(false);
      setPreviousOpen(false);
      setCompleteModalTask(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore storage failures */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
    } catch {
      /* ignore storage failures */
    }
  }, [layout]);

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!involves(task, myId) || boardDateOf(task) !== today) {
        return false;
      }
      const relation = taskRelation(task, myId);
      if (view === "mine" && relation !== "created") {
        return false;
      }
      if (view === "assigned" && relation !== "assigned") {
        return false;
      }
      if (priority !== "all" && task.priority !== priority) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const names = [task.owner, ...(task.assignees || [])]
        .map((person) => person?.name || "")
        .join(" ");
      return `${task.title} ${task.description || ""} ${names}`
        .toLowerCase()
        .includes(needle);
    });
  }, [tasks, view, myId, priority, query, today]);

  const memberTasks = tasks.filter((task) => involves(task, myId));
  const todayMemberTasks = memberTasks.filter((task) => boardDateOf(task) === today);
  const yesterdayTasks = memberTasks.filter((task) => boardDateOf(task) === yesterday);
  const earlierTasks = memberTasks.filter((task) => {
    const key = boardDateOf(task);
    return Boolean(key) && key < yesterday;
  });
  const openTasks = todayMemberTasks.filter((task) => task.status !== "done");
  const doneTasks = todayMemberTasks.filter((task) => task.status === "done");
  const myCreatedOpenTasks = todayMemberTasks.filter(
    (task) => task.status !== "done" && taskRelation(task, myId) === "created"
  );
  const assignedOpenTasks = todayMemberTasks.filter(
    (task) => task.status !== "done" && taskRelation(task, myId) === "assigned"
  );
  const myOpenTasks = openTasks;
  const dueTodayTasks = todayMemberTasks.filter(
    (task) => task.dueDate === today && task.status !== "done"
  );
  const myDueToday = dueTodayTasks.filter((task) => involves(task, myId));
  const completion = todayMemberTasks.length
    ? Math.round((doneTasks.length / todayMemberTasks.length) * 100)
    : 0;
  const earlierGroups = useMemo(() => {
    const groups = new Map();
    earlierTasks.forEach((task) => {
      const key = boardDateOf(task);
      const list = groups.get(key) || [];
      list.push(task);
      groups.set(key, list);
    });
    return [...groups.entries()]
      .sort((left, right) => (left[0] < right[0] ? 1 : -1))
      .map(([key, list]) => ({ key, label: formatDayLabel(key), tasks: list }));
  }, [earlierTasks]);
  const previousOpenCount = [...yesterdayTasks, ...earlierTasks].filter(
    (task) => task.status !== "done"
  ).length;

  const metrics = [
    {
      label: "Open",
      value: openTasks.length,
      icon: ListTodo,
      tone: "bg-violet-100 text-violet-700",
      card: "from-violet-50 to-white",
    },
    {
      label: "Yours",
      value: myOpenTasks.length,
      icon: Users,
      tone: "bg-sky-100 text-sky-700",
      card: "from-sky-50 to-white",
    },
    {
      label: "Due today",
      value: dueTodayTasks.length,
      icon: Sun,
      tone: "bg-amber-100 text-amber-700",
      card: "from-amber-50 to-white",
    },
    {
      label: "Done",
      value: doneTasks.length,
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-700",
      card: "from-emerald-50 to-white",
    },
  ];

  const refreshDmConversations = async () => {
    try {
      const data = await listStaffConversations();
      setDmConversations(data.conversations || []);
    } catch {
      /* keep cached list */
    }
  };

  const groupChatThreads = useMemo(
    () =>
      tasks
        .filter((task) => involves(task, myId))
        .map((task) => {
          const chat = task.chat || [];
          const last = chat[chat.length - 1];
          return {
            key: `task:${task._id}`,
            type: "group",
            taskId: task._id,
            title: task.title,
            preview: last?.body || "No messages yet",
            updatedAt: last?.createdAt || task.updatedAt,
            messageCount: chat.length,
            task,
          };
        })
        .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)),
    [tasks, myId]
  );

  const directChatThreads = useMemo(
    () =>
      dmConversations.map((entry) => ({
        key: `dm:${entry._id}`,
        type: "direct",
        conversationId: entry._id,
        title: entry.peer?.name || "Teammate",
        peer: entry.peer,
        preview: entry.lastMessage?.body || "Say hello",
        updatedAt: entry.lastMessage?.createdAt || entry.updatedAt,
        messageCount: 0,
      })),
    [dmConversations]
  );

  const mergedChatThreads = useMemo(() => {
    const merged = [...directChatThreads, ...groupChatThreads];
    merged.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
    return merged;
  }, [directChatThreads, groupChatThreads]);

  const staffMatches = useMemo(() => {
    const needle = chatSearch.trim().toLowerCase();
    if (needle.length < 2) {
      return [];
    }
    return assignablePeople
      .filter((person) => personId(person) !== myId)
      .filter((person) => {
        const haystack = `${person.name || ""} ${person.department || ""} ${person.position || ""}`
          .toLowerCase()
          .trim();
        return haystack.includes(needle);
      })
      .slice(0, 8);
  }, [assignablePeople, chatSearch, myId]);

  const chatThreads = useMemo(() => {
    const needle = chatSearch.trim().toLowerCase();
    let list = mergedChatThreads;
    if (chatFilter === "direct") {
      list = list.filter((item) => item.type === "direct");
    } else if (chatFilter === "group") {
      list = list.filter((item) => item.type === "group");
    }
    if (!needle) {
      return list;
    }
    return list.filter((item) => `${item.title} ${item.preview}`.toLowerCase().includes(needle));
  }, [mergedChatThreads, chatFilter, chatSearch]);

  const activeChatKey = useMemo(() => {
    if (!activeChat) {
      return "";
    }
    if (activeChat.type === "direct") {
      return `dm:${activeChat.conversationId}`;
    }
    if (activeChat.type === "group") {
      return `task:${activeChat.taskId}`;
    }
    return "";
  }, [activeChat]);

  const hubChatTask = useMemo(() => {
    if (activeChat?.type !== "group") {
      return null;
    }
    return tasks.find((task) => task._id === activeChat.taskId) || activeChat.task || null;
  }, [activeChat, tasks]);

  const hubParticipants = useMemo(() => {
    if (!hubChatTask) {
      return [];
    }
    const map = new Map();
    [hubChatTask.owner, hubChatTask.createdBy, ...(hubChatTask.assignees || [])].forEach(
      (person) => {
        const id = personId(person);
        if (id && person?.name) {
          map.set(id, person);
        }
      }
    );
    return [...map.values()];
  }, [hubChatTask]);

  const hubCanSend =
    activeChat?.type === "direct"
      ? Boolean(activeChat.conversationId)
      : Boolean(hubChatTask && involves(hubChatTask, myId));

  const selectChatThread = async (thread) => {
    setHubError("");
    setHubDraft("");
    if (thread.type === "direct") {
      setActiveChat({
        type: "direct",
        conversationId: thread.conversationId,
        peer: thread.peer,
      });
      try {
        const data = await listStaffChatMessages(thread.conversationId);
        setHubMessages(data.messages || []);
      } catch (loadError) {
        setHubMessages([]);
        setHubError(errorMessage(loadError, "Messages could not be loaded."));
      }
      return;
    }
    setActiveChat({
      type: "group",
      taskId: thread.taskId,
      title: thread.title,
      task: thread.task,
    });
    try {
      const data = await listTaskChat(thread.taskId);
      const messages = data.messages || [];
      setHubMessages(messages);
      setTasks((current) =>
        current.map((task) => (task._id === thread.taskId ? { ...task, chat: messages } : task))
      );
    } catch (loadError) {
      setHubMessages(thread.task?.chat || []);
      setHubError(errorMessage(loadError, "Messages could not be loaded."));
    }
  };

  const selectStaffForChat = async (person) => {
    const peerId = personId(person);
    if (!peerId || peerId === myId) {
      return;
    }
    setHubError("");
    setHubDraft("");
    setChatSearch("");
    try {
      const data = await openStaffConversation(peerId);
      const conversation = data.conversation;
      const messages = data.messages || [];
      if (conversation) {
        setDmConversations((current) => {
          const rest = current.filter((item) => String(item._id) !== String(conversation._id));
          return [conversation, ...rest];
        });
        setActiveChat({
          type: "direct",
          conversationId: conversation._id,
          peer: conversation.peer || person,
        });
      }
      setHubMessages(messages);
      setView("chat");
      setMobileSidebarOpen(false);
    } catch (openError) {
      setHubError(errorMessage(openError, "Conversation could not be opened."));
    }
  };

  const submitHubChat = async (event) => {
    event.preventDefault();
    const body = hubDraft.trim();
    if (!body || !activeChat) {
      return;
    }
    setHubSending(true);
    setHubError("");
    try {
      if (activeChat.type === "direct") {
        const data = await sendStaffChatMessage(activeChat.conversationId, body);
        setHubDraft("");
        const message = data.chatMessage;
        if (message) {
          setHubMessages((current) => [...current, message]);
        }
        if (data.conversation) {
          setDmConversations((current) => {
            const rest = current.filter(
              (item) => String(item._id) !== String(data.conversation._id)
            );
            return [data.conversation, ...rest];
          });
        } else {
          refreshDmConversations();
        }
      } else if (hubChatTask && involves(hubChatTask, myId)) {
        const data = await sendTaskChatMessage(activeChat.taskId, body);
        setHubDraft("");
        const nextTask = data.task;
        if (nextTask) {
          setHubMessages(nextTask.chat || []);
          setTasks((current) =>
            current.map((task) => (task._id === nextTask._id ? nextTask : task))
          );
        }
      }
    } catch (sendError) {
      setHubError(errorMessage(sendError, "Your message could not be sent."));
    } finally {
      setHubSending(false);
    }
  };

  const encouragement = (() => {
    if (view === "chat") {
      return "Message teammates directly or jump into a task group chat.";
    }
    if (!todayMemberTasks.length) {
      return previousOpenCount
        ? "Today is a clean slate. Open Yesterday to bring a task onto today's list."
        : "Today is a clean slate. Create the first task for today.";
    }
    if (!myOpenTasks.length) {
      return "Your plate is clear. Enjoy the calm, or pick up something new.";
    }
    if (myDueToday.length) {
      return `${myDueToday.length} of your tasks ${
        myDueToday.length === 1 ? "is" : "are"
      } due today. One step at a time, you've got this.`;
    }
    return `${myOpenTasks.length} open ${
      myOpenTasks.length === 1 ? "task" : "tasks"
    } with your name on ${myOpenTasks.length === 1 ? "it" : "them"}. Small steps, steady progress.`;
  })();

  const replaceTask = (nextTask) => {
    setTasks((current) =>
      current.map((task) => (task._id === nextTask._id ? nextTask : task))
    );
  };

  const moveTaskToToday = async (task) => {
    if (!task || boardDateOf(task) === today || movingTaskId) {
      return;
    }
    setMovingTaskId(task._id);
    setError("");
    try {
      const data = await updateTask(task._id, { boardDate: today });
      if (data.task) {
        replaceTask(data.task);
      }
    } catch (moveError) {
      setError(errorMessage(moveError, "The task could not be moved to today."));
    } finally {
      setMovingTaskId("");
    }
  };

  const openCreate = (status = "todo") => {
    setFormError("");
    setPendingPriority(null);
    setCreateDraft(emptyDraft(status, myId));
    setCreating(true);
  };

  const closeCreate = () => {
    setCreating(false);
    setPendingPriority(null);
    setFormError("");
  };

  const openTask = (task) => {
    if (skipClick.current || !task || !involves(task, myId)) {
      return;
    }
    setFormError("");
    setChatError("");
    setChatDraft("");
    setTaskDrawerTab("details");
    setChatMessages(task.chat || []);
    setActiveId(task._id);
    setDraft(taskToDraft(task));
  };

  const openTaskChat = (task) => {
    if (skipClick.current || !task || !involves(task, myId)) {
      return;
    }
    setFormError("");
    setChatError("");
    setChatDraft("");
    setChatMessages(task.chat || []);
    setActiveId(task._id);
    setDraft(taskToDraft(task));
    setTaskDrawerTab("chat");
    refreshTaskChat(task._id);
  };

  const clearNotificationsReturn = () => {
    try {
      sessionStorage.removeItem(NOTIFICATIONS_RETURN_KEY);
    } catch {
      /* ignore storage failures */
    }
    setFromNotifications(false);
  };

  const closeTask = () => {
    setActiveId(null);
    setDraft(null);
    setTaskDrawerTab("details");
    setChatMessages([]);
    setChatDraft("");
    setChatError("");
    clearNotificationsReturn();
  };

  const returnToNotifications = () => {
    clearNotificationsReturn();
    setActiveId(null);
    setDraft(null);
    requestOpenNotifications();
  };

  const openAvatarPicker = () => {
    setAvatarError("");
    setAvatarChoice(avatarIdFor(me));
    setAvatarPickerOpen(true);
    setMobileSidebarOpen(false);
  };

  const applyAvatarLocally = (id, avatar) => {
    const patch = (person) =>
      person && personId(person) === id ? { ...person, avatar } : person;
    setPeople((current) => current.map(patch));
    setTasks((current) =>
      current.map((task) => ({
        ...task,
        owner: patch(task.owner),
        createdBy: patch(task.createdBy),
        assignees: (task.assignees || []).map(patch),
        activity: (task.activity || []).map((entry) => ({
          ...entry,
          actor: patch(entry.actor),
        })),
        chat: (task.chat || []).map((entry) => ({
          ...entry,
          author: patch(entry.author),
        })),
      }))
    );
  };

  const refreshTaskChat = async (taskId) => {
    if (!taskId) {
      return;
    }
    try {
      const data = await listTaskChat(taskId);
      const messages = data.messages || [];
      setChatMessages(messages);
      setTasks((current) =>
        current.map((task) => (task._id === taskId ? { ...task, chat: messages } : task))
      );
    } catch {
      /* keep the last loaded messages on poll failure */
    }
  };

  useEffect(() => {
    if (!activeId || taskDrawerTab !== "chat") {
      return undefined;
    }
    refreshTaskChat(activeId);
    return undefined;
  }, [activeId, taskDrawerTab]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = connectRealtime(token);
    if (!socket) {
      return undefined;
    }

    const onChat = (payload) => {
      const taskId = String(payload?.taskId || "");
      const message = payload?.message;
      if (!taskId || !message?._id) {
        return;
      }

      setTasks((current) =>
        current.map((task) => {
          if (task._id !== taskId) {
            return task;
          }
          const chat = task.chat || [];
          if (chat.some((item) => String(item._id) === String(message._id))) {
            return task;
          }
          return { ...task, chat: [...chat, message] };
        })
      );

      setChatMessages((current) => {
        if (activeIdRef.current !== taskId) {
          return current;
        }
        if (current.some((item) => String(item._id) === String(message._id))) {
          return current;
        }
        return [...current, message];
      });

      setHubMessages((current) => {
        const hub = activeChatRef.current;
        if (hub?.type !== "group" || hub.taskId !== taskId) {
          return current;
        }
        if (current.some((item) => String(item._id) === String(message._id))) {
          return current;
        }
        return [...current, message];
      });
    };

    const onStaffDm = (payload) => {
      const conversationId = String(payload?.conversationId || "");
      const message = payload?.message;
      if (!conversationId || !message?._id) {
        return;
      }

      setDmConversations((current) => {
        const exists = current.some((entry) => String(entry._id) === conversationId);
        if (!exists) {
          refreshDmConversations();
          return current;
        }
        return current.map((entry) => {
          if (String(entry._id) !== conversationId) {
            return entry;
          }
          return {
            ...entry,
            lastMessage: {
              body: message.body,
              createdAt: message.createdAt,
              author: message.author,
            },
            updatedAt: message.createdAt || entry.updatedAt,
          };
        });
      });

      setHubMessages((current) => {
        const hub = activeChatRef.current;
        if (
          hub?.type !== "direct" ||
          String(hub.conversationId) !== conversationId
        ) {
          return current;
        }
        if (current.some((item) => String(item._id) === String(message._id))) {
          return current;
        }
        return [...current, message];
      });
    };

    const closeOpenTask = (taskId) => {
      setActiveChat((current) =>
        current?.type === "group" && String(current.taskId) === taskId ? null : current
      );
      if (String(activeIdRef.current || "") !== taskId) {
        return;
      }
      setActiveId(null);
      setDraft(null);
      setTaskDrawerTab("details");
      setChatMessages([]);
      setChatDraft("");
      setChatError("");
    };

    const onTaskUpsert = (payload) => {
      const next = payload?.task;
      if (!next?._id) {
        return;
      }
      const taskId = String(next._id);
      if (!involves(next, myIdRef.current)) {
        setTasks((current) => current.filter((task) => String(task._id) !== taskId));
        closeOpenTask(taskId);
        return;
      }
      setTasks((current) => {
        const exists = current.some((task) => String(task._id) === taskId);
        if (!exists) {
          return [next, ...current];
        }
        return current.map((task) => (String(task._id) === taskId ? next : task));
      });
      if (String(activeIdRef.current || "") === taskId && taskDrawerTabRef.current === "chat") {
        setChatMessages(next.chat || []);
      }
      setHubMessages((current) => {
        const hub = activeChatRef.current;
        if (hub?.type !== "group" || String(hub.taskId) !== taskId) {
          return current;
        }
        return next.chat || current;
      });
    };

    const onTaskRemove = (payload) => {
      const taskId = String(payload?.taskId || "");
      if (!taskId) {
        return;
      }
      setTasks((current) => current.filter((task) => String(task._id) !== taskId));
      closeOpenTask(taskId);
    };

    const onConnect = () => {
      if (taskDrawerTabRef.current === "chat" && activeIdRef.current) {
        refreshTaskChat(activeIdRef.current);
      }
    };

    socket.on("task:chat", onChat);
    socket.on("staff:dm", onStaffDm);
    socket.on("task:upsert", onTaskUpsert);
    socket.on("task:remove", onTaskRemove);
    socket.on("connect", onConnect);
    return () => {
      socket.off("task:chat", onChat);
      socket.off("staff:dm", onStaffDm);
      socket.off("task:upsert", onTaskUpsert);
      socket.off("task:remove", onTaskRemove);
      socket.off("connect", onConnect);
    };
  }, [token]);

  useEffect(() => {
    if (taskDrawerTab !== "chat") {
      return;
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, taskDrawerTab]);

  const submitChat = async (event) => {
    event.preventDefault();
    if (!activeTask || !involves(activeTask, myId)) {
      return;
    }
    const body = chatDraft.trim();
    if (!body) {
      return;
    }
    setChatSending(true);
    setChatError("");
    try {
      const data = await sendTaskChatMessage(activeTask._id, body);
      const nextTask = data.task;
      setChatDraft("");
      if (nextTask) {
        setChatMessages(nextTask.chat || []);
        setTasks((current) =>
          current.map((task) => (task._id === nextTask._id ? nextTask : task))
        );
      }
    } catch (sendError) {
      setChatError(errorMessage(sendError, "Your message could not be sent."));
    } finally {
      setChatSending(false);
    }
  };

  const formatChatWhen = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const chatParticipants = useMemo(() => {
    if (!activeTask) {
      return [];
    }
    const map = new Map();
    [activeTask.owner, activeTask.createdBy, ...(activeTask.assignees || [])].forEach(
      (person) => {
        const id = personId(person);
        if (id && person?.name) {
          map.set(id, person);
        }
      }
    );
    return [...map.values()];
  }, [activeTask]);

  const saveAvatar = async () => {
    setAvatarSaving(true);
    setAvatarError("");
    try {
      const data = await updateProfile({ avatar: avatarChoice });
      const savedAvatar = data?.user?.avatar ?? avatarChoice;
      updateUser({ avatar: savedAvatar });
      applyAvatarLocally(myId, savedAvatar);
      setAvatarPickerOpen(false);
    } catch (saveError) {
      setAvatarError(errorMessage(saveError, "Your avatar could not be saved."));
    } finally {
      setAvatarSaving(false);
    }
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!createDraft.title.trim()) {
      setFormError("Add a title before creating the task.");
      return;
    }
    const owner = createDraft.owner || myId;
    if (!owner) {
      setFormError("Sign in again before creating a task.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const data = await createTask({
        title: createDraft.title.trim(),
        description: createDraft.description.trim(),
        status: createDraft.status || "todo",
        owner,
        assignees: createDraft.assignees,
      });
      setTasks((current) => [data.task, ...current]);
      setPendingPriority(data.task);
    } catch (saveError) {
      setFormError(errorMessage(saveError, "The task could not be created."));
    } finally {
      setSaving(false);
    }
  };

  const applyCreatedPriority = async (priorityId) => {
    if (!pendingPriority) {
      return;
    }
    if (priorityId === pendingPriority.priority) {
      closeCreate();
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const data = await updateTask(pendingPriority._id, { priority: priorityId });
      replaceTask(data.task);
      closeCreate();
    } catch (saveError) {
      setFormError(errorMessage(saveError, "The priority could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const submitUpdate = async (event) => {
    event.preventDefault();
    if (!activeTask || !draft) {
      return;
    }
    if (!canManageTask(activeTask, myId)) {
      return;
    }
    if (!draft.title.trim()) {
      setFormError("A task needs a title.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const data = await updateTask(activeTask._id, {
        title: draft.title.trim(),
        description: draft.description,
        status: draft.status,
        priority: draft.priority,
        dueDate: draft.dueDate,
        owner: draft.owner,
        assignees: draft.assignees,
      });
      replaceTask(data.task);
      closeTask();
    } catch (saveError) {
      setFormError(errorMessage(saveError, "The task could not be updated."));
    } finally {
      setSaving(false);
    }
  };

  const attachCompletionFile = async (taskId, file) => {
    if (!file) {
      return;
    }
    const data = await uploadTaskCompletionFile(taskId, file);
    if (data.task) {
      replaceTask(data.task);
    }
  };

  const moveTask = async (task, status, { completionFile } = {}) => {
    if (!task || task.status === status || !involves(task, myId)) {
      if (task && !involves(task, myId)) {
        setError("Only the owner, creator, and assigned staff can update this task.");
      }
      return;
    }
    const previous = task;
    setTasks((current) =>
      current.map((item) => (item._id === task._id ? { ...item, status } : item))
    );
    try {
      const data = await updateTask(task._id, { status });
      replaceTask(data.task);
      if (activeId === task._id) {
        setDraft((current) =>
          current ? { ...current, status: data.task.status } : taskToDraft(data.task)
        );
      }
      if (status === "done" && completionFile) {
        try {
          await attachCompletionFile(task._id, completionFile);
        } catch (uploadError) {
          setError(
            errorMessage(
              uploadError,
              "The task was marked done, but the file could not be uploaded."
            )
          );
        }
      }
    } catch (moveError) {
      replaceTask(previous);
      setError(errorMessage(moveError, "The status could not be updated."));
    }
  };

  const requestStatusChange = (task, status) => {
    if (!task || task.status === status) {
      return;
    }
    if (!involves(task, myId)) {
      setError("Only the owner, creator, and assigned staff can update this task.");
      return;
    }
    if (status === "done" && task.status !== "done") {
      setCompleteModalTask(task);
      return;
    }
    moveTask(task, status);
  };

  const closeCompleteModal = () => {
    if (!completingTask) {
      setCompleteModalTask(null);
    }
  };

  const confirmCompleteTask = async (file) => {
    if (!completeModalTask) {
      return;
    }
    setCompletingTask(true);
    try {
      await moveTask(completeModalTask, "done", { completionFile: file });
      setCompleteModalTask(null);
    } finally {
      setCompletingTask(false);
    }
  };

  const uploadAttachmentForTask = async (task, file, { useFormError = false } = {}) => {
    if (!task || !file) {
      return;
    }
    if (file.size > TASK_COMPLETION_MAX_BYTES) {
      const message = "Choose a file 2MB or smaller.";
      if (useFormError) {
        setFormError(message);
        setCompletionInputKey((current) => current + 1);
      } else {
        setError(message);
      }
      return;
    }
    const taskId = String(task._id);
    setUploadingAttachmentTaskId(taskId);
    if (useFormError) {
      setFormError("");
    }
    try {
      await attachCompletionFile(task._id, file);
      setCompletionInputKey((current) => current + 1);
    } catch (uploadError) {
      const message = errorMessage(uploadError, "The file could not be uploaded.");
      if (useFormError) {
        setFormError(message);
      } else {
        setError(message);
      }
    } finally {
      setUploadingAttachmentTaskId((current) => (current === taskId ? "" : current));
    }
  };

  const uploadCompletionFromDetail = (file) =>
    uploadAttachmentForTask(activeTask, file, { useFormError: true });

  const removeTask = async () => {
    if (!activeTask || !canManageTask(activeTask, myId)) {
      return;
    }
    if (!window.confirm("Delete this task? Assigned staff will no longer see it.")) {
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await deleteTask(activeTask._id);
      setTasks((current) => current.filter((task) => task._id !== activeTask._id));
      closeTask();
    } catch (deleteError) {
      setFormError(errorMessage(deleteError, "The task could not be deleted."));
    } finally {
      setSaving(false);
    }
  };

  const addTodo = async (event) => {
    event.preventDefault();
    const text = todoText.trim();
    if (!text) {
      return;
    }
    setTodoText("");
    try {
      const data = await createDailyTodo({ text, date: today });
      setTodos((current) => [...current, data.todo]);
    } catch (todoError) {
      setTodoText(text);
      setError(errorMessage(todoError, "The to-do could not be added."));
    }
  };

  const toggleTodo = async (todo) => {
    const nextDone = !todo.done;
    setTodos((current) =>
      current.map((item) => (item._id === todo._id ? { ...item, done: nextDone } : item))
    );
    try {
      const data = await updateDailyTodo(todo._id, { done: nextDone });
      setTodos((current) =>
        current.map((item) => (item._id === todo._id ? data.todo : item))
      );
    } catch (todoError) {
      setTodos((current) =>
        current.map((item) => (item._id === todo._id ? todo : item))
      );
      setError(errorMessage(todoError, "The to-do could not be updated."));
    }
  };

  const removeTodo = async (todo) => {
    setTodos((current) => current.filter((item) => item._id !== todo._id));
    try {
      await deleteDailyTodo(todo._id);
    } catch (todoError) {
      setTodos((current) =>
        [...current, todo].sort(
          (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
        )
      );
      setError(errorMessage(todoError, "The to-do could not be removed."));
    }
  };

  const clearDoneTodos = async () => {
    const finished = todos.filter((todo) => todo.done);
    if (!finished.length) {
      return;
    }
    setTodos((current) => current.filter((todo) => !todo.done));
    try {
      await Promise.all(finished.map((todo) => deleteDailyTodo(todo._id)));
    } catch (todoError) {
      setTodos((current) =>
        [...current, ...finished].sort(
          (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
        )
      );
      setError(errorMessage(todoError, "Completed to-dos could not be cleared."));
    }
  };

  const views = [
    {
      id: "all",
      label: "All tasks",
      hint: "Today's board",
      icon: LayoutGrid,
      tone: "bg-violet-500",
    },
    {
      id: "mine",
      label: "My tasks",
      hint: "Tasks you created",
      icon: Sparkles,
      tone: "bg-violet-500",
    },
    {
      id: "assigned",
      label: "Assigned",
      hint: "Tasks assigned to you",
      icon: Users,
      tone: "bg-sky-500",
    },
    {
      id: "chat",
      label: "Chat",
      hint: "Direct and group messages",
      icon: MessageSquare,
      tone: "bg-indigo-500",
    },
    {
      id: "today",
      label: "Today",
      hint: "Your list for the day",
      icon: Sun,
      tone: "bg-amber-500",
    },
  ];
  const viewCounts = {
    all: todayMemberTasks.length,
    mine: myCreatedOpenTasks.length,
    assigned: assignedOpenTasks.length,
    chat: mergedChatThreads.length,
    today: todos.filter((todo) => !todo.done).length,
  };
  const selectView = (nextView) => {
    setView(nextView);
    setMobileSidebarOpen(false);
    if (nextView === "chat") {
      refreshDmConversations();
    }
  };
  const toggleColorScheme = () => {
    setColorScheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const sidebarProps = {
    view,
    views,
    counts: viewCounts,
    me,
    onChangeAvatar: openAvatarPicker,
    onSelectView: selectView,
  };

  const isDark = colorScheme === "dark";

  const todoDone = todos.filter((todo) => todo.done).length;
  const todoProgress = todos.length ? Math.round((todoDone / todos.length) * 100) : 0;

  const onDragState = (dragging, id) => {
    skipClick.current = dragging;
    if (dragging) {
      draggingId.current = id || "";
    } else {
      window.setTimeout(() => {
        skipClick.current = false;
      }, 80);
    }
  };

  const pageTitle =
    view === "today"
      ? "Today"
      : view === "mine"
        ? "My tasks"
        : view === "assigned"
          ? "Assigned"
          : view === "chat"
            ? "Chat"
            : formatDayLabel(today);

  return (
    <div
      className={`taskboard min-h-screen text-slate-950 [&_button:not(:disabled)]:cursor-pointer ${
        isDark ? "taskboard--dark" : "bg-[#f4f1fb]"
      }`}
    >
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1600px] items-start">
        <aside
          className={`sticky top-20 hidden h-[calc(100vh-5rem)] shrink-0 overflow-hidden border-r transition-[width] duration-200 lg:block ${
            isDark ? "border-slate-700/80" : "border-slate-200/80"
          } ${sidebarCollapsed ? "w-[4.5rem]" : "w-64"}`}
        >
          <TaskboardSidebar
            {...sidebarProps}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          />
        </aside>

        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-20 z-40 bg-slate-950/40 lg:hidden"
            aria-label="Close taskboard menu"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <aside
          className={`fixed bottom-0 left-0 top-20 z-50 w-72 max-w-[85vw] overflow-hidden border-r shadow-xl transition-transform duration-200 lg:hidden ${
            isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
          } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <TaskboardSidebar
            {...sidebarProps}
            collapsed={false}
            onClose={() => setMobileSidebarOpen(false)}
          />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <section
            className={`relative overflow-hidden rounded-2xl px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-5 ${
              isDark
                ? "border border-slate-700/70 bg-gradient-to-r from-[#1a1430] via-[#141c2e] to-[#102028]"
                : "border border-white/80 bg-gradient-to-r from-violet-100 via-sky-50 to-emerald-100"
            }`}
          >
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className={`rounded-xl border p-2 transition lg:hidden ${
                    isDark
                      ? "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      : "border-white/70 bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                  aria-label="Open taskboard menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={openAvatarPicker}
                  className="group relative shrink-0 rounded-full"
                  title="Change your avatar"
                >
                  <Avatar
                    person={me}
                    size="lg"
                    className={`ring-4 shadow-[0_8px_20px_rgba(15,23,42,0.1)] ${
                      isDark ? "ring-slate-700" : "ring-white"
                    }`}
                  />
                  <span
                    className={`absolute -right-0.5 -bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white ring-2 transition group-hover:bg-violet-600 ${
                      isDark ? "ring-slate-700" : "ring-white"
                    }`}
                  >
                    <Pencil className="h-3 w-3" />
                  </span>
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {pageTitle}
                  </p>
                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {greetingFor()}, {firstName(user?.name)}
                  </h1>
                  <p
                    className={`mt-0.5 max-w-xl truncate text-sm ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {encouragement}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <TeamStrip
                  people={assignablePeople}
                  meId={myId}
                  onChangeMine={openAvatarPicker}
                />
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isDark
                      ? "border border-slate-600/80 bg-slate-900/70 text-slate-300"
                      : "bg-white/80 text-slate-600"
                  }`}
                >
                  <span className={isDark ? "text-violet-300" : "text-violet-700"}>
                    {completion}%
                  </span>
                  <span className="text-slate-400">·</span>
                  <span>
                    {doneTasks.length}/{todayMemberTasks.length} done
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleColorScheme}
                  className={`taskboard-theme-toggle inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200/80 bg-white/80 text-slate-700 hover:bg-white"
                  }`}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  title={isDark ? "Light mode" : "Dark mode"}
                >
                  {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviousOpen(true)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isDark
                      ? "border border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      : "bg-white/80 text-slate-700 hover:bg-white"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Yesterday
                  {previousOpenCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isDark
                          ? "bg-amber-400/20 text-amber-300"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {previousOpenCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openCreate("todo")}
                  className={`${primaryButton} hidden sm:inline-flex`}
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div
              className={`mt-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <p>{error}</p>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-16 flex items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading taskboard...
            </div>
          ) : view === "chat" ? (
            <TaskboardChatHub
              myId={myId}
              activeChat={activeChat}
              messages={hubMessages}
              draft={hubDraft}
              onDraftChange={setHubDraft}
              onSend={submitHubChat}
              sending={hubSending}
              error={hubError}
              canSend={hubCanSend}
              participants={hubParticipants}
              onOpenTask={(task) => openTask(task)}
              chatFilter={chatFilter}
              onChatFilterChange={setChatFilter}
              chatSearch={chatSearch}
              onChatSearchChange={setChatSearch}
              chatThreads={chatThreads}
              staffMatches={staffMatches}
              activeChatKey={activeChatKey}
              onSelectChatThread={selectChatThread}
              onSelectStaff={selectStaffForChat}
            />
          ) : view === "today" ? (
            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.05)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                      Personal list
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">
                      {formatDayLabel(today)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {todos.length
                        ? `${todoDone} of ${todos.length} done`
                        : "Add the things you want to finish today."}
                    </p>
                  </div>
                  {todoDone > 0 && (
                    <button
                      type="button"
                      onClick={clearDoneTodos}
                      className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                    >
                      Clear done
                    </button>
                  )}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                    style={{ width: `${todoProgress}%` }}
                  />
                </div>
                <form onSubmit={addTodo} className="mt-5 flex gap-2">
                  <input
                    value={todoText}
                    onChange={(event) => setTodoText(event.target.value)}
                    placeholder="Add a to-do for today"
                    className={fieldClass}
                  />
                  <button type="submit" className={`${primaryButton} shrink-0 rounded-2xl`}>
                    Add
                  </button>
                </form>
                <ul className="mt-4 space-y-2">
                  {todos.length === 0 && (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                      Your list for today is empty.
                    </li>
                  )}
                  {todos.map((todo) => (
                    <li
                      key={todo._id}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                        todo.done
                          ? "border-emerald-100 bg-emerald-50/60"
                          : "border-slate-100 bg-slate-50/70"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                          todo.done
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-transparent hover:border-emerald-400"
                        }`}
                        aria-label={todo.done ? "Mark not done" : "Mark done"}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <span
                        className={`min-w-0 flex-1 text-sm ${
                          todo.done ? "text-slate-400 line-through" : "text-slate-800"
                        }`}
                      >
                        {todo.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTodo(todo)}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600"
                        aria-label="Remove to-do"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-5">
                <TaskListCard
                  title="Due today"
                  accent="text-amber-600"
                  empty="Nothing on the board is due today."
                  tasks={dueTodayTasks}
                  today={today}
                  myId={myId}
                  onOpen={openTask}
                  onOpenChat={openTaskChat}
                />
                <TaskListCard
                  title="Still with you"
                  accent="text-sky-600"
                  empty="You have no open tasks."
                  tasks={myOpenTasks.slice(0, 8)}
                  today={today}
                  myId={myId}
                  onOpen={openTask}
                  onOpenChat={openTaskChat}
                />
              </div>
            </section>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex flex-wrap gap-2">
                  {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={metric.label}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
                          isDark
                            ? "border-slate-700 bg-slate-900/80"
                            : "border-white bg-white/80"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${metric.tone}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-bold text-slate-900">{metric.value}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {metric.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <div
                  className={`inline-flex shrink-0 rounded-full border p-1 ${
                    isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  }`}
                >
                  {[
                    { id: "list", label: "List", icon: List },
                    { id: "board", label: "Board", icon: LayoutGrid },
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = layout === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setLayout(option.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? isDark
                              ? "bg-violet-600 text-white shadow-[0_6px_14px_rgba(124,58,237,0.35)]"
                              : "bg-slate-950 text-white shadow-[0_6px_14px_rgba(15,23,42,0.18)]"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search tasks or people"
                    className={`${fieldClass} pl-10`}
                  />
                </label>
                <PriorityFilter value={priority} onChange={setPriority} />
                <button
                  type="button"
                  onClick={() => openCreate("todo")}
                  className={`${primaryButton} sm:hidden`}
                >
                  <Plus className="h-4 w-4" />
                  New task
                </button>
              </div>

              {layout === "list" ? (
                <TaskTable
                  tasks={visibleTasks}
                  today={today}
                  myId={myId}
                  collapsed={collapsedSections}
                  onToggleSection={(id) =>
                    setCollapsedSections((current) => ({ ...current, [id]: !current[id] }))
                  }
                  onOpen={openTask}
                  onOpenChat={openTaskChat}
                  onUploadAttachment={uploadAttachmentForTask}
                  uploadingAttachmentTaskId={uploadingAttachmentTaskId}
                  onMove={requestStatusChange}
                  onCreate={openCreate}
                />
              ) : (
                <div className="mt-4 overflow-x-auto rounded-3xl bg-gradient-to-br from-violet-100 via-sky-50 to-emerald-100 p-3 sm:p-4">
                  <div className="grid min-w-[980px] grid-cols-4 gap-3">
                    {COLUMNS.map((column) => {
                      const columnTasks = visibleTasks.filter((task) => task.status === column.id);
                      return (
                        <section
                          key={column.id}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDropStatus(column.id);
                          }}
                          onDragLeave={() =>
                            setDropStatus((current) => (current === column.id ? "" : current))
                          }
                          onDrop={(event) => {
                            event.preventDefault();
                            setDropStatus("");
                            const taskId =
                              event.dataTransfer.getData("text/plain") || draggingId.current;
                            const task = tasks.find((item) => item._id === taskId);
                            requestStatusChange(task, column.id);
                          }}
                          className={`flex min-h-[28rem] flex-col rounded-2xl p-2.5 shadow-sm backdrop-blur-sm transition ${
                            isDark
                              ? "bg-slate-900/80 ring-1 ring-slate-700/80"
                              : "bg-white/80 ring-1 ring-white/80"
                          } ${dropStatus === column.id ? `ring-2 ${column.ring}` : ""}`}
                        >
                          <div className={`mb-2 h-1 rounded-full ${column.bar}`} />
                          <div className="flex items-center justify-between px-1.5">
                            <div className="flex items-center gap-2">
                              <h2 className={`text-sm font-bold ${column.text}`}>{column.label}</h2>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                {columnTasks.length}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openCreate(column.id)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                              aria-label={`Add task to ${column.label}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2 flex flex-1 flex-col gap-2">
                            {columnTasks.map((task) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                today={today}
                                myId={myId}
                                movable={involves(task, myId)}
                                onOpen={openTask}
                                onOpenChat={openTaskChat}
                                onDragState={onDragState}
                              />
                            ))}
                            {columnTasks.length === 0 && (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-3 py-8 text-center text-xs text-slate-400">
                                Drop a task here
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openCreate(column.id)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white hover:text-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                            Add a card
                          </button>
                        </section>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl sm:p-6">
            {pendingPriority ? (
              <div>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                      Saved
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">Set a priority</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Optional. Medium is already set if you are not sure.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-violet-50 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      On this task
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                      {pendingPriority.title}
                    </p>
                  </div>
                  <AvatarStack people={pendingPriority.assignees} max={4} size="sm" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {PRIORITIES.map((item) => {
                    const style = PRIORITY_STYLES[item.id] || PRIORITY_STYLES.medium;
                    const current = pendingPriority.priority === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={saving}
                        onClick={() => applyCreatedPriority(item.id)}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold capitalize transition disabled:opacity-60 ${style.chip} ${
                          current ? "ring-2 ring-violet-400" : "hover:brightness-95"
                        }`}
                      >
                        <Flag className={`h-4 w-4 ${style.flag}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={closeCreate}
                    disabled={saving}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Not now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitCreate}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                      New task
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">What needs doing?</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <QuickTaskFields
                  draft={createDraft}
                  people={assignablePeople}
                  disabled={saving}
                  onChange={setCreateDraft}
                />
                {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className={primaryButton}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTask && draft && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <button
            type="button"
            className="hidden flex-1 sm:block"
            aria-label="Close task"
            onClick={closeTask}
          />
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              {fromNotifications ? (
                <button
                  type="button"
                  onClick={returnToNotifications}
                  className="inline-flex min-w-0 items-center gap-2 rounded-full py-1 pr-3 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                  aria-label="Back to all notifications"
                >
                  <span className="inline-flex rounded-full border border-slate-200 p-2 text-slate-500">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                  All notifications
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={activeTask.status} />
                  <PriorityPill priority={activeTask.priority} />
                  <TaskRelationBadge task={activeTask} myId={myId} />
                </div>
              )}
              <button
                type="button"
                onClick={closeTask}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {boardDateOf(activeTask) && boardDateOf(activeTask) !== today && (
              <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3">
                <p className="text-xs leading-5 text-amber-800">
                  This task is on {formatDayLabel(boardDateOf(activeTask))}. It stays off today's board until you move it.
                </p>
                <button
                  type="button"
                  disabled={movingTaskId === activeTask._id}
                  onClick={() => moveTaskToToday(activeTask)}
                  className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {movingTaskId === activeTask._id ? "Moving..." : "Move to today"}
                </button>
              </div>
            )}
            {fromNotifications && (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                <StatusPill status={activeTask.status} />
                <PriorityPill priority={activeTask.priority} />
                <TaskRelationBadge task={activeTask} myId={myId} />
              </div>
            )}
            <div className="flex gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
              <button
                type="button"
                onClick={() => setTaskDrawerTab("details")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  taskDrawerTab === "details"
                    ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white/80"
                }`}
              >
                <Pencil className="h-4 w-4" />
                Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaskDrawerTab("chat");
                  refreshTaskChat(activeTask._id);
                }}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  taskDrawerTab === "chat"
                    ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white/80"
                }`}
              >
                <MessagesSquare className="h-4 w-4" />
                Team chat
                {chatMessages.length > 0 && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                    {chatMessages.length > 99 ? "99+" : chatMessages.length}
                  </span>
                )}
              </button>
            </div>
            {taskDrawerTab === "chat" ? (
              <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 to-violet-50/30">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 bg-white/90 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
                      Group chat
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900">{activeTask.title}</p>
                  </div>
                  <AvatarStack people={chatParticipants} max={4} size="sm" />
                </div>
                {involves(activeTask, myId) ? (
                <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {chatMessages.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center">
                      <MessagesSquare className="mx-auto h-8 w-8 text-violet-400" />
                      <p className="mt-3 text-sm font-semibold text-slate-800">Start the conversation</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Owner, creator, and assignees can chat here about this task.
                      </p>
                    </li>
                  ) : (
                    chatMessages.map((entry) => {
                      const mine = personId(entry.author) === myId;
                      return (
                        <li
                          key={entry._id || `${entry.createdAt}-${entry.body}`}
                          className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                        >
                          {!mine && (
                            <Avatar person={entry.author} size="sm" className="mb-1 shrink-0" />
                          )}
                          <div
                            className={`max-w-[min(100%,18rem)] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                              mine
                                ? "rounded-br-md bg-violet-600 text-white"
                                : "rounded-bl-md border border-slate-200/90 bg-white text-slate-800"
                            }`}
                          >
                            {!mine && (
                              <p className="mb-0.5 text-xs font-semibold text-violet-700">
                                {entry.author?.name || "Teammate"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap text-sm leading-5">{entry.body}</p>
                            <p
                              className={`mt-1 text-[10px] ${mine ? "text-violet-200" : "text-slate-400"}`}
                            >
                              {formatChatWhen(entry.createdAt)}
                            </p>
                          </div>
                        </li>
                      );
                    })
                  )}
                  <li aria-hidden="true" ref={chatEndRef} />
                </ul>
                {chatError && (
                  <p className="px-5 pb-1 text-sm text-rose-600">{chatError}</p>
                )}
                  <form
                    onSubmit={submitChat}
                    className="border-t border-slate-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-end gap-2">
                    <label className="sr-only" htmlFor="task-chat-input">
                      Message the team
                    </label>
                    <textarea
                      id="task-chat-input"
                      rows={2}
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          submitChat(event);
                        }
                      }}
                      disabled={chatSending}
                      placeholder="Write to the team…"
                      className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                    <button
                      type="submit"
                      disabled={chatSending || !chatDraft.trim()}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] transition hover:bg-violet-700 disabled:opacity-50"
                      aria-label="Send message"
                    >
                      {chatSending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                    </div>
                  </form>
                </>
                ) : (
                  <p className="flex flex-1 items-center justify-center px-5 py-10 text-center text-sm text-slate-500">
                    Only people on this task can use this chat.
                  </p>
                )}
              </div>
            ) : (
            <form onSubmit={submitUpdate} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className={`mb-5 rounded-2xl p-4 ${columnFor(activeTask.status).wash}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Working on it
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <AvatarStack people={activeTask.assignees} max={5} size="md" />
                  <span className="text-xs font-medium text-slate-500">
                    {(activeTask.assignees || []).length}{" "}
                    {(activeTask.assignees || []).length === 1 ? "person" : "people"}
                  </span>
                </div>
                {activeTask.owner?.name && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <Flag className="h-3.5 w-3.5" />
                    Owner · <span className="font-semibold">{activeTask.owner.name}</span>
                  </p>
                )}
              </div>

              <TaskTiming task={activeTask} />

              {involves(activeTask, myId) ||
              (activeTask.completionAttachments || []).length > 0 ? (
                <TaskCompletionAttachments
                  task={activeTask}
                  canUpload={involves(activeTask, myId)}
                  uploading={uploadingAttachmentTaskId === activeTask._id}
                  inputKey={completionInputKey}
                  onPickFile={uploadCompletionFromDetail}
                />
              ) : null}

              {!canManageTask(activeTask, myId) && (
                <p className="mb-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                  {involves(activeTask, myId)
                    ? "You can move the status. The owner or creator updates the title, owner, and assignees."
                    : "You can view this task. Status updates are for the owner, creator, and assigned staff."}
                </p>
              )}
              {involves(activeTask, myId) && (
                <div className="mb-5 grid grid-cols-2 gap-2">
                  {COLUMNS.map((column) => {
                    const active = activeTask.status === column.id;
                    return (
                      <button
                        key={column.id}
                        type="button"
                        disabled={saving || active}
                        onClick={() => requestStatusChange(activeTask, column.id)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? `${column.soft} ring-2 ${column.ring}`
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
                        {column.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <TaskFields
                draft={draft}
                people={directory}
                showStatus={false}
                disabled={!canManageTask(activeTask, myId) || saving}
                onChange={setDraft}
              />
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Activity
                </p>
                <ul className="mt-3 space-y-3">
                  {[...(activeTask.activity || [])].reverse().map((entry) => (
                    <li
                      key={entry._id || `${entry.message}-${entry.createdAt}`}
                      className="flex gap-3"
                    >
                      <Avatar person={entry.actor} size="sm" className="mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">
                            {entry.actor?.name || "Someone"}
                          </span>{" "}
                          {`${entry.message.charAt(0).toLowerCase()}${entry.message.slice(1)}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleString(undefined, {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {formError && <p className="mt-4 text-sm text-rose-600">{formError}</p>}
            </div>
            {canManageTask(activeTask, myId) && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                <button
                  type="button"
                  onClick={removeTask}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button type="submit" disabled={saving} className={primaryButton}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
            </form>
            )}
          </div>
        </div>
      )}

      {previousOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close previous tasks"
            onClick={() => setPreviousOpen(false)}
          />
          <div className="relative flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                  Previous day
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  {formatDayLabel(yesterday)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These stay off today's board. Move a task to today when you want it on the list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviousOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                <PreviousTaskList
                tasks={yesterdayTasks}
                today={today}
                movingTaskId={movingTaskId}
                empty="Nothing was left on yesterday's board."
                onOpen={(task) => {
                  setPreviousOpen(false);
                  openTask(task);
                }}
                onMove={moveTaskToToday}
              />
              {earlierGroups.map((group) => (
                <section key={group.key}>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {group.label}
                  </h3>
                  <div className="mt-2">
                    <PreviousTaskList
                      tasks={group.tasks}
                      today={today}
                      movingTaskId={movingTaskId}
                      empty=""
                      onOpen={(task) => {
                        setPreviousOpen(false);
                        openTask(task);
                      }}
                      onMove={moveTaskToToday}
                    />
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {completeModalTask && (
        <CompleteTaskModal
          task={completeModalTask}
          busy={completingTask}
          onClose={closeCompleteModal}
          onConfirm={confirmCompleteTask}
        />
      )}

      {avatarPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  person={{ ...me, avatar: avatarChoice }}
                  size="lg"
                  className="ring-4 ring-violet-100"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                    Your avatar
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight">Pick one that feels like you</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAvatarPickerOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => {
                const selected = avatarChoice === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setAvatarChoice(avatar.id)}
                    className={`relative rounded-2xl p-1.5 transition ${
                      selected
                        ? "bg-violet-50 ring-2 ring-violet-500"
                        : "ring-1 ring-transparent hover:bg-slate-50 hover:ring-slate-200"
                    }`}
                    aria-pressed={selected}
                    aria-label={`Avatar ${avatar.id}`}
                  >
                    <img
                      src={avatar.src}
                      alt=""
                      draggable={false}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                    {selected && (
                      <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white ring-2 ring-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Everyone starts with an avatar we picked for them. Choose a different one any time, it shows wherever you appear on the taskboard.
            </p>
            {avatarError && <p className="mt-3 text-sm text-rose-600">{avatarError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAvatarPickerOpen(false)}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAvatar}
                disabled={avatarSaving}
                className={primaryButton}
              >
                {avatarSaving ? "Saving..." : "Use this avatar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PreviousTaskList = ({ tasks, today, movingTaskId, empty, onOpen, onMove }) => {
  if (!tasks.length) {
    return empty ? (
      <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        {empty}
      </p>
    ) : null;
  }

  const ordered = [...tasks].sort((left, right) => {
    if (left.status === "done" && right.status !== "done") {
      return 1;
    }
    if (left.status !== "done" && right.status === "done") {
      return -1;
    }
    return 0;
  });

  return (
    <ul className="space-y-2">
      {ordered.map((task) => {
        const done = task.status === "done";
        const moving = movingTaskId === task._id;
        return (
          <li
            key={task._id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3"
          >
            <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
              <p
                className={`truncate text-sm font-semibold ${
                  done ? "text-slate-400 line-through" : "text-slate-900"
                }`}
              >
                {task.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusPill status={task.status} />
                <TaskTime task={task} />
                {task.dueDate ? (
                  <DueBadge dueDate={task.dueDate} status={task.status} today={today} />
                ) : null}
                <DurationNote task={task} />
              </div>
            </button>
            <button
              type="button"
              disabled={Boolean(movingTaskId)}
              onClick={() => onMove(task)}
              className="shrink-0 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {moving ? "Moving..." : "Move to today"}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

const taskChatCount = (task) => (task?.chat || []).length;

const taskAttachmentCount = (task) => (task?.completionAttachments || []).length;

const TaskUploadButton = ({
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
    <>
      <input
        ref={inputRef}
        type="file"
        accept={TASK_COMPLETION_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
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
          event.stopPropagation();
          if (!atLimit && !busy) {
            inputRef.current?.click();
          }
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
    </>
  );
};

const TaskChatButton = ({ task, myId, onOpenChat, compact = false }) => {
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

const TaskTable = ({
  tasks,
  today,
  myId,
  collapsed,
  onToggleSection,
  onOpen,
  onOpenChat,
  onUploadAttachment,
  uploadingAttachmentTaskId,
  onMove,
  onCreate,
}) => (
  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.04)]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-[#fbfafd] text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <th className="w-[38%] px-5 py-3 font-semibold">Task</th>
            <th className="w-[16%] px-3 py-3 font-semibold">Assignees</th>
            <th className="w-[16%] px-3 py-3 font-semibold">Owner</th>
            <th className="w-[10%] px-3 py-3 font-semibold">Due</th>
            <th className="w-[10%] px-3 py-3 font-semibold">Priority</th>
            <th className="w-[10%] px-3 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        {COLUMNS.map((column) => {
          const rows = tasks.filter((task) => task.status === column.id);
          const isCollapsed = Boolean(collapsed[column.id]);
          return (
            <tbody key={column.id}>
              <tr className={column.wash}>
                <td colSpan={6} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onToggleSection(column.id)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-white/70"
                      aria-expanded={!isCollapsed}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                      <span className={`text-sm font-bold ${column.text}`}>{column.label}</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {rows.length}
                      </span>
                      <span className="hidden text-xs text-slate-500 sm:inline">
                        · {column.hint}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCreate(column.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                </td>
              </tr>
              {!isCollapsed &&
                rows.map((task) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    today={today}
                    myId={myId}
                    movable={involves(task, myId)}
                    onOpen={onOpen}
                    onOpenChat={onOpenChat}
                    onUpload={onUploadAttachment}
                    uploadingTaskId={uploadingAttachmentTaskId}
                    onMove={onMove}
                  />
                ))}
              {!isCollapsed && rows.length === 0 && (
                <tr className="border-b border-slate-100">
                  <td colSpan={6} className="px-5 py-4 text-xs text-slate-400">
                    Nothing here yet.
                  </td>
                </tr>
              )}
              {!isCollapsed && (
                <tr className="border-b border-slate-100">
                  <td colSpan={6} className="px-5">
                    <button
                      type="button"
                      onClick={() => onCreate(column.id)}
                      className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Add task
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          );
        })}
      </table>
    </div>
  </div>
);

const TaskRow = ({
  task,
  today,
  myId,
  movable,
  onOpen,
  onOpenChat,
  onUpload,
  uploadingTaskId,
  onMove,
}) => {
  const done = task.status === "done";
  const column = columnFor(task.status);

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(task);
        }
      }}
      className={`cursor-pointer border-b border-slate-100 transition hover:bg-violet-50/40 ${
        done ? "bg-emerald-50/20" : "bg-white"
      }`}
    >
      <td className={`border-l-2 px-5 py-2.5 ${column.accent}`}>
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            disabled={!movable}
            onClick={(event) => {
              event.stopPropagation();
              onMove(task, done ? "todo" : "done");
            }}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
              done
                ? "border-emerald-500 bg-emerald-500 text-white"
                : movable
                  ? "border-slate-300 bg-white text-transparent hover:border-emerald-400 hover:text-emerald-400"
                  : "border-slate-200 bg-slate-50 text-transparent"
            } disabled:cursor-not-allowed`}
            aria-label={done ? "Mark as not done" : "Mark as done"}
            title={
              movable ? (done ? "Reopen" : "Complete") : "Only people on this task can change it"
            }
          >
            <Check className="h-3 w-3" />
          </button>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold ${
                done ? "text-slate-400 line-through" : "text-slate-900"
              }`}
            >
              {task.title}
            </p>
            <TaskRelationBadge task={task} myId={myId} className="mt-1" />
            {task.description ? (
              <p className="truncate text-xs text-slate-500">{task.description}</p>
            ) : null}
            <DurationNote task={task} className="mt-1" />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <TaskUploadButton
              task={task}
              myId={myId}
              onUpload={onUpload}
              uploadingTaskId={uploadingTaskId}
              compact
            />
            <TaskChatButton task={task} myId={myId} onOpenChat={onOpenChat} compact />
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <AvatarStack people={task.assignees} max={5} />
      </td>
      <td className="px-3 py-2.5">
        {task.owner ? (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar person={task.owner} size="xs" />
            <span className="truncate text-xs font-medium text-slate-700">{task.owner.name}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        {task.dueDate ? (
          <DueBadge
            dueDate={task.dueDate}
            status={task.status}
            today={today}
            hideIcon
          />
        ) : (
          <TaskTime task={task} hideIcon />
        )}
      </td>
      <td className="px-3 py-2.5">
        <PriorityPill priority={task.priority} />
      </td>
      <td className="px-3 py-2.5" onClick={(event) => event.stopPropagation()}>
        {movable ? (
          <label className="relative inline-flex">
            <select
              value={task.status}
              onChange={(event) => onMove(task, event.target.value)}
              className={`cursor-pointer appearance-none rounded-full py-1 pr-7 pl-3 text-[11px] font-semibold outline-none ring-offset-1 transition focus:ring-2 ${column.soft} ${column.ring}`}
              aria-label="Change status"
            >
              {COLUMNS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 opacity-70" />
          </label>
        ) : (
          <StatusPill status={task.status} />
        )}
      </td>
    </tr>
  );
};

const TaskCard = ({ task, today, myId, movable, onOpen, onOpenChat, onDragState }) => {
  const people = task.assignees || [];

  return (
    <article
      role="button"
      tabIndex={0}
      draggable={movable}
      onDragStart={(event) => {
        if (!movable) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/plain", task._id);
        event.dataTransfer.effectAllowed = "move";
        onDragState(true, task._id);
      }}
      onDragEnd={() => onDragState(false)}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(task);
        }
      }}
      className={`cursor-pointer rounded-xl border border-slate-100 bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
        movable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-5 text-slate-950">{task.title}</h3>
          <TaskRelationBadge task={task} myId={myId} className="mt-1.5" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TaskChatButton task={task} myId={myId} onOpenChat={onOpenChat} compact />
          <PriorityPill priority={task.priority} className="shrink-0" />
        </div>
      </div>
      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p>
      ) : null}
      <div className="mt-3 flex items-end justify-between gap-2">
        <AvatarStack people={people} max={4} />
        <div className="flex flex-col items-end gap-1">
          <DurationNote task={task} />
          <TaskTime task={task} />
          {task.dueDate ? (
            <DueBadge dueDate={task.dueDate} status={task.status} today={today} />
          ) : null}
        </div>
      </div>
    </article>
  );
};

const TaskListCard = ({ title, accent, empty, tasks, today, myId, onOpen, onOpenChat }) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.05)]">
    <h2 className={`text-xs font-semibold uppercase tracking-[0.16em] ${accent}`}>{title}</h2>
    <ul className="mt-3 space-y-2">
      {tasks.length === 0 && <li className="py-6 text-sm text-slate-500">{empty}</li>}
      {tasks.map((task) => (
        <li key={task._id} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen(task)}
            className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">
                {task.title}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <TaskRelationBadge task={task} myId={myId} />
                <StatusPill status={task.status} />
                <TaskTime task={task} />
                {task.dueDate ? (
                  <DueBadge dueDate={task.dueDate} status={task.status} today={today} />
                ) : null}
                <DurationNote task={task} />
              </span>
            </span>
            <AvatarStack people={task.assignees} max={3} size="xs" emptyLabel="" />
          </button>
          <TaskChatButton task={task} myId={myId} onOpenChat={onOpenChat} />
        </li>
      ))}
    </ul>
  </div>
);

export default TaskboardPage;
