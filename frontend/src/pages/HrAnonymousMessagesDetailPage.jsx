import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Copy } from "lucide-react";

import PanelLayout from "../layouts/PanelLayout";
import { useAuth } from "../context/AuthContext";
import {
  getAnonymousMessageSession,
  updateAnonymousMessageSession,
} from "../services/api";
import { panelSegmentPath } from "../utils/rolePaths";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
};

const shareUrlForSession = (session) => {
  if (session?.token) {
    return `${window.location.origin}/anonymous-message/${session.token}`;
  }
  if (session?.sharePath) {
    return `${window.location.origin}${session.sharePath}`;
  }
  return session?.shareUrl || "";
};

const HrAnonymousMessagesDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const panelRole = user?.role === "admin" ? "admin" : "hr";
  const listPath = panelSegmentPath(panelRole, "anonymous-messages");

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAnonymousMessageSession(id);
      setSession(data.session || null);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load session.");
      setSession(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async () => {
    const url = shareUrlForSession(session);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setSuccess("Share link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
    }
  };

  const handleToggleActive = async () => {
    if (!session) return;
    setError("");
    setSuccess("");
    try {
      const data = await updateAnonymousMessageSession(session._id || session.id, {
        isActive: !session.isActive,
      });
      setSession(data.session);
      setSuccess(data.message || "Link updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update link.");
    }
  };

  return (
    <PanelLayout title="Anonymous messages">
      <div className="space-y-6">
        <div>
          <Link
            to={listPath}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Anonymous Messages
          </Link>
        </div>

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

        {loading ? (
          <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 text-sm text-slate-500">
            Loading session…
          </div>
        ) : !session ? (
          <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 text-sm text-slate-500">
            Session not found.
          </div>
        ) : (
          <>
            <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    {session.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {messages.length} message
                    {messages.length === 1 ? "" : "s"} · Created{" "}
                    {formatDateTime(session.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      session.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {session.isActive ? "Open" : "Closed"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-300"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    {session.isActive ? "Close link" : "Reopen link"}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Share link
                </p>
                <code className="mt-1 block break-all text-sm text-slate-800">
                  {shareUrlForSession(session)}
                </code>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-bold tracking-tight text-slate-950">
                Submissions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Messages are anonymous — no names or staff IDs are stored.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-3 font-medium">Message</th>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        Submitted at
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-3 py-10 text-center text-slate-500"
                        >
                          No messages yet. Share the link with staff.
                        </td>
                      </tr>
                    ) : (
                      messages.map((entry) => (
                        <tr
                          key={entry._id || entry.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-3 py-3 whitespace-pre-wrap text-slate-900">
                            {entry.message}
                          </td>
                          <td className="px-3 py-3 align-top whitespace-nowrap text-slate-600">
                            {formatDateTime(entry.submittedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </PanelLayout>
  );
};

export default HrAnonymousMessagesDetailPage;
