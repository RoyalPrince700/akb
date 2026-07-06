import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/rolePaths";

const EyeIcon = ({ hidden }) => {
  return hidden ? (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c1.56 0 3.04-.34 4.37-.95M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.066 7.5a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .638C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
};

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
  const [showPassword, setShowPassword] = useState(false);

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
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-950"
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
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
