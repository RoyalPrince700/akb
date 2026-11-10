import { CalendarDays, Clock, Sparkles, Users } from "lucide-react";
import { columnFor } from "../constants.js";
import {
  formatDuration,
  formatShortDate,
  formatStamp,
  taskDurationMs,
  taskRelation,
  RELATION_STYLES,
} from "../utils.js";

export const TaskRelationBadge = ({ task, myId, className = "" }) => {
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

export const TaskTiming = ({ task }) => {
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

export const DurationNote = ({ task, className = "" }) => {
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

export const StatusPill = ({ status }) => {
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

export const TaskTime = ({ task, hideIcon = false }) => {
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

export const DueBadge = ({ dueDate, status, today, hideIcon = false }) => {
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