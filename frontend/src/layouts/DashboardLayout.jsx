import { NavLink, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-blue-700 text-white"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
  }`;

const DashboardLayout = ({ children, title }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar>
        <NavLink to="/dashboard" end className={navLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/dashboard/results" className={navLinkClass}>
          My Results
        </NavLink>
      </Navbar>

      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
