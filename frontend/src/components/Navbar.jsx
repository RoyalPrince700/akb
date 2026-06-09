import { useState } from "react";
import { Gem, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import accessibleLogo from "../assets/accessiblelogo.png";
import { useAuth } from "../context/AuthContext";
import { getResultsPath } from "../utils/rolePaths";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-blue-700 text-white"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? "bg-blue-700 text-white"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
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
  `rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
    isActive
      ? "bg-amber-700 text-white"
      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
  }`;

const mobileAdminBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wide transition ${
    isActive
      ? "bg-amber-700 text-white"
      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
  }`;

const hrBadgeClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
    isActive
      ? "bg-violet-700 text-white"
      : "bg-violet-100 text-violet-900 hover:bg-violet-200"
  }`;

const mobileHrBadgeClass = ({ isActive }) =>
  `flex w-full items-center rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wide transition ${
    isActive
      ? "bg-violet-700 text-white"
      : "bg-violet-100 text-violet-900 hover:bg-violet-200"
  }`;

const NavLinks = ({ children, mobile = false, onNavigate }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const firstName = getFirstName(user?.name);
  const linkClass = mobile ? mobileNavLinkClass : navLinkClass;
  const adminClass = mobile ? mobileAdminBadgeClass : adminBadgeClass;
  const hrClass = mobile ? mobileHrBadgeClass : hrBadgeClass;

  const handleChildNavClick = (event) => {
    if (mobile && onNavigate && event.target.closest("a")) {
      onNavigate();
    }
  };

  return (
    <>
      {children && (
        <div
          className={
            mobile
              ? "flex flex-col gap-1 [&>a]:flex [&>a]:w-full [&>a]:items-center [&>a]:rounded-xl [&>a]:px-4 [&>a]:py-3"
              : "contents"
          }
          onClick={handleChildNavClick}
        >
          {children}
        </div>
      )}
      <NavLink to="/courses" end className={linkClass} onClick={onNavigate}>
        Courses
      </NavLink>
      <NavLink to="/assessments" className={linkClass} onClick={onNavigate}>
        Assessments
      </NavLink>
      {!loading && isAuthenticated && user ? (
        <>
          <NavLink
            to={getResultsPath(user.role)}
            className={linkClass}
            onClick={onNavigate}
          >
            Results
          </NavLink>
          <Link
            to="/leaderboard"
            onClick={onNavigate}
            className={
              mobile
                ? "inline-flex w-full items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:bg-amber-100"
                : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:bg-amber-100"
            }
            title="Your gems"
          >
            <Gem className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span>
              {user.gems ?? 0}
              {mobile ? " gems" : ""}
            </span>
          </Link>
          <NavLink
            to="/leaderboard"
            className={linkClass}
            onClick={onNavigate}
          >
            Leaderboard
          </NavLink>
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
          <Link
            to="/profile"
            onClick={onNavigate}
            aria-label={`${firstName}, go to profile`}
            className={
              mobile
                ? "inline-flex w-full items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-slate-100"
                : "inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100"
            }
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white"
              aria-hidden="true"
            >
              {getFirstInitial(user.name)}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {firstName}
            </span>
          </Link>
        </>
      ) : (
        !loading && (
          <>
            <NavLink to="/login" className={linkClass} onClick={onNavigate}>
              Login
            </NavLink>
            <NavLink to="/signup" className={linkClass} onClick={onNavigate}>
              Sign up
            </NavLink>
          </>
        )
      )}
    </>
  );
};

const Navbar = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
            className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            <NavLinks>{children}</NavLinks>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-slate-950/40 lg:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <p className="text-sm font-semibold text-slate-950">Menu</p>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
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
