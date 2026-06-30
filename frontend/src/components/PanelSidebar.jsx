import {
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  ContactRound,
  Globe,
  LayoutDashboard,
  MessageSquareShare,
  PhoneCall,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { formatRoleLabel } from "../constants/crm";
import { getDashboardPath, panelSegmentPath } from "../utils/rolePaths";

const sidebarLinkClass =
  (accent) =>
  ({ isActive }) =>
    accent === "csr"
      ? `group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-semibold transition ${
          isActive
            ? "border border-white/[0.15] bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_42px_rgba(16,185,129,0.18)]"
            : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
        }`
      : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
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
  const isHr = role === "hr";
  const isCsrPanel = role === "csr" || role === "csrAdmin";
  const isCsrAdmin = role === "csrAdmin";

  const navItems = isCsrPanel
    ? [
        {
          to: overviewPath,
          end: true,
          label: "Overview",
          icon: LayoutDashboard,
        },
        {
          to: panelSegmentPath(role, "interactions"),
          label: "Tickets",
          icon: PhoneCall,
        },
        {
          to: panelSegmentPath(role, "customers"),
          label: "Customer History",
          icon: ContactRound,
        },
        {
          to: panelSegmentPath(role, "sales-records"),
          label: "Sales Records",
          icon: BookOpen,
        },
        {
          to: panelSegmentPath(role, "surveys"),
          label: "Surveys",
          icon: MessageSquareShare,
        },
        ...(isCsrAdmin
          ? [
              {
                to: panelSegmentPath(role, "staff"),
                label: "CSR Team",
                icon: Users,
              },
              {
                to: panelSegmentPath(role, "sales-reps"),
                label: "Sales Reps",
                icon: Users,
              },
              {
                to: panelSegmentPath(role, "reports"),
                label: "Reports",
                icon: ScrollText,
              },
              {
                to: panelSegmentPath(role, "survey-responses"),
                label: "Survey Responses",
                icon: ClipboardList,
              },
            ]
          : []),
      ]
    : [
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

  const panelLabel = isAdmin ? "Admin Panel" : isHr ? "HR Panel" : "CRM Command";

  return (
    <aside
      className={`flex h-screen w-full shrink-0 flex-col ${
        isCsrPanel
          ? "border-r border-white/10 bg-[#070a0f] text-white shadow-[24px_0_80px_rgba(15,23,42,0.22)]"
          : "border-r border-slate-200/70 bg-white"
      } ${className}`}
    >
      <div
        className={`flex items-center justify-between ${
          isCsrPanel ? "border-b border-white/10 px-4 py-5" : "border-b border-slate-200/70 px-4 py-5"
        }`}
      >
        <div>
          <p
            className={`text-xs font-medium ${
              isAdmin
                ? "text-blue-700"
                : isHr
                  ? "text-violet-700"
                  : "text-emerald-300"
            }`}
          >
            {panelLabel}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-2xl text-sm font-black tracking-[-0.08em] ${
                isCsrPanel
                  ? "bg-linear-to-br from-white via-emerald-100 to-emerald-300 text-slate-950 shadow-[0_18px_40px_rgba(16,185,129,0.2)]"
                  : "bg-slate-950 text-white"
              }`}
            >
              AKH
            </div>
            <div>
              <p
                className={`text-lg font-bold tracking-[-0.045em] ${
                  isCsrPanel ? "text-white" : "text-slate-950"
                }`}
              >
                Assist
              </p>
              {isCsrPanel && (
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                  Premium CRM
                </p>
              )}
            </div>
          </div>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className={`rounded-xl p-1.5 transition lg:hidden ${
              isCsrPanel
                ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isCsrPanel && (
        <div className="mx-3 mt-4 rounded-[26px] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Today
          </p>
          <p className="mt-2 text-sm font-semibold leading-5 text-white">
            Resolve faster. Record cleaner. Delight every school.
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {navItems.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={sidebarLinkClass(accent)}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${
                isCsrPanel ? "text-current transition group-hover:scale-105" : ""
              }`}
              aria-hidden
            />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={`${isCsrPanel ? "border-t border-white/10" : "border-t border-slate-200"} p-3`}>
        <Link
          to="/"
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
            isCsrPanel
              ? "text-slate-400 hover:bg-white/8 hover:text-white"
              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
          }`}
        >
          <Globe className="h-5 w-5 shrink-0" aria-hidden />
          Back to website
        </Link>
      </div>

      <div className={`${isCsrPanel ? "border-t border-white/10" : "border-t border-slate-200"} p-4`}>
        <p className={`truncate text-sm font-semibold ${isCsrPanel ? "text-white" : "text-slate-950"}`}>
          {user?.name}
        </p>
        <p className={`truncate text-xs ${isCsrPanel ? "text-slate-500" : "text-slate-500"}`}>
          {formatRoleLabel(user?.role)}
        </p>
      </div>
    </aside>
  );
};

export default PanelSidebar;
