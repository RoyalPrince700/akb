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
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
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

      <section className="mx-auto max-w-3xl px-6 pb-12 pt-8 lg:px-8">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
              <Gem className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-950">Gems Leaderboard</h1>
              <p className="mt-1 text-slate-600">
                Staff earn 10 gems for each course they complete. Rankings update as
                teammates finish courses.
              </p>
            </div>
          </div>

          {user && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
              <Gem className="h-4 w-4" />
              Your gems: {user.gems ?? 0}
            </p>
          )}
        </div>

        {loading && (
          <p className="mt-8 text-center text-slate-500">Loading rankings…</p>
        )}

        {error && (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!loading && !error && (
          <ol className="mt-8 space-y-3">
            {leaderboard.length === 0 ? (
              <li className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-500">
                No rankings yet. Complete a course to earn gems!
              </li>
            ) : (
              leaderboard.map((entry) => {
                const isCurrentUser = String(entry.id) === currentUserId;
                return (
                  <li
                    key={entry.id}
                    className={`flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-sm ${
                      isCurrentUser
                        ? "border-amber-300 ring-2 ring-amber-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex w-10 shrink-0 justify-center">
                      {rankIcon(entry.rank)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950">
                        {entry.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-bold uppercase text-amber-700">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {entry.department} · {entry.position}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-bold text-amber-900">
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
