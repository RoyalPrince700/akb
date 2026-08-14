import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { forgotPassword } from "../services/api";
import { getDashboardPath } from "../utils/rolePaths";

const ForgotPasswordPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await forgotPassword(email.trim().toLowerCase());
      setMessage(
        response.message ||
          "If an account exists for that email, we sent a password reset link."
      );
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          "Unable to send a reset link. Please try again later."
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
            Forgot password
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter the email on your account. If it matches a staff profile, we
            will send a link to reset your password.
          </p>

          {message ? (
            <div className="mt-8 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  placeholder="staff@example.com"
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
                {submitting ? "Sending link..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold text-blue-700">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
