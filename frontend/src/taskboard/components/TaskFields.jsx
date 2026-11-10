import { useRef } from "react";
import { COLUMNS, PRIORITIES, fieldClass } from "../constants.js";
import { personId } from "../utils.js";
import PersonPicker from "./PersonPicker.jsx";

const FieldLabel = ({ children }) => (
  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
    {children}
  </span>
);

export const TaskFields = ({ draft, people, disabled, showStatus = true, onChange }) => {
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

export const QuickTaskFields = ({ draft, people, disabled, onChange }) => {
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
