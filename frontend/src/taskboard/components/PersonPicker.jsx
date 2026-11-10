import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Avatar } from "./Avatar.jsx";
import { personId } from "../utils.js";

export default function PersonPicker({ people, selectedIds, ownerId, disabled, onChange }) {
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