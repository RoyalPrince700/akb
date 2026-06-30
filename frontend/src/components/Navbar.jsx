import { useState } from "react";
import { Gem, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import accessibleLogo from "../assets/accessiblelogo.png";
import { formatRoleLabel } from "../constants/crm";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/rolePaths";

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

const getFirstInitial = (name) => {
  const firstName = getFirstName(name);
  return firstName ? firstName.charAt(0).toUpperCase() : "?";
};

const adminBadgeClass = ({ isActive }) =>
  `text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "text-slate-900"
      : "text-slate-500 hover:text-slate-900"
  }`;

const mobileAdminBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "bg-slate-100 text-slate-900"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
  }`;

const hrBadgeClass = ({ isActive }) =>
  `text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "text-slate-900"
      : "text-slate-500 hover:text-slate-900"
  }`;

const mobileHrBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "bg-slate-100 text-slate-900"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
  }`;

const csrBadgeClass = ({ isActive }) =>
  `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
  }`;

const mobileCsrBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
  }`;

const csrAdminBadgeClass = ({ isActive }) =>
  `inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-violet-300 bg-violet-100 text-violet-900"
      : "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100"
  }`;

const mobileCsrAdminBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
    isActive
      ? "border-violet-300 bg-violet-100 text-violet-900"
      : "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100"
  }`;

const getRoleBadgeClass = (role, mobile = false) => {
  if (role === "csrAdmin") {
    return mobile ? mobileCsrAdminBadgeClass : csrAdminBadgeClass;
  }

  return mobile ? mobileCsrBadgeClass : csrBadgeClass;
};

const RoleBadge = ({ role }) => {
  const isCsrAdmin = role === "csrAdmin";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
        isCsrAdmin
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {formatRoleLabel(role)}
    </span>
  );
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

const NavLinks = ({ children, mobile = false, onNavigate }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const firstName = getFirstName(user?.name);
  const linkClass = mobile ? mobileNavLinkClass : navLinkClass;
  const adminClass = mobile ? mobileAdminBadgeClass : adminBadgeClass;
  const hrClass = mobile ? mobileHrBadgeClass : hrBadgeClass;
  const isCsrRole = user?.role === "csr" || user?.role === "csrAdmin";
  const csrPanelClass = getRoleBadgeClass(user?.role, mobile);
  const isLearningRole = ["staff", "hr", "admin"].includes(user?.role);

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
      {!loading && isAuthenticated && user && (
        <NavLink
          to={getDashboardPath(user.role)}
          end
          className={linkClass}
          onClick={onNavigate}
          data-text="Dashboard"
        >
          Dashboard
        </NavLink>
      )}
      <NavLink to="/courses" end className={linkClass} onClick={onNavigate} data-text="Courses">
        Courses
      </NavLink>
      <NavLink to="/assessments" className={linkClass} onClick={onNavigate} data-text="Assessments">
        Assessments
      </NavLink>
      {!loading && isAuthenticated && user && isLearningRole && (
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
      {isLearningRole && (
        <>
          <Link
            to="/leaderboard"
            onClick={onNavigate}
            className={
              mobile
                ? "inline-flex w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                : "inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            }
            title="Your gems"
          >
            <Gem className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>
              {user.gems ?? 0}
              {mobile ? " gems" : ""}
            </span>
          </Link>
          <NavLink
            to="/leaderboard"
            className={linkClass}
            onClick={onNavigate}
            data-text="Leaderboard"
          >
            Leaderboard
          </NavLink>
        </>
      )}
      {user.role === "admin" && (
        <NavLink to="/admin" className={adminClass} onClick={onNavigate}>
          Admin
        </NavLink>
      )}
      {user.role === "hr" && (
        <NavLink to="/hr" className={hrClass} onClick={onNavigate}>
          HR
        </NavLink>
      )}
      {(user.role === "csr" || user.role === "csrAdmin") && (
        <NavLink to="/csr" className={csrPanelClass} onClick={onNavigate}>
          {formatRoleLabel(user.role)}
        </NavLink>
      )}
      <Link
        to="/profile"
        onClick={onNavigate}
        aria-label={`${firstName}, go to profile`}
        className={
          mobile
            ? "inline-flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 transition hover:border-slate-400 hover:bg-slate-50"
            : "inline-flex items-center gap-2.5 transition hover:opacity-80"
        }
      >
        {!mobile && isCsrRole && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm font-semibold text-slate-700">{firstName}</span>
            <RoleBadge role={user.role} />
          </div>
        )}
        {mobile && isCsrRole && (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-semibold text-slate-900">{user.name}</span>
            <RoleBadge role={user.role} />
          </div>
        )}
        <span
          className={
            mobile
              ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-800 to-slate-950 text-sm font-bold text-white shadow-sm"
              : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-800 to-slate-950 text-xs font-bold text-white shadow-sm"
          }
          aria-hidden="true"
        >
          {getFirstInitial(user.name)}
        </span>
      </Link>
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

  if (!mobile) {
    return (
      <>
        <div className="flex items-center gap-8">{mainLinks}</div>
        {accountLinks && (
          <div className="ml-8 flex items-center gap-6 border-l border-slate-200 pl-8">
            {accountLinks}
          </div>
        )}
      </>
    );
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

const Navbar = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-10">
          <Link to="/" className="inline-flex shrink-0 items-center">
            <img
              src={accessibleLogo}
              alt="Accessible Publishers Ltd — Accessible Knowledge Base"
              className="h-11 w-auto max-w-[min(100%,240px)] object-contain object-left sm:h-12 sm:max-w-[min(100%,320px)]"
            />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden flex-1 items-center justify-end gap-6 lg:flex">
            <NavLinks>{children}</NavLinks>
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
