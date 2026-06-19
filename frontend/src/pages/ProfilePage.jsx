import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Gem,
  Lock,
  LogOut,
  Settings,
  Shield,
  Star,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  changePassword,
  getMyProgressSummary,
  listMyResults,
  updateProfile,
} from "../services/api";
import { getDashboardPath } from "../utils/rolePaths";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const getFirstInitial = (name) => {
  if (!name?.trim()) return "?";
  return name.trim().split(/\s+/)[0].charAt(0).toUpperCase();
};

const roleLabel = (role) => {
  if (role === "admin") return "Administrator";
  if (role === "hr") return "HR";
  return "Staff";
};

const roleBadgeClass = (role) => {
  if (role === "admin") return "bg-amber-50 text-amber-700";
  if (role === "hr") return "bg-violet-50 text-violet-700";
  return "bg-blue-50 text-blue-700";
};

const ACHIEVEMENTS = [
  {
    id: "first-chapter",
    title: "First Steps",
    description: "Complete your first chapter",
    icon: Target,
    check: (stats) => stats.totalChaptersCompleted >= 1,
  },
  {
    id: "first-course",
    title: "Course Graduate",
    description: "Complete your first course",
    icon: BookOpen,
    check: (stats) => stats.coursesCompleted >= 1,
  },
  {
    id: "all-courses",
    title: "Knowledge Master",
    description: "Complete every available course",
    icon: Trophy,
    check: (stats) =>
      stats.totalCourses > 0 && stats.coursesCompleted >= stats.totalCourses,
  },
  {
    id: "gem-collector",
    title: "Gem Collector",
    description: "Earn 10 or more gems",
    icon: Gem,
    check: (stats) => stats.gems >= 10,
  },
  {
    id: "assessment-passed",
    title: "Assessment Ace",
    description: "Pass an assessment",
    icon: CheckCircle2,
    check: (stats) => stats.assessmentsPassed >= 1,
  },
  {
    id: "perfect-score",
    title: "Perfect Score",
    description: "Score full marks on an assessment",
    icon: Star,
    check: (stats) => stats.perfectScores >= 1,
  },
];

const StatCard = ({ label, value, subtext, icon: Icon, accent = "blue" }) => {
  const accentClasses = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-4 text-3xl font-bold tracking-tighter text-slate-950">{value}</p>
          {subtext && <p className="mt-2 text-sm leading-5 text-slate-500">{subtext}</p>}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${accentClasses[accent]}`}
        >
          <Icon className="h-[18px] w-[18px] stroke-[1.8]" />
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { logout, updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      name: user.name ?? "",
      email: user.email ?? "",
      department: user.department ?? "",
      position: user.position ?? "",
    });
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [progressData, resultsData] = await Promise.all([
          getMyProgressSummary(),
          listMyResults(),
        ]);
        setSummary(progressData);
        setResults(resultsData.results ?? []);
      } catch {
        setError("Could not load your profile data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const assessmentsPassed = results.filter((r) => r.passed).length;
    const perfectScores = results.filter(
      (r) => r.score === r.totalQuestions
    ).length;

    return {
      gems: summary?.gems ?? user?.gems ?? 0,
      coursesCompleted: summary?.coursesCompleted ?? 0,
      totalCourses: summary?.totalCourses ?? 0,
      totalChaptersCompleted: summary?.totalChaptersCompleted ?? 0,
      totalChapters: summary?.totalChapters ?? 0,
      assessmentsPassed,
      perfectScores,
      assessmentsTaken: results.length,
    };
  }, [summary, results, user]);

  const earnedAchievements = ACHIEVEMENTS.filter((a) => a.check(stats));
  const dashboardPath = getDashboardPath(user?.role);

  const handleProfileChange = (event) => {
    setProfileForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setProfileSaving(true);

    try {
      const data = await updateProfile(profileForm);
      updateUser(data.user);
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = (event) => {
    setPasswordForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!passwordPattern.test(passwordForm.newPassword)) {
      setPasswordError(
        "Password must contain one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage("Password updated successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 pb-12 pt-10 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden px-6 py-8 sm:px-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-br from-blue-100/60 via-white to-white" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {getFirstInitial(user?.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{user?.name}</h1>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${roleBadgeClass(user?.role)}`}
                  >
                    {roleLabel(user?.role)}
                  </span>
                </div>
                <p className="mt-3 text-slate-600">
                  {user?.position} · {user?.department}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Staff ID: {user?.staffId} · {user?.email}
                </p>
              </div>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Gem className="h-5 w-5" />
                <div>
                  <p className="text-xs font-medium text-amber-700">
                    Gems
                  </p>
                  <p className="text-xl font-bold tracking-tight text-slate-950">{stats.gems}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200/70 px-4 py-3 sm:px-6">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-slate-950 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)]"
                      : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-950"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            {loading && (
              <p className="py-12 text-center text-slate-500">Loading your profile…</p>
            )}

            {!loading && activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Chapters completed"
                    value={`${stats.totalChaptersCompleted}/${stats.totalChapters}`}
                    subtext="Across all courses"
                    icon={BookOpen}
                    accent="blue"
                  />
                  <StatCard
                    label="Courses completed"
                    value={`${stats.coursesCompleted}/${stats.totalCourses}`}
                    subtext="Full course completions"
                    icon={Trophy}
                    accent="emerald"
                  />
                  <StatCard
                    label="Assessments passed"
                    value={stats.assessmentsPassed}
                    subtext={`${stats.assessmentsTaken} taken total`}
                    icon={CheckCircle2}
                    accent="violet"
                  />
                  <StatCard
                    label="Achievements"
                    value={`${earnedAchievements.length}/${ACHIEVEMENTS.length}`}
                    subtext="Badges unlocked"
                    icon={Award}
                    accent="amber"
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Course progress</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Track your reading progress across each learning path.
                  </p>

                  <ul className="mt-4 space-y-3">
                    {(summary?.courseProgress ?? []).length === 0 ? (
                      <li className="rounded-2xl border border-slate-200/70 bg-white px-5 py-6 text-center text-sm text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        No course progress yet.{" "}
                        <Link to="/courses" className="font-semibold text-blue-700 hover:text-blue-800">
                          Start learning
                        </Link>
                      </li>
                    ) : (
                      summary.courseProgress.map((course) => {
                        const percentage = course.totalChapters
                          ? Math.round(
                              (course.completedChapters / course.totalChapters) * 100
                            )
                          : 0;

                        return (
                          <li
                            key={course.courseId}
                            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-950">
                                  {course.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {course.completedChapters} of {course.totalChapters}{" "}
                                  chapters completed
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {course.courseCompleted && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Done
                                  </span>
                                )}
                                <Link
                                  to={`/courses/${course.courseId}`}
                                  className="text-sm font-semibold text-slate-500 transition hover:text-blue-700"
                                >
                                  Continue →
                                </Link>
                              </div>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-500 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3">
                  {dashboardPath !== "/" && (
                    <Link
                      to={dashboardPath}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600"
                    >
                      Go to dashboard
                    </Link>
                  )}
                  <Link
                    to="/leaderboard"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
                  >
                    View leaderboard
                  </Link>
                  {user?.role === "staff" && (
                    <Link
                      to="/dashboard/results"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
                    >
                      My assessment results
                    </Link>
                  )}
                </div>
              </div>
            )}

            {!loading && activeTab === "achievements" && (
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Your achievements</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Earn badges by completing chapters, courses, and assessments.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {ACHIEVEMENTS.map((achievement) => {
                    const earned = achievement.check(stats);
                    const Icon = achievement.icon;

                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-start gap-4 rounded-2xl border p-5 transition ${
                          earned
                            ? "border-amber-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                            : "border-slate-200/70 bg-white opacity-70"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
                            earned
                              ? "border-amber-100 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                        >
                          {earned ? (
                            <Icon className="h-[18px] w-[18px] stroke-[1.8]" />
                          ) : (
                            <Lock className="h-[18px] w-[18px] stroke-[1.8]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {achievement.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {achievement.description}
                          </p>
                          <p
                            className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              earned ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {earned ? "Unlocked" : "Locked"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && activeTab === "settings" && (
              <div className="space-y-8">
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-950">Account details</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Update your personal information. Staff ID cannot be changed.
                    </p>
                  </div>

                  {profileMessage && (
                    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {profileMessage}
                    </p>
                  )}
                  {profileError && (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {profileError}
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Full name</span>
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Email</span>
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Department</span>
                      <input
                        type="text"
                        name="department"
                        value={profileForm.department}
                        onChange={handleProfileChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Position</span>
                      <input
                        type="text"
                        name="position"
                        value={profileForm.position}
                        onChange={handleProfileChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-slate-700">Staff ID</span>
                      <input
                        type="text"
                        value={user?.staffId ?? ""}
                        disabled
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-slate-100 px-4 py-2.5 text-sm text-slate-500"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600 disabled:opacity-60"
                  >
                    {profileSaving ? "Saving…" : "Save changes"}
                  </button>
                </form>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4 border-t border-slate-200 pt-8"
                >
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950">
                      <Shield className="h-5 w-5 text-slate-600" />
                      Change password
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Use a strong password with uppercase, lowercase, and a number.
                    </p>
                  </div>

                  {passwordMessage && (
                    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {passwordMessage}
                    </p>
                  )}
                  {passwordError && (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {passwordError}
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-slate-700">
                        Current password
                      </span>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        New password
                      </span>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">
                        Confirm new password
                      </span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600 disabled:opacity-60"
                  >
                    {passwordSaving ? "Updating…" : "Update password"}
                  </button>
                </form>

                <div className="border-t border-slate-200 pt-8">
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Session</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Sign out of your account on this device.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;
