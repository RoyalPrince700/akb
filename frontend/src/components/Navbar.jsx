import { Gem } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import accessibleLogo from "../assets/accessiblelogo.png";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
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

const hrBadgeClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
    isActive
      ? "bg-violet-700 text-white"
      : "bg-violet-100 text-violet-900 hover:bg-violet-200"
  }`;

const Navbar = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const firstName = getFirstName(user?.name);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link to="/" className="inline-flex shrink-0 items-center">
          <img
            src={accessibleLogo}
            alt="Accessible Publishers Ltd — Accessible Knowledge Base"
            className="h-11 w-auto max-w-[min(100%,320px)] object-contain object-left sm:h-12"
          />
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {children}
          <NavLink to="/courses" end className={navLinkClass}>
            Courses
          </NavLink>
          <NavLink to="/assessments" className={navLinkClass}>
            Assessments
          </NavLink>
          {!loading && isAuthenticated && user ? (
            <>
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:bg-amber-100"
                title="Your gems"
              >
                <Gem className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <span>{user.gems ?? 0}</span>
              </Link>
              <NavLink to="/leaderboard" className={navLinkClass}>
                Leaderboard
              </NavLink>
              {user.role === "admin" && (
                <NavLink to="/admin" className={adminBadgeClass}>
                  Admin
                </NavLink>
              )}
              {user.role === "hr" && (
                <NavLink to="/hr" className={hrBadgeClass}>
                  HR
                </NavLink>
              )}
              <Link
                to="/profile"
                aria-label={`${firstName}, go to profile`}
                className="inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100"
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
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/signup" className={navLinkClass}>
                  Sign up
                </NavLink>
              </>
            )
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
