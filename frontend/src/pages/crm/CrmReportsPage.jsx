import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarRange, Download, Search, Table2 } from "lucide-react";

import CrmBarChartCard from "../../components/crm/CrmBarChartCard";
import CrmCsrPerformanceChart from "../../components/crm/CrmCsrPerformanceChart";
import CrmPieChartCard from "../../components/crm/CrmPieChartCard";
import { useAuth } from "../../context/AuthContext";
import { formatCrmCategory } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { getCrmReports, listStaff } from "../../services/api";
import {
  mapBreakdownRows,
  mapCsrPerformanceChart,
  mapOverviewDirectionData,
  mapOverviewResolutionData,
} from "../../utils/crmChartData";
import { downloadCrmReportDocx } from "../../utils/crmReportDocx";
import { downloadCrmReportXlsx } from "../../utils/crmReportXlsx";

const emptyReports = {
  overview: {
    totalTickets: 0,
    resolved: 0,
    unresolved: 0,
    pendingRequests: 0,
    inbound: 0,
    outbound: 0,
    resolutionRate: 0,
    surveySent: 0,
    surveyResponded: 0,
    surveyResponseRate: 0,
    salesRecords: 0,
    booksSold: 0,
    salesValue: 0,
  },
  csrPerformance: [],
  byDirection: [],
  byCategory: [],
  byState: [],
  byStatus: [],
  byOwner: [],
  bySalesRep: [],
  surveyBySender: [],
  surveyByTicketOwner: [],
};

const periodOptions = [
  { value: "all", label: "All time" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

const formatDisplayDate = (value) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getPeriodDescription = (period) => {
  if (!period || period.type === "all") {
    return "Showing all logged CRM activity";
  }

  const start = formatDisplayDate(period.startDate);
  const end = formatDisplayDate(period.endDate);

  if (period.type === "week") {
    return `Showing activity from this week (${start} – ${end})`;
  }

  if (period.type === "month") {
    return `Showing activity from this month (${start} – ${end})`;
  }

  if (period.type === "year") {
    return `Showing activity from this year (${start} – ${end})`;
  }

  return `Showing activity from ${start} to ${end}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatBreakdownLabel = (value) => {
  if (!value) {
    return "Unknown";
  }

  if (value === "inbound") return "Inbound";
  if (value === "outbound") return "Outbound";
  if (value === "resolved") return "Resolved";
  if (value === "unresolved") return "Unresolved";

  return formatCrmCategory(value) || value;
};

const MetricCard = ({ label, value, helper }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</h2>
    <p className="mt-2 text-sm text-slate-500">{helper}</p>
  </div>
);

const REPORT_TABLE_PREVIEW_LIMIT = 5;

const ReportTable = ({ title, rows, labelKey = "name" }) => {
  const [expanded, setExpanded] = useState(false);
  const hasMoreRows = rows.length > REPORT_TABLE_PREVIEW_LIMIT;
  const visibleRows = expanded ? rows : rows.slice(0, REPORT_TABLE_PREVIEW_LIMIT);

  useEffect(() => {
    setExpanded(false);
  }, [rows]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-5 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-slate-600">No data available.</p>
        ) : (
          <>
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Label</th>
                  <th className="pb-3 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr
                    key={`${row._id || row[labelKey]}-${index}`}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {row[labelKey] || formatBreakdownLabel(row._id) || "Unknown"}
                    </td>
                    <td className="py-3 text-slate-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMoreRows && (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-4 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                {expanded ? "Show less" : `View all (${rows.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const viewModeOptions = [
  { value: "figures", label: "Figures", icon: Table2 },
  { value: "charts", label: "Charts", icon: BarChart3 },
];

const ReportViewToggle = ({ value, onChange }) => (
  <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
    {viewModeOptions.map(({ value: optionValue, label, icon: Icon }) => {
      const isActive = value === optionValue;

      return (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          aria-pressed={isActive}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            isActive
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </button>
      );
    })}
  </div>
);

const CrmReportsPage = () => {
  const { user } = useAuth();
  const isCsrAdmin = user?.role === "csrAdmin" || user?.role === "admin";

  const [reports, setReports] = useState(emptyReports);
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedCustomRange, setAppliedCustomRange] = useState({ startDate: "", endDate: "" });
  const [activePeriod, setActivePeriod] = useState({ type: "month" });
  const [ownerFilter, setOwnerFilter] = useState("");
  const [csrSearch, setCsrSearch] = useState("");
  const [csrOptions, setCsrOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState("");
  const [viewMode, setViewMode] = useState("figures");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isCsrAdmin) {
      return;
    }

    const loadCsrs = async () => {
      try {
        const data = await listStaff({ role: "csr", limit: 100 });
        setCsrOptions(data.staff || []);
      } catch {
        setCsrOptions([]);
      }
    };

    loadCsrs();
  }, [isCsrAdmin]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { period };

      if (period === "custom") {
        if (!appliedCustomRange.startDate || !appliedCustomRange.endDate) {
          setReports(emptyReports);
          setActivePeriod({ type: "custom" });
          setLoading(false);
          return;
        }

        params.startDate = appliedCustomRange.startDate;
        params.endDate = appliedCustomRange.endDate;
      }

      if (ownerFilter) {
        params.owner = ownerFilter;
      }

      const data = await getCrmReports(params);
      setReports({ ...emptyReports, ...(data.reports || {}) });
      setActivePeriod(data.period || { type: period });
    } catch (apiError) {
      setReports(emptyReports);
      setError(apiError.response?.data?.message || "Failed to load CRM reports.");
    } finally {
      setLoading(false);
    }
  }, [appliedCustomRange.endDate, appliedCustomRange.startDate, ownerFilter, period]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const periodDescription = useMemo(() => getPeriodDescription(activePeriod), [activePeriod]);

  const filteredCsrPerformance = useMemo(() => {
    const term = csrSearch.trim().toLowerCase();
    const rows = reports.csrPerformance || [];

    if (!term) {
      return rows;
    }

    return rows.filter(
      (row) =>
        row.name?.toLowerCase().includes(term) ||
        row.staffId?.toLowerCase().includes(term)
    );
  }, [csrSearch, reports.csrPerformance]);

  const csrFilterLabel = useMemo(() => {
    if (!ownerFilter) {
      return "All CSRs";
    }

    const match = csrOptions.find((item) => item._id === ownerFilter);
    return match?.csrDisplayName || match?.name || "Selected CSR";
  }, [csrOptions, ownerFilter]);

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value;
    setPeriod(nextPeriod);

    if (nextPeriod !== "custom") {
      setAppliedCustomRange({ startDate: "", endDate: "" });
    }
  };

  const handleApplyCustomRange = (event) => {
    event.preventDefault();

    if (!startDate || !endDate) {
      setError("Choose both a start date and an end date for the custom range.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date must be before or equal to the end date.");
      return;
    }

    setError("");
    setAppliedCustomRange({ startDate, endDate });
  };

  const handleDownload = async (format) => {
    setDownloading(true);
    setDownloadingFormat(format);
    setError("");

    try {
      const payload = {
        period: activePeriod,
        reports,
        csrFilterLabel,
      };

      if (format === "xlsx") {
        downloadCrmReportXlsx(payload);
      } else {
        await downloadCrmReportDocx(payload);
      }
    } catch {
      setError(`Failed to generate the ${format === "xlsx" ? "Excel" : "Word"} report.`);
    } finally {
      setDownloading(false);
      setDownloadingFormat("");
    }
  };

  const overview = reports.overview || emptyReports.overview;

  const resolutionChartData = useMemo(
    () => mapOverviewResolutionData(overview),
    [overview]
  );
  const directionChartData = useMemo(
    () => mapOverviewDirectionData(overview),
    [overview]
  );
  const categoryChartData = useMemo(
    () => mapBreakdownRows(reports.byCategory, formatBreakdownLabel),
    [reports.byCategory]
  );
  const statusChartData = useMemo(
    () => mapBreakdownRows(reports.byStatus, formatBreakdownLabel),
    [reports.byStatus]
  );
  const stateChartData = useMemo(
    () => mapBreakdownRows(reports.byState, formatBreakdownLabel, { limit: 10 }),
    [reports.byState]
  );
  const ownerChartData = useMemo(
    () => mapBreakdownRows(reports.byOwner, formatBreakdownLabel, { limit: 10 }),
    [reports.byOwner]
  );
  const csrPerformanceChartData = useMemo(
    () => mapCsrPerformanceChart(filteredCsrPerformance),
    [filteredCsrPerformance]
  );

  return (
    <PanelLayout title="CRM Reports">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CalendarRange className="h-4 w-4" aria-hidden />
              <p className="text-sm font-semibold">Report period</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{periodDescription}</p>
          </div>

          <div className="flex w-full flex-col gap-3 xl:max-w-4xl">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Filter by period</span>
                <select
                  value={period}
                  onChange={handlePeriodChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {isCsrAdmin && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Filter by CSR</span>
                  <select
                    value={ownerFilter}
                    onChange={(event) => setOwnerFilter(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">All CSRs</option>
                    {csrOptions.map((csr) => (
                      <option key={csr._id} value={csr._id}>
                        {csr.csrDisplayName || csr.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {period === "custom" && (
              <form
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                onSubmit={handleApplyCustomRange}
              >
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">End date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <button
                  type="submit"
                  className="self-end rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Apply range
                </button>
              </form>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload("docx")}
                  disabled={loading || downloading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {downloadingFormat === "docx"
                    ? "Generating Word..."
                    : "Download (.docx)"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload("xlsx")}
                  disabled={loading || downloading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {downloadingFormat === "xlsx"
                    ? "Generating Excel..."
                    : "Download (.xlsx)"}
                </button>
              </div>
              <ReportViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 shadow-lg shadow-emerald-900/5">
          Loading CRM reports...
        </div>
      ) : viewMode === "figures" ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total tickets"
              value={overview.totalTickets ?? 0}
              helper="All tickets logged in this period"
            />
            <MetricCard
              label="Resolved tickets"
              value={overview.resolved ?? 0}
              helper={`Resolution rate: ${overview.resolutionRate ?? 0}%`}
            />
            <MetricCard
              label="Unresolved tickets"
              value={overview.unresolved ?? 0}
              helper={`Pending requests: ${overview.pendingRequests ?? 0}`}
            />
            <MetricCard
              label="Survey response rate"
              value={`${overview.surveyResponseRate ?? 0}%`}
              helper={`${overview.surveyResponded ?? 0} of ${overview.surveySent ?? 0} surveys responded`}
            />
            <MetricCard
              label="Inbound tickets"
              value={overview.inbound ?? 0}
              helper="Customer-initiated contacts"
            />
            <MetricCard
              label="Outbound tickets"
              value={overview.outbound ?? 0}
              helper="CSR-initiated contacts"
            />
            <MetricCard
              label="Sales records"
              value={overview.salesRecords ?? 0}
              helper={`${overview.booksSold ?? 0} books sold in this period`}
            />
            <MetricCard
              label="Sales value"
              value={formatCurrency(overview.salesValue ?? 0)}
              helper="Total recorded sales amount"
            />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">CSR performance breakdown</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Detailed ticket, survey, and sales metrics for each CSR in the selected period.
                </p>
              </div>

              <label className="block w-full lg:max-w-sm">
                <span className="text-sm font-medium text-slate-700">Search CSR</span>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={csrSearch}
                    onChange={(event) => setCsrSearch(event.target.value)}
                    placeholder="Search by name or staff ID"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </label>
            </div>

            <div className="mt-5 overflow-x-auto">
              {filteredCsrPerformance.length === 0 ? (
                <p className="py-4 text-sm text-slate-600">No CSR performance data available.</p>
              ) : (
                <table className="w-full min-w-[1200px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 pr-4 font-medium">CSR</th>
                      <th className="pb-3 pr-4 font-medium">Staff ID</th>
                      <th className="pb-3 pr-4 font-medium">Tickets</th>
                      <th className="pb-3 pr-4 font-medium">Resolved</th>
                      <th className="pb-3 pr-4 font-medium">Unresolved</th>
                      <th className="pb-3 pr-4 font-medium">Resolution %</th>
                      <th className="pb-3 pr-4 font-medium">Inbound</th>
                      <th className="pb-3 pr-4 font-medium">Outbound</th>
                      <th className="pb-3 pr-4 font-medium">Enquiries</th>
                      <th className="pb-3 pr-4 font-medium">Complaints</th>
                      <th className="pb-3 pr-4 font-medium">Requests</th>
                      <th className="pb-3 pr-4 font-medium">Surveys sent</th>
                      <th className="pb-3 pr-4 font-medium">Survey responses</th>
                      <th className="pb-3 pr-4 font-medium">Survey response %</th>
                      <th className="pb-3 pr-4 font-medium">Avg CSR rating</th>
                      <th className="pb-3 pr-4 font-medium">Avg resolution rating</th>
                      <th className="pb-3 pr-4 font-medium">Sales records</th>
                      <th className="pb-3 pr-4 font-medium">Books sold</th>
                      <th className="pb-3 font-medium">Sales value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCsrPerformance.map((row) => (
                      <tr
                        key={row._id || row.name}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-950">{row.name}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.staffId || "—"}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.totalTickets ?? 0}</td>
                        <td className="py-3 pr-4 text-emerald-700">{row.resolved ?? 0}</td>
                        <td className="py-3 pr-4 text-amber-700">{row.unresolved ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.resolutionRate ?? 0}%</td>
                        <td className="py-3 pr-4 text-slate-700">{row.inbound ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.outbound ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.enquiries ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.complaints ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.requests ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.surveysSent ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.surveysResponded ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.surveyResponseRate ?? 0}%</td>
                        <td className="py-3 pr-4 text-slate-700">
                          {row.avgCsrRating ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {row.avgResolutionRating ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{row.salesRecords ?? 0}</td>
                        <td className="py-3 pr-4 text-slate-700">{row.booksSold ?? 0}</td>
                        <td className="py-3 text-slate-700">
                          {formatCurrency(row.salesValue ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <ReportTable title="Tickets by direction" rows={reports.byDirection || []} />
            <ReportTable title="Tickets by category" rows={reports.byCategory || []} />
            <ReportTable title="Tickets by state" rows={reports.byState || []} />
            <ReportTable title="Tickets by resolution status" rows={reports.byStatus || []} />
            <ReportTable title="Tickets by CSR" rows={reports.byOwner || []} />
            <ReportTable title="Tickets by sales rep" rows={reports.bySalesRep || []} />
            <ReportTable title="Surveys triggered by CSR" rows={reports.surveyBySender || []} />
            <ReportTable
              title="Surveys by ticket owner"
              rows={reports.surveyByTicketOwner || []}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <CrmPieChartCard
              title="Ticket resolution"
              description="Resolved vs unresolved tickets in the selected period."
              data={resolutionChartData}
            />
            <CrmPieChartCard
              title="Contact direction"
              description="Inbound customer contacts compared with outbound CSR outreach."
              data={directionChartData}
            />
            <CrmBarChartCard
              title="Tickets by category"
              description="Breakdown of enquiries, complaints, requests, and other ticket types."
              data={categoryChartData}
              color="#0284c7"
            />
            <CrmBarChartCard
              title="Tickets by resolution status"
              data={statusChartData}
              color="#059669"
            />
            <CrmBarChartCard
              title="Top states"
              description="Top 10 customer states by ticket volume."
              data={stateChartData}
              layout="vertical"
              color="#8b5cf6"
              heightClassName="h-80"
            />
            <CrmBarChartCard
              title="Tickets by CSR"
              description="Top 10 CSRs by tickets handled in this period."
              data={ownerChartData}
              layout="vertical"
              color="#14b8a6"
              heightClassName="h-80"
            />
          </div>

          <div className="mt-6">
            <CrmCsrPerformanceChart
              title="CSR resolution comparison"
              description="Resolved and unresolved ticket counts for the top CSRs in this view."
              data={csrPerformanceChartData}
              emptyMessage="No CSR performance data available for charting."
            />
          </div>
        </>
      )}
    </PanelLayout>
  );
};

export default CrmReportsPage;
