import { useState } from "react";
import { Home, LogOut, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Footer from "../components/Footer";
import PanelSidebar from "../components/PanelSidebar";
import { useAuth } from "../context/AuthContext";

const PanelLayout = ({ children, title }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const accent = user?.role === "admin" ? "admin" : "hr";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <PanelSidebar accent={accent} onNavigate={closeMobile} />
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="hidden text-xs font-medium text-slate-500 sm:block">
                  Knowledge Hub
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
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
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default PanelLayout;
