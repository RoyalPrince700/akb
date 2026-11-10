import { avatarSrcFor } from "../../utils/avatars.js";
import { AVATAR_SIZES } from "../constants.js";
import { personId } from "../utils.js";

export const Avatar = ({ person, size = "sm", className = "", style }) => (
  <img
    src={avatarSrcFor(person)}
    alt={person?.name || "Staff"}
    title={person?.name || ""}
    draggable={false}
    style={style}
    className={`shrink-0 rounded-full bg-slate-100 object-cover ring-2 ring-white shadow-[0_0_0_1px_rgba(15,23,42,0.04)] ${AVATAR_SIZES[size]} ${className}`}
  />
);

export const AvatarStack = ({ people = [], max = 3, size = "sm", emptyLabel = "Unassigned" }) => {
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
