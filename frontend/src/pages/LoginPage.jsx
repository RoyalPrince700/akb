import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/rolePaths";

const LoginPage = () => {
  const { isAuthenticated, login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    staffId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(formData);
      const fallbackPath = getDashboardPath(loggedInUser.role);
      const redirectPath = location.state?.from?.pathname || fallbackPath;
      navigate(redirectPath, { replace: true });
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          "Unable to log in. Check your staff ID and password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-10 pt-8 lg:px-8">
        <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Sign in to AKH
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use your staff ID and password to access company learning materials,
          assessments, and results.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="staffId"
              className="text-sm font-medium text-slate-700"
            >
              Staff ID
            </label>
            <input
              id="staffId"
              name="staffId"
              type="text"
              value={formData.staffId}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              placeholder="APL001"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Need an account?{" "}
            <Link to="/signup" className="font-semibold text-blue-700">
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
