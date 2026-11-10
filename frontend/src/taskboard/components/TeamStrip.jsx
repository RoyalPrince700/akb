import { Avatar } from "./Avatar.jsx";
import { personId } from "../utils.js";

export default function TeamStrip({ people, meId, onChangeMine }) {
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