import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { markKssAttendance } from "../services/api";
import { getDashboardPath } from "../utils/rolePaths";

const formatDate = (value) => {
  if (!value) return "—";
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
};

/**
 * Staff-facing KSS attendance mark page.
 * Route is wrapped in ProtectedRoute so unauthenticated users are sent to login
 * with return path, then this page auto-marks on load after login.
 */
const KssAttendanceMarkPage = () => {
  const { token } = useParams();
  const { user } = useAuth();
  const homePath = getDashboardPath(user?.role) || "/";
  const [status, setStatus] = useState("loading"); // loading | success | already | closed | error
  const [session, setSession] = useState(null);
  const [mark, setMark] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStatus("loading");
      setMessage("");
      try {
        const data = await markKssAttendance(token);
        if (cancelled) return;

        setSession(data.session || null);
        setMark(data.mark || null);

        if (data.newlyMarked) {
          setStatus("success");
          setMessage(data.message || "Attendance recorded");
        } else if (data.alreadyMarked) {
          setStatus("already");
          setMessage(data.message || "Attendance already recorded");
        } else {
          setStatus("success");
          setMessage(data.message || "Attendance recorded");
        }
      } catch (err) {
        if (cancelled) return;
        const apiMessage =
          err.response?.data?.message || "Unable to record attendance.";
        const code = err.response?.status;

        setSession(null);
        setMark(null);
        setMessage(apiMessage);

        if (code === 400 && /closed|inactive/i.test(apiMessage)) {
          setStatus("closed");
        } else {
          setStatus("error");
        }
      }
    };

    if (token) {
      run();
    } else {
      setStatus("error");
      setMessage("Invalid attendance link.");
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isOk = status === "success" || status === "already";

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto flex max-w-lg flex-col px-6 py-10 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            AKB · KSS Attendance
          </p>

          {status === "loading" ? (
            <div className="mt-6 text-sm text-slate-600">
              Recording your attendance…
            </div>
          ) : (
            <>
              <div className="mt-5 flex items-start gap-3">
                {isOk ? (
                  <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-rose-500" />
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    {status === "success"
                      ? "Attendance recorded"
                      : status === "already"
                        ? "Attendance already recorded"
                        : status === "closed"
                          ? "Session closed"
                          : "Unable to mark attendance"}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {message}
                  </p>
                </div>
              </div>

              {session ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {session.topic}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(session.date)}
                    {session.takenBy ? ` · ${session.takenBy}` : ""}
                  </p>
                  {mark?.markedAt ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Marked at {formatTime(mark.markedAt)} (Africa/Lagos)
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8">
                <Link
                  to={homePath}
                  className="inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                  Continue
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default KssAttendanceMarkPage;
