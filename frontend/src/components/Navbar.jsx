import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import accessibleLogo from "../assets/accessiblelogo.png";
import NotificationBell from "./NotificationBell";
import { formatRoleLabel } from "../constants/crm";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath, isLearningRole } from "../utils/rolePaths";

const navLinkClass = ({ isActive }) =>
  `relative flex flex-col items-center justify-center py-1 text-sm transition-colors before:content-[attr(data-text)] before:font-bold before:h-0 before:invisible before:overflow-hidden ${
    isActive
      ? "font-bold text-slate-950 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:bg-slate-950"
      : "font-medium text-slate-500 hover:text-slate-900"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl px-4 py-3 text-sm transition-colors ${
    isActive
      ? "bg-slate-50 font-bold text-slate-950"
      : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
  }`;

const getFirstName = (name) => {
  if (!name?.trim()) {
    return "";
  }

  return name.trim().split(/\s+/)[0];
};

const adminBadgeClass = ({ isActive }) =>
  `inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-widest shadow-sm transition ${
    isActive
      ? "border-slate-300 bg-slate-100 text-slate-900"
      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
  }`;

const mobileAdminBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-slate-300 bg-slate-100 text-slate-900"
      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
  }`;

const hrBadgeClass = ({ isActive }) =>
  `inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-widest shadow-sm transition ${
    isActive
      ? "border-violet-300 bg-violet-100 text-violet-900"
      : "border-violet-200 bg-white text-violet-700 hover:border-violet-300 hover:bg-violet-50"
  }`;

const mobileHrBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-violet-300 bg-violet-100 text-violet-900"
      : "border-violet-200 bg-white text-violet-700 hover:border-violet-300 hover:bg-violet-50"
  }`;

const csrBadgeClass = ({ isActive }) =>
  `inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-widest shadow-sm transition ${
    isActive
      ? "border-emerald-400 bg-emerald-100 text-emerald-900"
      : "border-emerald-300 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50"
  }`;

const mobileCsrBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-emerald-400 bg-emerald-100 text-emerald-900"
      : "border-emerald-300 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50"
  }`;

const csrAdminBadgeClass = ({ isActive }) =>
  `inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-widest shadow-sm transition ${
    isActive
      ? "border-violet-300 bg-violet-100 text-violet-900"
      : "border-violet-200 bg-white text-violet-700 hover:border-violet-300 hover:bg-violet-50"
  }`;

const mobileCsrAdminBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-violet-300 bg-violet-100 text-violet-900"
      : "border-violet-200 bg-white text-violet-700 hover:border-violet-300 hover:bg-violet-50"
  }`;

const getRoleBadgeClass = (role, mobile = false) => {
  if (role === "admin") {
    return mobile ? mobileAdminBadgeClass : adminBadgeClass;
  }

  if (role === "hr") {
    return mobile ? mobileHrBadgeClass : hrBadgeClass;
  }

  if (role === "csrAdmin") {
    return mobile ? mobileCsrAdminBadgeClass : csrAdminBadgeClass;
  }

  return mobile ? mobileCsrBadgeClass : csrBadgeClass;
};

const authLinkClass =
  (variant, mobile = false) =>
  ({ isActive }) => {
    const shape = mobile
      ? "flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition"
      : "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition";

    if (variant === "primary") {
      return `${shape} bg-slate-950 text-white hover:bg-slate-800`;
    }

    return `${shape} border ${
      isActive
        ? "border-slate-300 bg-slate-50 text-slate-900"
        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
    }`;
  };

const NavLinks = ({ children, mobile = false, onNavigate, part = "all" }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const firstName = getFirstName(user?.name);
  const linkClass = mobile ? mobileNavLinkClass : navLinkClass;
  const roleDashboardPath = getDashboardPath(user?.role);
  const roleDashboardClass = getRoleBadgeClass(user?.role, mobile);
  const isCsrRole = user?.role === "csr" || user?.role === "csrAdmin";
  const canAccessLearning = isLearningRole(user?.role);
  const navbarDashboardPath = isCsrRole ? "/dashboard" : roleDashboardPath;

  const handleChildNavClick = (event) => {
    if (mobile && onNavigate && event.target.closest("a")) {
      onNavigate();
    }
  };

  const mainLinks = (
    <>
      {children && (
        <div
          className={
            mobile
              ? "flex flex-col gap-1 [&>a]:flex [&>a]:w-full [&>a]:items-center [&>a]:rounded-xl [&>a]:px-4 [&>a]:py-3"
              : "flex items-center gap-1"
          }
          onClick={handleChildNavClick}
        >
          {children}
        </div>
      )}
      <NavLink to="/" end className={linkClass} onClick={onNavigate} data-text="Home">
        Home
      </NavLink>
      {!loading && isAuthenticated && user && (
        <NavLink
          to={navbarDashboardPath}
          end
          className={linkClass}
          onClick={onNavigate}
          data-text="Dashboard"
        >
          Dashboard
        </NavLink>
      )}
      {!loading && isAuthenticated && user && (
        <NavLink
          to="/taskboard"
          className={linkClass}
          onClick={onNavigate}
          data-text="Taskboard"
        >
          Taskboard
        </NavLink>
      )}
      {!loading && isAuthenticated && user && (
        <NavLink
          to="/project-advance"
          className={linkClass}
          onClick={onNavigate}
          data-text="Project Advance"
        >
          Project Advance
        </NavLink>
      )}
      <NavLink to="/courses" end className={linkClass} onClick={onNavigate} data-text="Courses">
        Courses
      </NavLink>
      <NavLink to="/assessments" className={linkClass} onClick={onNavigate} data-text="Assessments">
        Assessments
      </NavLink>
      {!loading && isAuthenticated && user && canAccessLearning && (
        <NavLink
          to="/dashboard/results"
          className={linkClass}
          onClick={onNavigate}
          data-text="Results"
        >
          Results
        </NavLink>
      )}
    </>
  );

  const accountLinks = !loading && isAuthenticated && user ? (
    <>
      {mobile && canAccessLearning && (
        <NavLink
          to="/leaderboard"
          className={mobileNavLinkClass}
          onClick={onNavigate}
        >
          Leaderboard · {user.gems ?? 0} gems
        </NavLink>
      )}
      <div
        className={
          mobile
            ? "flex flex-col gap-2"
            : "flex items-center gap-4"
        }
      >
        {!mobile && <NotificationBell />}
        <div
          className={
            mobile
              ? "flex flex-col gap-2"
              : "flex items-center gap-3 border-l border-slate-200 pl-4"
          }
        >
          <Link
            to="/profile"
            onClick={onNavigate}
            aria-label={`${firstName || user.name}, go to profile`}
            className={
              mobile
                ? "inline-flex w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                : "inline-flex max-w-[9rem] items-center truncate rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            }
          >
            {mobile ? user.name : firstName}
          </Link>
          {user.role !== "staff" && (
            <NavLink
              to={roleDashboardPath}
              className={roleDashboardClass}
              onClick={onNavigate}
            >
              {formatRoleLabel(user.role)}
            </NavLink>
          )}
        </div>
      </div>
    </>
  ) : (
    !loading && (
      <>
        <NavLink
          to="/login"
          className={authLinkClass("secondary", mobile)}
          onClick={onNavigate}
        >
          Login
        </NavLink>
        <NavLink
          to="/signup"
          className={authLinkClass("primary", mobile)}
          onClick={onNavigate}
        >
          Sign up
        </NavLink>
      </>
    )
  );

  if (!mobile && part === "links") {
    return <div className="flex items-center gap-6">{mainLinks}</div>;
  }

  if (!mobile && part === "account") {
    return accountLinks ? <div className="flex items-center gap-3">{accountLinks}</div> : null;
  }

  return (
    <>
      {mainLinks}
      {accountLinks && (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
          {accountLinks}
        </div>
      )}
    </>
  );
};

const Navbar = ({ children, layout = "default" }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const taskboard = layout === "taskboard";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav
          className={`mx-auto flex w-full items-center justify-between gap-4 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center ${
            taskboard
              ? "max-w-[1600px] px-4 sm:px-6 lg:pr-8 lg:pl-0"
              : "max-w-7xl px-6 sm:px-8 lg:px-10"
          }`}
        >
          <Link to="/" className="inline-flex shrink-0 items-center justify-self-start">
            <img
              src={accessibleLogo}
              alt="Accessible Publishers Ltd — Accessible Knowledge Base"
              className="h-11 w-auto max-w-[min(100%,240px)] object-contain object-left sm:h-12 sm:max-w-[min(100%,320px)]"
            />
          </Link>

          <div className="hidden justify-self-center lg:flex">
            <NavLinks part="links">{children}</NavLinks>
          </div>

          <div className="flex items-center justify-self-end gap-2">
            <div className="flex items-center gap-2 lg:hidden">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            <div className="hidden lg:flex">
              <NavLinks part="account" />
            </div>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-60 bg-slate-950/40 lg:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-70 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <p className="text-sm font-semibold text-slate-950">Menu</p>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-full border border-slate-300 bg-white p-1.5 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <NavLinks mobile onNavigate={closeMobile}>
            {children}
          </NavLinks>
        </nav>
      </aside>
    </>
  );
};

export default Navbar;
