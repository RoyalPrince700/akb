import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Banknote,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Headphones,
  MessageSquareShare,
  PhoneCall,
  Radio,
  ScrollText,
  Users,
} from "lucide-react";

import CrmBarChartCard from "../components/crm/CrmBarChartCard";
import CrmPieChartCard from "../components/crm/CrmPieChartCard";
import { useAuth } from "../context/AuthContext";
import { getCsrDisplayName } from "../constants/crm";
import PanelLayout from "../layouts/PanelLayout";
import { getCrmDashboardSummary } from "../services/api";
import { mapDashboardDirectionData, mapDashboardResolutionData } from "../utils/crmChartData";
import { panelSegmentPath } from "../utils/rolePaths";

const emptySummary = {
  totalContacts: 0,
  inboundCount: 0,
  outboundCount: 0,
  unresolvedCount: 0,
  pendingRequests: 0,
  surveysSent: 0,
  totalSalesRecords: 0,
  totalBooksSold: 0,
  totalSalesValue: 0,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

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
    return "Showing all logged activity";
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

const OverviewCard = ({
  label,
  value,
  description,
  to,
  icon: Icon,
  tone = "emerald",
  valueClassName = "text-5xl",
}) => (
  <Link
    to={to}
    className="group relative overflow-hidden rounded-[30px] border border-white/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200/80"
  >
    <div
      className={`absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl ${
        tone === "blue" ? "bg-sky-300/30" : tone === "amber" ? "bg-amber-300/35" : "bg-emerald-300/35"
      }`}
    />
    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <h2 className={`mt-5 font-black tracking-[-0.08em] text-slate-950 ${valueClassName}`}>
          {value}
        </h2>
      </div>
      <span
        className={`grid h-12 w-12 place-items-center rounded-2xl ${
          tone === "blue"
            ? "bg-sky-100 text-sky-700"
            : tone === "amber"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
    </div>
    <p className="relative mt-4 text-sm leading-6 text-slate-500">{description}</p>
    <span className="relative mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 opacity-0 transition group-hover:opacity-100">
      Open view <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </span>
  </Link>
);

const CsrDashboard = () => {
  const { user } = useAuth();
  const isCsrAdmin = user?.role === "csrAdmin";
  const [summary, setSummary] = useState(emptySummary);
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedCustomRange, setAppliedCustomRange] = useState({ startDate: "", endDate: "" });
  const [activePeriod, setActivePeriod] = useState({ type: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { period };

      if (period === "custom") {
        if (!appliedCustomRange.startDate || !appliedCustomRange.endDate) {
          setSummary(emptySummary);
          setActivePeriod({ type: "custom" });
          setLoading(false);
          return;
        }

        params.startDate = appliedCustomRange.startDate;
        params.endDate = appliedCustomRange.endDate;
      }

      const data = await getCrmDashboardSummary(params);
      setSummary(data.summary || emptySummary);
      setActivePeriod(data.period || { type: period });
    } catch (apiError) {
      setSummary(emptySummary);
      setError(apiError.response?.data?.message || "Failed to load dashboard overview.");
    } finally {
      setLoading(false);
    }
  }, [appliedCustomRange.endDate, appliedCustomRange.startDate, period]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const periodDescription = useMemo(() => getPeriodDescription(activePeriod), [activePeriod]);

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

  const ticketsPath = panelSegmentPath(user?.role, "interactions");
  const surveysPath = panelSegmentPath(user?.role, "surveys");
  const salesRecordsPath = panelSegmentPath(
    user?.role,
    isCsrAdmin ? "csr-sales" : "sales-records"
  );
  const reportsPath = panelSegmentPath(user?.role, "reports");
  const salesRepsPath = panelSegmentPath(user?.role, "sales-reps");
  const staffPath = panelSegmentPath(user?.role, "staff");

  const csrDisplayName = getCsrDisplayName(user, "CSR");

  const directionChartData = useMemo(
    () => mapDashboardDirectionData(summary),
    [summary]
  );
  const resolutionChartData = useMemo(
    () => mapDashboardResolutionData(summary),
    [summary]
  );
  const activityChartData = useMemo(
    () => [
      { name: "Contacts", value: summary.totalContacts ?? 0 },
      { name: "Surveys", value: summary.surveysSent ?? 0 },
      { name: "Sales", value: summary.totalSalesRecords ?? 0 },
    ],
    [summary]
  );

  return (
    <PanelLayout title={isCsrAdmin ? "CSR Admin Dashboard" : `${csrDisplayName}'s CSR Dashboard`}>
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CalendarRange className="h-4 w-4" aria-hidden />
              <p className="text-sm font-semibold">Overview period</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{periodDescription}</p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-3xl">
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
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600 shadow-lg shadow-emerald-900/5">
          Loading overview...
        </p>
      ) : (
        <>
          <div className="mb-6 grid gap-5 lg:grid-cols-3">
            <CrmPieChartCard
              title="Contact direction"
              description="Inbound and outbound ticket split for the selected period."
              data={directionChartData}
            />
            <CrmPieChartCard
              title="Case resolution"
              description="Resolved tickets compared with still-open cases."
              data={resolutionChartData}
            />
            <CrmBarChartCard
              title="Activity overview"
              description="Contacts, surveys sent, and sales records logged in this period."
              data={activityChartData}
              color="#059669"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <OverviewCard
            label="Total contacts"
            value={summary.totalContacts ?? 0}
            description="All logged inbound and outbound tickets in this period"
            to={ticketsPath}
            icon={Headphones}
            tone="blue"
          />
          <OverviewCard
            label="Unresolved cases"
            value={summary.unresolvedCount ?? 0}
            description="Unresolved tickets logged in this period"
            to={ticketsPath}
            icon={Radio}
            tone="amber"
          />
          <OverviewCard
            label="Requests pending"
            value={summary.pendingRequests ?? 0}
            description="Unresolved request tickets in this period"
            to={ticketsPath}
            icon={CheckCircle2}
          />
          <OverviewCard
            label="Inbound calls"
            value={summary.inboundCount ?? 0}
            description="Tickets initiated by customers in this period"
            to={ticketsPath}
            icon={PhoneCall}
            tone="blue"
          />
          <OverviewCard
            label="Outbound calls"
            value={summary.outboundCount ?? 0}
            description="Tickets created from outbound calls in this period"
            to={ticketsPath}
            icon={ArrowUpRight}
          />
          <OverviewCard
            label="Surveys sent"
            value={summary.surveysSent ?? 0}
            description="Survey links created in this period"
            to={surveysPath}
            icon={MessageSquareShare}
          />
          <OverviewCard
            label="Sales records"
            value={summary.totalSalesRecords ?? 0}
            description={`Books sold logged in this period: ${summary.totalBooksSold ?? 0}`}
            to={salesRecordsPath}
            icon={BookOpen}
            tone="blue"
          />
          <OverviewCard
            label="Sales value"
            value={formatCurrency(summary.totalSalesValue ?? 0)}
            description="Total sales amount recorded in this period"
            to={salesRecordsPath}
            icon={Banknote}
            tone="amber"
            valueClassName="text-3xl sm:text-4xl"
          />
          {isCsrAdmin && (
            <>
              <OverviewCard
                label="CSR team"
                value="Manage"
                description="Create, update, activate, and deactivate CSR accounts"
                to={staffPath}
                icon={Users}
                tone="blue"
              />
              <OverviewCard
                label="Sales reps"
                value="Manage"
                description="Maintain sales representatives used across CRM tickets"
                to={salesRepsPath}
                icon={Users}
              />
              <OverviewCard
                label="Reports"
                value="View"
                description="Read CRM-wide activity, survey, and ticket performance reports"
                to={reportsPath}
                icon={ScrollText}
                tone="amber"
              />
            </>
          )}
          </div>
        </>
      )}
    </PanelLayout>
  );
};

export default CsrDashboard;
