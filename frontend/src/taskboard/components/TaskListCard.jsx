import { AvatarStack } from "./Avatar.jsx";
import { TaskRelationBadge, StatusPill, TaskTime, DueBadge, DurationNote } from "./TaskMeta.jsx";
import { TaskChatButton } from "./TaskActions.jsx";

export default function TaskListCard({ title, accent, empty, tasks, today, myId, onOpen, onOpenChat }) {
  return (
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
}