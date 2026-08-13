import {
  BookOpen,
  BookOpenCheck,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ContactRound,
  GraduationCap,
  Globe,
  LayoutDashboard,
  ListChecks,
  Lock,
  MessageSquare,
  MessageSquareShare,
  PhoneCall,
  Presentation,
  ScanFace,
  ScrollText,
  Settings,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import accessibleLogo from "../assets/accessiblelogo.png";
import { useAuth } from "../context/AuthContext";
import { formatRoleLabel, getCsrDisplayName } from "../constants/crm";
import { getDashboardPath, panelSegmentPath } from "../utils/rolePaths";

const sidebarLinkClass =
  (accent, collapsed, isHubPanel) =>
  ({ isActive }) => {
    if (accent === "csr") {
      const base = `group relative flex items-center overflow-hidden rounded-2xl text-sm font-semibold transition ${
        isActive
          ? "border border-white/[0.15] bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_42px_rgba(16,185,129,0.18)]"
          : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
      }`;
      return collapsed
        ? `${base} justify-center px-2 py-2.5`
        : `${base} gap-3 px-3 py-2.5`;
    }

    // Admin / HR / Security — match main site CTA / nav language
    const base = isHubPanel
      ? `flex items-center rounded-xl text-sm transition ${
          isActive
            ? "bg-slate-950 font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)]"
            : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-950"
        }`
      : `flex items-center rounded-xl text-sm font-semibold transition ${
          isActive
            ? "bg-slate-950 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)]"
            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
        }`;

    return collapsed
      ? `${base} justify-center px-2 py-2.5`
      : `${base} gap-3 px-3 py-2.5`;
  };

const PanelSidebar = ({
  accent,
  onNavigate,
  className = "",
  collapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const role = user?.role;
  const overviewPath = getDashboardPath(role);
  const isAdmin = role === "admin";
  const isHr = role === "hr";
  const isCsrPanel = role === "csr" || role === "csrAdmin";
  const isCsrAdmin = role === "csrAdmin";
  const isSecurity = role === "security";
  const isHubPanel = !isCsrPanel;

  const navItems = isSecurity
    ? [
        {
          to: overviewPath,
          end: true,
          label: "Attendance scan",
          icon: ScanFace,
        },
      ]
    : isCsrPanel
    ? [
        {
          to: overviewPath,
          end: true,
          label: "Overview",
          icon: LayoutDashboard,
        },
        {
          to: panelSegmentPath(role, "interactions"),
          label: isCsrAdmin ? "All Tickets" : "Tickets",
          icon: PhoneCall,
        },
        ...(isCsrAdmin
          ? [
              {
                to: panelSegmentPath(role, "csr-tickets"),
                label: "CSR Tickets",
                icon: ListChecks,
              },
            ]
          : []),
        {
          to: panelSegmentPath(role, "customers"),
          label: "Customer History",
          icon: ContactRound,
        },
        {
          to: panelSegmentPath(role, isCsrAdmin ? "csr-sales" : "sales-records"),
          label: isCsrAdmin ? "All Sales" : "Sales Records",
          icon: BookOpen,
        },
        {
          to: panelSegmentPath(role, "surveys"),
          label: "Surveys",
          icon: MessageSquareShare,
        },
        {
          to: panelSegmentPath(role, "settings"),
          label: "Settings",
          icon: Settings,
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
                to: panelSegmentPath(role, "upload-data"),
                label: "Upload Data",
                icon: Upload,
              },
              {
                to: panelSegmentPath(role, "directory"),
                label: "Customer Directory",
                icon: GraduationCap,
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
          to: panelSegmentPath(role, "attendance"),
          label: "Attendance",
          icon: ScanFace,
        },
        {
          to: panelSegmentPath(role, "kss-attendance"),
          label: "KSS Attendance",
          icon: Presentation,
        },
        {
          to: panelSegmentPath(role, "anonymous-messages"),
          label: "Anonymous",
          icon: MessageSquare,
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
          to: panelSegmentPath(role, "assessments"),
          label: "Lock Access",
          icon: Lock,
        },
        {
          to: panelSegmentPath(role, "materials"),
          label: isAdmin ? "Materials" : "Learning Materials",
          icon: BookOpen,
        },
      ];

  const panelLabel = isAdmin
    ? "Admin Panel"
    : isHr
      ? "HR Panel"
      : isSecurity
        ? "Security Panel"
        : "CRM Command";

  const toggleBtnClass = isCsrPanel
    ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
    : "border border-slate-200/80 bg-white/80 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-white";

  return (
    <aside
      className={`flex h-screen w-full shrink-0 flex-col transition-[width] duration-200 ${
        isCsrPanel
          ? "border-r border-white/10 bg-[#070a0f] text-white shadow-[24px_0_80px_rgba(15,23,42,0.22)]"
          : "border-r border-slate-200/70 bg-white/90 text-slate-950 backdrop-blur-xl"
      } ${className}`}
    >
      <div
        className={`flex items-center border-b ${
          isCsrPanel ? "border-white/10" : "border-slate-200/70"
        } ${collapsed ? "flex-col gap-2 px-2 py-4" : "justify-between px-4 py-5"}`}
      >
        {collapsed ? (
          isHubPanel ? (
            <img
              src={accessibleLogo}
              alt=""
              className="h-9 w-9 rounded-xl object-contain"
              title={panelLabel}
            />
          ) : (
            <div
              className={`grid h-10 w-10 place-items-center rounded-2xl text-sm font-black tracking-[-0.08em] ${
                isCsrPanel
                  ? "bg-white/10 text-emerald-300"
                  : "bg-slate-950 text-white"
              }`}
              title={panelLabel}
            >
              AKH
            </div>
          )
        ) : isHubPanel ? (
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
              {panelLabel}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <img
                src={accessibleLogo}
                alt="Accessible Knowledge Hub"
                className="h-9 w-auto max-w-[148px] object-contain object-left"
              />
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <p
              className={`text-xs font-medium ${
                isCsrPanel ? "text-emerald-300" : "text-blue-700"
              }`}
            >
              {panelLabel}
            </p>
          </div>
        )}

        <div className={`flex items-center gap-1.5 ${collapsed ? "" : "shrink-0"}`}>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden rounded-xl p-1.5 transition lg:inline-flex ${toggleBtnClass}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronsRight className="h-5 w-5" />
              ) : (
                <ChevronsLeft className="h-5 w-5" />
              )}
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              onClick={onNavigate}
              className={`rounded-xl p-1.5 transition lg:hidden ${toggleBtnClass}`}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {isCsrPanel && !collapsed && (
        <div className="mx-3 mt-4 rounded-[26px] border border-white/10 bg-white/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Today
          </p>
          <p className="mt-2 text-sm font-semibold leading-5 text-white">
            Resolve faster. Record cleaner. Delight every school.
          </p>
        </div>
      )}

      {isHubPanel && !collapsed && (
        <div className="mx-3 mt-4 rounded-[26px] border border-slate-200/70 bg-linear-to-br from-blue-50/90 via-white to-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Knowledge Hub
          </p>
          <p className="mt-2 text-sm font-semibold leading-5 tracking-[-0.02em] text-slate-950">
            Staff development tools in one calm workspace.
          </p>
        </div>
      )}

      <nav
        className={`flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden ${
          collapsed ? "p-2" : "p-3"
        }`}
      >
        {navItems.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={sidebarLinkClass(accent, collapsed, isHubPanel)}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${
                isCsrPanel ? "text-current transition group-hover:scale-105" : ""
              }`}
              aria-hidden
            />
            {!collapsed && <span className="truncate">{label}</span>}
            {collapsed && <span className="sr-only">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div
        className={`border-t ${isCsrPanel ? "border-white/10" : "border-slate-200/70"} ${
          collapsed ? "p-2" : "p-3"
        }`}
      >
        <Link
          to="/"
          onClick={onNavigate}
          title={collapsed ? "Back to website" : undefined}
          className={`flex items-center rounded-xl text-sm transition ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          } ${
            isCsrPanel
              ? "font-semibold text-slate-400 hover:bg-white/8 hover:text-white"
              : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <Globe className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">Back to website</span>}
          {collapsed && <span className="sr-only">Back to website</span>}
        </Link>
      </div>

      <div
        className={`border-t ${isCsrPanel ? "border-white/10" : "border-slate-200/70"} ${
          collapsed ? "p-2" : "p-4"
        }`}
      >
        {collapsed ? (
          <div
            className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${
              isCsrPanel
                ? "bg-white/10 text-emerald-300"
                : "border border-slate-200/80 bg-slate-50 text-slate-800"
            }`}
            title={`${isCsrPanel ? getCsrDisplayName(user) : user?.name} · ${formatRoleLabel(user?.role)}`}
          >
            {(isCsrPanel ? getCsrDisplayName(user) : user?.name || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
        ) : (
          <>
            <p
              className={`truncate text-sm font-semibold tracking-[-0.02em] ${
                isCsrPanel ? "text-white" : "text-slate-950"
              }`}
            >
              {isCsrPanel ? getCsrDisplayName(user) : user?.name}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
              {formatRoleLabel(user?.role)}
            </p>
          </>
        )}
      </div>
    </aside>
  );
};

export default PanelSidebar;
