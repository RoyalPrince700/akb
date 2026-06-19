import { useEffect, useState } from "react";
import { Gem, Medal, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getGemsLeaderboard } from "../services/api";

const rankIcon = (rank) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
      {rank}
    </span>
  );
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getGemsLeaderboard();
        setLeaderboard(data.leaderboard ?? []);
      } catch {
        setError("Could not load leaderboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentUserId = String(user?.id ?? user?._id ?? "");

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-amber-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-br from-amber-100/70 via-white to-white" />
          <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Gem className="h-[18px] w-[18px] stroke-[1.8]" />
            </div>
            <div>
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                Team rankings
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Gems Leaderboard
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Staff earn 10 gems for each course they complete. Rankings update as
                teammates finish courses.
              </p>
            </div>
          </div>

          {user && (
            <p className="mt-10 inline-flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Gem className="h-4 w-4" />
              Your gems: {user.gems ?? 0}
            </p>
          )}
          </div>
        </div>

        {loading && (
          <div className="mt-8 rounded-[28px] border border-slate-200/70 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
            <p className="text-sm text-slate-500">Loading rankings…</p>
          </div>
        )}

        {error && (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!loading && !error && (
          <ol className="mt-8 space-y-3">
            {leaderboard.length === 0 ? (
              <li className="rounded-[28px] border border-slate-200/70 bg-white px-5 py-8 text-center text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
                No rankings yet. Complete a course to earn gems!
              </li>
            ) : (
              leaderboard.map((entry) => {
                const isCurrentUser = String(entry.id) === currentUserId;
                return (
                  <li
                    key={entry.id}
                    className={`flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition ${
                      isCurrentUser
                        ? "border-amber-300 ring-2 ring-amber-100"
                        : "border-slate-200/70 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex w-10 shrink-0 justify-center">
                      {rankIcon(entry.rank)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950">
                        {entry.name}
                        {isCurrentUser && (
                          <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {entry.department} · {entry.position}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5 font-bold text-amber-800">
                      <Gem className="h-4 w-4 text-amber-600" />
                      {entry.gems}
                    </div>
                  </li>
                );
              })
            )}
          </ol>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link to="/courses" className="font-semibold text-blue-700 hover:text-blue-800">
            Browse courses
          </Link>{" "}
          to earn more gems.
        </p>
      </section>
    </main>
  );
};

export default LeaderboardPage;
