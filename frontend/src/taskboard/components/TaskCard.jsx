import { involves } from "../utils.js";
import { AvatarStack } from "./Avatar.jsx";
import { PriorityPill } from "./Priority.jsx";
import { TaskRelationBadge, DurationNote, TaskTime, DueBadge } from "./TaskMeta.jsx";
import { TaskChatButton } from "./TaskActions.jsx";

export default function TaskCard({ task, today, myId, movable, onOpen, onOpenChat, onDragState }) {
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