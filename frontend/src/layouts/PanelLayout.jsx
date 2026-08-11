import { useEffect, useState } from "react";
import { Home, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import PanelSidebar from "../components/PanelSidebar";
import accessibleLogo from "../assets/accessiblelogo.png";
import { useAuth } from "../context/AuthContext";
import { formatRoleLabel } from "../constants/crm";

const SIDEBAR_COLLAPSED_KEY = "panel-sidebar-collapsed";

const PanelLayout = ({ children, title }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const accent =
    user?.role === "admin"
      ? "admin"
      : user?.role === "hr"
        ? "hr"
        : user?.role === "security"
          ? "security"
          : "csr";
  const isCsrPanel = user?.role === "csr" || user?.role === "csrAdmin";
  /** Admin / HR / Security — share Knowledge Hub marketing visual language */
  const isHubPanel = !isCsrPanel;

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore storage failures */
    }
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobile = () => setMobileOpen(false);
  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  const sidebarWidthClass = collapsed ? "lg:w-16" : "lg:w-64";
  const mainOffsetClass = collapsed ? "lg:ml-16" : "lg:ml-64";

  const iconBtnClass = isHubPanel
    ? "rounded-xl border border-slate-200/80 bg-white/80 p-2 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
    : "rounded-xl border border-slate-200/80 bg-white p-2 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50";

  return (
    <div
      className={`relative min-h-screen ${
        isHubPanel ? "bg-slate-50 text-slate-950" : "bg-slate-50"
      }`}
    >
      {isHubPanel && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-linear-to-br from-blue-100/55 via-white to-slate-50"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl"
            aria-hidden
          />
        </>
      )}

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      {/* Mobile drawer — always full-width labels */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <PanelSidebar accent={accent} onNavigate={closeMobile} collapsed={false} />
      </div>

      {/* Desktop sidebar — collapsible */}
      <div
        className={`fixed inset-y-0 left-0 z-50 hidden w-64 transform transition-[width] duration-200 lg:block ${sidebarWidthClass}`}
      >
        <PanelSidebar
          accent={accent}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </div>

      <div
        className={`relative flex min-h-screen min-w-0 flex-col transition-[margin] duration-200 ${mainOffsetClass}`}
      >
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
            isHubPanel
              ? "border-slate-200/60 bg-white/75"
              : "border-slate-200/70 bg-white/90"
          }`}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={`${iconBtnClass} lg:hidden`}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={toggleCollapsed}
                className={`hidden lg:inline-flex ${iconBtnClass}`}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
              <div className="min-w-0">
                {isHubPanel && (
                  <p className="hidden text-xs font-medium leading-none text-slate-500 sm:block">
                    Accessible Knowledge Hub
                  </p>
                )}
                <h1
                  className={`truncate font-bold text-slate-950 ${
                    isHubPanel
                      ? "text-lg tracking-[-0.04em] sm:text-xl"
                      : "text-xl tracking-tight sm:text-2xl"
                  }`}
                >
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              {isHubPanel && (
                <>
                  <span className="hidden rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600 sm:inline-flex">
                    {formatRoleLabel(user?.role)}
                  </span>
                  <Link
                    to="/"
                    className="hidden items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700 sm:inline-flex"
                  >
                    <Home className="h-4 w-4" aria-hidden />
                    Site home
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
              {isCsrPanel && (
                <Link to="/" className="inline-flex shrink-0 items-center">
                  <img
                    src={accessibleLogo}
                    alt="Accessible Publishers Ltd — Accessible Knowledge Base"
                    className="h-9 w-auto max-w-[min(100%,180px)] object-contain object-left sm:h-10 sm:max-w-[min(100%,220px)]"
                  />
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="relative flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {isHubPanel && (
            <div className="relative mb-8 overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] sm:mb-10 sm:p-8">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-br from-blue-100/60 via-white to-white"
                aria-hidden
              />
              <div className="relative">
                <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                  {user?.role === "admin"
                    ? "Admin workspace"
                    : user?.role === "hr"
                      ? "HR workspace"
                      : user?.role === "security"
                        ? "Security workspace"
                        : "Workspace"}
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-4xl">
                  {title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  Same calm Knowledge Hub experience as the public site — tools
                  for your{" "}
                  {formatRoleLabel(user?.role)?.toLowerCase() || "team"} role.
                </p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default PanelLayout;
