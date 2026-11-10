import { StatusPill, TaskTime, DueBadge, DurationNote } from "./TaskMeta.jsx";

export default function PreviousTaskList({ tasks, today, movingTaskId, empty, onOpen, onMove }) {
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