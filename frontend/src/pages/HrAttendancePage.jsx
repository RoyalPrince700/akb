import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";

import PanelLayout from "../layouts/PanelLayout";
import {
  exportAttendanceRecords,
  getAttendanceSummary,
  listAttendanceRecords,
} from "../services/api";
import { downloadAttendanceReportXlsx } from "../utils/attendanceReportXlsx";

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
};

const formatDuration = (minutes) => {
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatOvertime = (minutes) => {
  const total = Number(minutes) || 0;
  if (total <= 0) return "—";
  return formatDuration(total);
};

const currentMonthValue = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const statusBadgeClass = (status) => {
  if (status === "present") return "bg-emerald-100 text-emerald-800";
  if (status === "late") return "bg-amber-100 text-amber-900";
  if (status === "partial") return "bg-sky-100 text-sky-900";
  return "bg-slate-200 text-slate-700";
};

const FlagBadge = ({ children, tone = "slate" }) => {
  const tones = {
    amber: "bg-amber-100 text-amber-900",
    rose: "bg-rose-100 text-rose-900",
    violet: "bg-violet-100 text-violet-900",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        tones[tone] || tones.slate
      }`}
    >
      {children}
    </span>
  );
};

const HrAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [lateFilter, setLateFilter] = useState("");
  const [earlyLeaveFilter, setEarlyLeaveFilter] = useState("");
  const [overtimeFilter, setOvertimeFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [exportMonth, setExportMonth] = useState(currentMonthValue);
  const [page, setPage] = useState(1);

  const buildListParams = useCallback(
    (overrides = {}) => {
      const params = { page, limit: 15, ...overrides };
      if (search.trim()) params.search = search.trim();
      if (department.trim()) params.department = department.trim();
      if (status) params.status = status;
      if (lateFilter) params.isLate = lateFilter;
      if (earlyLeaveFilter) params.isEarlyLeave = earlyLeaveFilter;
      if (overtimeFilter) params.hasOvertime = overtimeFilter;
      if (date) {
        params.date = date;
      } else {
        if (from) params.from = from;
        if (to) params.to = to;
      }
      return params;
    },
    [
      date,
      department,
      earlyLeaveFilter,
      from,
      lateFilter,
      overtimeFilter,
      page,
      search,
      status,
      to,
    ]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = buildListParams();
      const summaryDate = date || to || from || undefined;
      const [listData, summaryData] = await Promise.all([
        listAttendanceRecords(params),
        getAttendanceSummary(summaryDate ? { date: summaryDate } : {}),
      ]);

      setRecords(listData.records || []);
      setPagination(listData.pagination || { page: 1, pages: 1, total: 0 });
      setSummary(summaryData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [buildListParams, date, from, to]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    loadData();
  };

  const handleExport = async () => {
    if (!exportMonth) {
      setError("Select a month to export.");
      return;
    }

    setExporting(true);
    setError("");

    try {
      const params = {
        month: exportMonth,
      };
      if (search.trim()) params.search = search.trim();
      if (department.trim()) params.department = department.trim();
      if (status) params.status = status;
      if (lateFilter) params.isLate = lateFilter;
      if (earlyLeaveFilter) params.isEarlyLeave = earlyLeaveFilter;
      if (overtimeFilter) params.hasOvertime = overtimeFilter;

      const data = await exportAttendanceRecords(params);
      downloadAttendanceReportXlsx({
        month: exportMonth,
        records: data.records || [],
        totals: data.totals || {},
        filter: data.filter || params,
        timezone: data.timezone || "Africa/Lagos",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to export attendance.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PanelLayout title="Attendance">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: "Present (day)",
            value: summary?.summary?.present,
            hint: `${summary?.date || "Today"} · Africa/Lagos`,
          },
          {
            label: "Late (after 08:15)",
            value: summary?.summary?.late,
          },
          {
            label: "Early leave",
            value: summary?.summary?.earlyLeave,
            hint: "Before 17:00",
          },
          {
            label: "Partial (no checkout)",
            value: summary?.summary?.partial,
          },
          {
            label: "With overtime",
            value: summary?.summary?.withOvertime,
            hint: "After 18:00",
          },
          {
            label: "Absent estimate",
            value: summary?.summary?.absentEstimate,
            hint: `vs ${summary?.summary?.totalActiveStaff ?? "—"} active users`,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              {card.value ?? "—"}
            </p>
            {card.hint ? (
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                {card.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        Policy: resume 08:00 · on time through 08:15 · late from 08:16 · close
        17:00 · overtime from 18:00 (Africa/Lagos).
      </p>

      <div className="mt-6 rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-slate-950">
              Attendance records
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Facial check-ins only. Times are server-recorded (WAT /
              Africa/Lagos days).
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Export month
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !exportMonth}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Download Excel"}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {pagination.total} record{pagination.total !== 1 ? "s" : ""} in view
        </p>

        <form
          className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          onSubmit={handleFilterSubmit}
        >
          <input
            type="search"
            placeholder="Search name or staff ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 md:col-span-2"
          />
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="partial">Partial</option>
            <option value="late">Late</option>
          </select>
          <select
            value={lateFilter}
            onChange={(e) => setLateFilter(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Late: any</option>
            <option value="true">Late only</option>
            <option value="false">Not late</option>
          </select>
          <select
            value={earlyLeaveFilter}
            onChange={(e) => setEarlyLeaveFilter(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Early leave: any</option>
            <option value="true">Early leave only</option>
            <option value="false">Not early leave</option>
          </select>
          <select
            value={overtimeFilter}
            onChange={(e) => setOvertimeFilter(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Overtime: any</option>
            <option value="true">Has overtime</option>
            <option value="false">No overtime</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            title="Exact day (overrides range)"
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            title="From"
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            title="To"
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-6 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white xl:w-fit"
          >
            Apply filters
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading…</p>
          ) : records.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No attendance records found.
            </p>
          ) : (
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Staff</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Check in</th>
                  <th className="pb-3 pr-4 font-medium">Check out</th>
                  <th className="pb-3 pr-4 font-medium">Duration</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Flags</th>
                  <th className="pb-3 pr-4 font-medium">Overtime</th>
                  <th className="pb-3 font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-950">{record.name}</p>
                      <p className="text-xs text-slate-500">
                        {record.staffId}
                        {record.department ? ` · ${record.department}` : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{record.date}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatTime(record.checkInAt)}
                      {record.checkInMatchConfidence != null && (
                        <span className="mt-0.5 block text-xs text-slate-400">
                          conf{" "}
                          {Math.round(record.checkInMatchConfidence * 100)}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatTime(record.checkOutAt)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatDuration(record.durationMinutes)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {record.isLate && <FlagBadge tone="amber">Late</FlagBadge>}
                        {record.isEarlyLeave && (
                          <FlagBadge tone="rose">Early leave</FlagBadge>
                        )}
                        {(record.overtimeMinutes || 0) > 0 && (
                          <FlagBadge tone="violet">OT</FlagBadge>
                        )}
                        {!record.isLate &&
                          !record.isEarlyLeave &&
                          !(record.overtimeMinutes > 0) && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatOvertime(record.overtimeMinutes)}
                    </td>
                    <td className="py-3 text-slate-700">
                      {record.source || "facial"}
                      {record.checkInSnapshotUrl && (
                        <a
                          href={record.checkInSnapshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block text-xs font-semibold text-blue-700 hover:underline"
                        >
                          Snapshot
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </PanelLayout>
  );
};

export default HrAttendancePage;
