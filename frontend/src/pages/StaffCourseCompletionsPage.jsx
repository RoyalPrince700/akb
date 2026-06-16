import { Fragment, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, ChevronDown, ChevronUp, Gem, Search } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import PanelLayout from "../layouts/PanelLayout";
import { getStaffCourseCompletions } from "../services/api";

const roleBadgeClass = (role) => {
  if (role === "admin") return "bg-blue-100 text-blue-900";
  if (role === "hr") return "bg-indigo-100 text-indigo-900";
  return "bg-blue-100 text-blue-900";
};

const StaffCourseCompletionsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalCourses, setTotalCourses] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getStaffCourseCompletions();
        setUsers(data.users ?? []);
        setSummary(data.summary ?? null);
        setTotalCourses(data.totalCourses ?? 3);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load course completions."
        );
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((entry) => {
      if (roleFilter && entry.role !== roleFilter) return false;
      if (!term) return true;
      return (
        entry.name?.toLowerCase().includes(term) ||
        entry.staffId?.toLowerCase().includes(term) ||
        entry.department?.toLowerCase().includes(term) ||
        entry.position?.toLowerCase().includes(term)
      );
    });
  }, [users, search, roleFilter]);

  const toggleExpanded = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <PanelLayout title="Course Completions">
      <p className="mb-4 text-sm text-slate-600">
        {isAdmin
          ? "View every account and which courses they have fully completed."
          : "View staff accounts and which courses they have fully completed."}
      </p>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-blue-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Total completions
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {summary.totalCompletions}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-blue-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Users with completions
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-950">
              {summary.usersWithCompletions}
              <span className="text-base font-semibold text-blue-700">
                {" "}
                / {summary.totalUsers}
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-blue-900/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Available courses
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalCourses}</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-900/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search name, staff ID, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          {isAdmin && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 sm:w-40"
            >
              <option value="">All roles</option>
              <option value="staff">Staff</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-600">Loading…</p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-600">
              No users match your filters.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Staff ID</th>
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  {isAdmin && <th className="pb-3 pr-4 font-medium">Role</th>}
                  <th className="pb-3 pr-4 font-medium">Gems</th>
                  <th className="pb-3 pr-4 font-medium">Courses completed</th>
                  <th className="pb-3 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((entry) => {
                  const isExpanded = expandedId === String(entry.id);
                  const hasCourses = entry.completedCourses?.length > 0;

                  return (
                    <Fragment key={entry.id}>
                      <tr
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-950">
                          {entry.name}
                          {entry.isActive === false && (
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              (inactive)
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{entry.staffId}</td>
                        <td className="py-3 pr-4 text-slate-700">
                          {entry.department}
                        </td>
                        {isAdmin && (
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${roleBadgeClass(entry.role)}`}
                            >
                              {entry.role}
                            </span>
                          </td>
                        )}
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-900">
                            <Gem className="h-4 w-4 text-amber-600" />
                            {entry.gems ?? 0}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-slate-950">
                          {entry.completedCoursesCount}
                          <span className="font-normal text-slate-500">
                            {" "}
                            / {totalCourses}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(String(entry.id))}
                            disabled={!hasCourses}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isExpanded ? (
                              <>
                                Hide
                                <ChevronUp className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                View courses
                                <ChevronDown className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && hasCourses && (
                        <tr key={`${entry.id}-detail`} className="bg-slate-50/80">
                          <td
                            colSpan={isAdmin ? 7 : 6}
                            className="px-4 py-4"
                          >
                            <div className="flex items-start gap-2">
                              <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Completed courses
                                </p>
                                <ul className="mt-2 space-y-2">
                                  {entry.completedCourses.map((course) => (
                                    <li
                                      key={course.courseId}
                                      className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800"
                                    >
                                      {course.title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isExpanded && !hasCourses && (
                        <tr key={`${entry.id}-empty`} className="bg-slate-50/80">
                          <td
                            colSpan={isAdmin ? 7 : 6}
                            className="px-4 py-3 text-sm text-slate-500"
                          >
                            No completed courses yet.
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredUsers.length > 0 && (
          <p className="mt-4 text-sm text-slate-500">
            Showing {filteredUsers.length} of {users.length} user
            {users.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </PanelLayout>
  );
};

export default StaffCourseCompletionsPage;
