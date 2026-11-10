import { Pencil, PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { Avatar } from "./Avatar.jsx";

export default function TaskboardSidebar({
  collapsed,
  onToggleCollapse,
  onClose,
  view,
  views,
  counts,
  me,
  onChangeAvatar,
  onSelectView,
}) {
  const showLabels = !collapsed;

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={`flex items-center border-b border-slate-100 py-3 ${
          showLabels ? "justify-between gap-3 px-4" : "justify-center px-2"
        }`}
      >
        {showLabels && (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_6px_14px_rgba(99,102,241,0.3)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">Taskboard</p>
              <p className="truncate text-[11px] font-medium text-slate-400">Team workspace</p>
            </div>
          </div>
        )}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3" aria-label="Taskboard views">
        {showLabels && (
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Views
          </p>
        )}
        {views.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          const count = counts[item.id] ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={active ? "page" : undefined}
              title={showLabels ? item.hint : `${item.label} (${count})`}
              className={`flex w-full items-center rounded-2xl text-sm font-semibold transition ${
                showLabels ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
              } ${
                active
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  active ? `${item.tone} text-white` : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {showLabels && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate">{item.label}</span>
                    <span
                      className={`block truncate text-[11px] font-medium ${
                        active ? "text-violet-500" : "text-slate-400"
                      }`}
                    >
                      {item.hint}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      active ? "bg-white text-violet-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-slate-100 ${showLabels ? "p-3" : "p-2"}`}>
        {showLabels ? (
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onChangeAvatar}
                className="group relative shrink-0 rounded-full"
                title="Change your avatar"
              >
                <Avatar person={me} size="lg" />
                <span className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-white ring-2 ring-white transition group-hover:bg-violet-600">
                  <Pencil className="h-2.5 w-2.5" />
                </span>
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{me?.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {[me?.position, me?.department].filter(Boolean).join(" · ") || "Team member"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onChangeAvatar}
            className="flex w-full justify-center rounded-2xl py-1 transition hover:bg-slate-50"
            title="Change your avatar"
          >
            <Avatar person={me} size="md" />
          </button>
        )}
      </div>
    </div>
  );
};