import {
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  Globe,
  LayoutDashboard,
  Users,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getDashboardPath, panelSegmentPath } from "../utils/rolePaths";

const sidebarLinkClass =
  (accent) =>
  ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive
        ? accent === "admin"
          ? "bg-slate-950 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)]"
          : "bg-violet-700 text-white shadow-[0_1px_2px_rgba(76,29,149,0.12),0_8px_18px_rgba(76,29,149,0.14)]"
        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
    }`;

const PanelSidebar = ({ accent, onNavigate, className = "" }) => {
  const { user } = useAuth();
  const role = user?.role;
  const overviewPath = getDashboardPath(role);
  const isAdmin = role === "admin";

  const navItems = [
    {
      to: overviewPath,
      end: true,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      to: panelSegmentPath(role, "staff"),
      label: "Staff",
      icon: Users,
    },
    {
      to: panelSegmentPath(role, "completions"),
      label: "Course Completions",
      icon: BookOpenCheck,
    },
    {
      to: panelSegmentPath(role, "results"),
      label: "Assessment Results",
      icon: ClipboardList,
    },
    {
      to: panelSegmentPath(role, "materials"),
      label: isAdmin ? "Materials" : "Learning Materials",
      icon: BookOpen,
    },
  ];

  const panelLabel = isAdmin ? "Admin Panel" : "HR Panel";

  return (
    <aside
      className={`flex h-full w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-5">
        <div>
          <p
            className={`text-xs font-medium ${
              isAdmin ? "text-blue-700" : "text-violet-700"
            }`}
          >
            {panelLabel}
          </p>
          <p className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">
            AKH
          </p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={sidebarLinkClass(accent)}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-950"
        >
          <Globe className="h-5 w-5 shrink-0" aria-hidden />
          Back to website
        </Link>
      </div>

      <div className="border-t border-slate-200 p-4">
        <p className="truncate text-sm font-semibold text-slate-950">
          {user?.name}
        </p>
        <p className="truncate text-xs capitalize text-slate-500">{user?.role}</p>
      </div>
    </aside>
  );
};

export default PanelSidebar;
