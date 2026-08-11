import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Eye, Link2, Plus } from "lucide-react";

import PanelLayout from "../layouts/PanelLayout";
import { useAuth } from "../context/AuthContext";
import {
  createKssSession,
  listKssSessions,
  updateKssSession,
} from "../services/api";
import { panelSegmentPath } from "../utils/rolePaths";

const todayKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  // value is YYYY-MM-DD
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
};

const shareUrlForSession = (session) => {
  if (session?.attendanceUrl && typeof window === "undefined") {
    return session.attendanceUrl;
  }
  if (session?.token) {
    return `${window.location.origin}/kss-attendance/${session.token}`;
  }
  if (session?.attendancePath) {
    return `${window.location.origin}${session.attendancePath}`;
  }
  return session?.attendanceUrl || "";
};

const HrKssAttendancePage = () => {
  const { user } = useAuth();
  const panelRole = user?.role === "admin" ? "admin" : "hr";
  const basePath = panelSegmentPath(panelRole, "kss-attendance");

  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [createdLink, setCreatedLink] = useState("");

  const [form, setForm] = useState({
    date: todayKey(),
    topic: "",
    takenBy: "",
  });

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listKssSessions({ page, limit: 15 });
      setSessions(data.sessions || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load KSS sessions.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    setCreatedLink("");

    try {
      const data = await createKssSession({
        date: form.date,
        topic: form.topic.trim(),
        takenBy: form.takenBy.trim(),
      });
      const session = data.session;
      const url = shareUrlForSession(session);
      setCreatedLink(url);
      setSuccess(data.message || "KSS session created.");
      setForm({ date: todayKey(), topic: "", takenBy: "" });
      setPage(1);
      await loadSessions();

      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(session?._id || session?.id || "created");
      } catch {
        // clipboard optional
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create KSS session.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (session) => {
    const url = shareUrlForSession(session);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(session._id || session.id);
      setSuccess("Attendance link copied.");
      setTimeout(() => setCopiedId(""), 2000);
    } catch {
      setError("Could not copy link. Select and copy it manually.");
      setCreatedLink(url);
    }
  };

  const handleToggleActive = async (session) => {
    setError("");
    setSuccess("");
    try {
      const data = await updateKssSession(session._id || session.id, {
        isActive: !session.isActive,
      });
      setSuccess(data.message || "Session updated.");
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update session.");
    }
  };

  return (
    <PanelLayout title="KSS Attendance">
      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {success}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                Create KSS session
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Generate a shareable link for staff to mark attendance for this
                Knowledge Sharing Session.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCreate}
            className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                KSS date
              </span>
              <input
                type="date"
                name="date"
                required
                value={form.date}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block text-sm md:col-span-1 lg:col-span-1">
              <span className="mb-1.5 block font-medium text-slate-700">
                Topic
              </span>
              <input
                type="text"
                name="topic"
                required
                value={form.topic}
                onChange={handleFormChange}
                placeholder="e.g. Solution selling refresh"
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Who is taking the KSS
              </span>
              <input
                type="text"
                name="takenBy"
                required
                value={form.takenBy}
                onChange={handleFormChange}
                placeholder="Facilitator name"
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating…" : "Create session"}
              </button>
            </div>
          </form>

          {createdLink ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Shareable attendance link
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all text-sm text-slate-800">
                  {createdLink}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy({
                      token: createdLink.split("/").pop(),
                      attendanceUrl: createdLink,
                    })
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400"
                >
                  {copiedId === "created" ||
                  createdLink.endsWith(copiedId) ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy link
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                Sessions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {pagination.total} session{pagination.total === 1 ? "" : "s"}{" "}
                total
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Topic</th>
                  <th className="px-3 py-3 font-medium">Facilitator</th>
                  <th className="px-3 py-3 font-medium">Attendees</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      Loading sessions…
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      No KSS sessions yet. Create one above to generate a link.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => {
                    const id = session._id || session.id;
                    const isCopied = copiedId === id;
                    return (
                      <tr
                        key={id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {formatDate(session.date)}
                        </td>
                        <td className="px-3 py-3 text-slate-800">
                          {session.topic}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {session.takenBy}
                        </td>
                        <td className="px-3 py-3 text-slate-800">
                          {session.attendanceCount ?? 0}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              session.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {session.isActive ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {formatDateTime(session.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`${basePath}/${id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleCopy(session)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              {isCopied ? "Copied" : "Copy link"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(session)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {session.isActive ? "Close" : "Reopen"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </PanelLayout>
  );
};

export default HrKssAttendancePage;
