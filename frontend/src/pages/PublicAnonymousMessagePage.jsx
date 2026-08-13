import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import Navbar from "../components/Navbar";
import {
  previewAnonymousMessage,
  submitAnonymousMessage,
} from "../services/api";

const PublicAnonymousMessagePage = () => {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await previewAnonymousMessage(token);
        setSession(data.session || null);
        if (data.session && !data.session.isActive) {
          setError(
            "This anonymous message link is closed. Contact HR if you need help."
          );
        }
      } catch (apiError) {
        setSession(null);
        setError(
          apiError.response?.data?.message ||
            "Invalid or expired anonymous message link."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    } else {
      setLoading(false);
      setError("Invalid anonymous message link.");
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setFormError("Please enter your message or question.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      await submitAnonymousMessage(token, { message: trimmed });
      setSubmitted(true);
      setMessage("");
    } catch (apiError) {
      setFormError(
        apiError.response?.data?.message || "Unable to submit your message."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isClosed = Boolean(session && !session.isActive);
  const canSubmit = Boolean(session?.isActive) && !submitted && !error;

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            AKB · Anonymous Message
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading…</p>
          ) : error && !session ? (
            <div className="mt-5 flex items-start gap-3">
              <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-rose-500" />
              <div>
                <h1 className="text-2xl font-bold text-slate-950">
                  Link unavailable
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
              </div>
            </div>
          ) : submitted ? (
            <div className="mt-5 flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-950">
                  Message sent
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your message was submitted anonymously. Thank you for sharing.
                </p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">
                {session?.title || "Anonymous message"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your submission is anonymous. Do not include your name or staff
                ID unless you want to be identified.
              </p>

              {isClosed || error ? (
                <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {error ||
                    "This anonymous message link is closed. Contact HR if you need help."}
                </p>
              ) : null}

              {canSubmit ? (
                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  {formError ? (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {formError}
                    </p>
                  ) : null}

                  <div>
                    <label
                      htmlFor="message"
                      className="text-sm font-medium text-slate-700"
                    >
                      Your message or question
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={message}
                      onChange={(event) => {
                        setMessage(event.target.value);
                        setFormError("");
                      }}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      placeholder="Write your feedback or question here…"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit anonymously"}
                  </button>
                </form>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default PublicAnonymousMessagePage;
