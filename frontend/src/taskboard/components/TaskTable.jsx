import { Check, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { COLUMNS, columnFor } from "../constants.js";
import { involves } from "../utils.js";
import { Avatar, AvatarStack } from "./Avatar.jsx";
import { PriorityPill } from "./Priority.jsx";
import {
  StatusPill,
  TaskRelationBadge,
  DurationNote,
  DueBadge,
  TaskTime,
} from "./TaskMeta.jsx";
import { TaskUploadButton, TaskChatButton } from "./TaskActions.jsx";

export default function TaskTable({
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
}) {
  return (
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
}

function TaskRow({
  task,
  today,
  myId,
  movable,
  onOpen,
  onOpenChat,
  onUpload,
  uploadingTaskId,
  onMove,
}) {
  const done = task.status === "done";
  const column = columnFor(task.status);

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (event.target.closest("button, a, input, select, label, [data-row-ignore]")) {
          return;
        }
        onOpen(task);
      }}
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