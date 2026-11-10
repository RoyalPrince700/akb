import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Flag } from "lucide-react";
import { PRIORITIES, PRIORITY_STYLES, fieldClass } from "../constants.js";

export const PRIORITY_FILTER_OPTIONS = [
  { id: "all", label: "All priorities" },
  ...PRIORITIES,
];

export const PriorityPill = ({ priority, className = "" }) => {
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

export const PriorityFilter = ({ value, onChange, className = "" }) => {
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