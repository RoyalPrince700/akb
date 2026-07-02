import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarRange, Search } from "lucide-react";

import {
  bookSaleClassOptions,
  formatBookSaleClass,
  formatOrganizationType,
  getCsrDisplayName,
} from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { getCrmReports, listCrmSalesRecords, listStaff } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const periodOptions = [
  { value: "all", label: "All time" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

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
    return "Showing all sales logged by the CSR team";
  }

  const start = formatDisplayDate(period.startDate);
  const end = formatDisplayDate(period.endDate);

  if (period.type === "week") {
    return `Showing sales from this week (${start} – ${end})`;
  }

  if (period.type === "month") {
    return `Showing sales from this month (${start} – ${end})`;
  }

  if (period.type === "year") {
    return `Showing sales from this year (${start} – ${end})`;
  }

  return `Showing sales from ${start} to ${end}`;
};

const SummaryCard = ({ label, value, helper }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</h2>
    <p className="mt-2 text-sm text-slate-500">{helper}</p>
  </div>
);

const CrmCsrSalesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [csrRows, setCsrRows] = useState([]);
  const [csrOptions, setCsrOptions] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalQuantitySold: 0,
    totalSalesValue: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedCustomRange, setAppliedCustomRange] = useState({ startDate: "", endDate: "" });
  const [activePeriod, setActivePeriod] = useState({ type: "month" });
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("owner") || "");
  const [csrSearch, setCsrSearch] = useState("");
  const [search, setSearch] = useState("");
  const [bookClassFilter, setBookClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const emptySummary = {
    totalRecords: 0,
    totalQuantitySold: 0,
    totalSalesValue: 0,
  };

  useEffect(() => {
    const loadCsrs = async () => {
      try {
        const data = await listStaff({ role: "csr", limit: 100 });
        setCsrOptions(data.staff || []);
      } catch {
        setCsrOptions([]);
      }
    };

    loadCsrs();
  }, []);

  useEffect(() => {
    const ownerFromUrl = searchParams.get("owner") || "";
    setOwnerFilter(ownerFromUrl);
    setPage(1);
  }, [searchParams]);

  const buildPeriodParams = useCallback(() => {
    const params = { period };

    if (period === "custom") {
      if (!appliedCustomRange.startDate || !appliedCustomRange.endDate) {
        return null;
      }

      params.startDate = appliedCustomRange.startDate;
      params.endDate = appliedCustomRange.endDate;
    }

    return params;
  }, [appliedCustomRange.endDate, appliedCustomRange.startDate, period]);

  const loadSalesData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const periodParams = buildPeriodParams();

      if (!periodParams) {
        setRecords([]);
        setCsrRows([]);
        setSummary(emptySummary);
        setActivePeriod({ type: "custom" });
        setPagination({ page: 1, pages: 1, total: 0 });
        setLoading(false);
        return;
      }

      const salesParams = {
        ...periodParams,
        page,
        limit: 12,
        search: search.trim() || undefined,
        bookClass: bookClassFilter || undefined,
      };

      if (ownerFilter) {
        salesParams.owner = ownerFilter;
      }

      const [salesData, reportsData] = await Promise.all([
        listCrmSalesRecords(salesParams),
        getCrmReports(periodParams),
      ]);

      setRecords(salesData.records || []);
      setSummary(salesData.summary || emptySummary);
      setActivePeriod(salesData.period || { type: period });
      setPagination(salesData.pagination || { page: 1, pages: 1, total: 0 });

      const performanceById = new Map(
        (reportsData.reports?.csrPerformance || []).map((row) => [row._id, row])
      );

      const merged = csrOptions.map((csr) => {
        const metrics = performanceById.get(csr._id) || {};

        return {
          _id: csr._id,
          name: getCsrDisplayName(csr),
          staffId: csr.staffId || metrics.staffId || "",
          isActive: csr.isActive,
          salesRecords: metrics.salesRecords ?? 0,
          booksSold: metrics.booksSold ?? 0,
          salesValue: metrics.salesValue ?? 0,
        };
      });

      setCsrRows(merged.sort((a, b) => b.salesValue - a.salesValue));
    } catch (apiError) {
      setRecords([]);
      setCsrRows([]);
      setSummary(emptySummary);
      setError(apiError.response?.data?.message || "Failed to load CSR sales.");
    } finally {
      setLoading(false);
    }
  }, [
    bookClassFilter,
    buildPeriodParams,
    csrOptions,
    ownerFilter,
    page,
    period,
    search,
  ]);

  useEffect(() => {
    if (csrOptions.length) {
      loadSalesData();
    }
  }, [csrOptions.length, loadSalesData]);

  const periodDescription = useMemo(() => getPeriodDescription(activePeriod), [activePeriod]);

  const filteredCsrRows = useMemo(() => {
    const term = csrSearch.trim().toLowerCase();

    if (!term) {
      return csrRows;
    }

    return csrRows.filter(
      (row) =>
        row.name?.toLowerCase().includes(term) ||
        row.staffId?.toLowerCase().includes(term)
    );
  }, [csrRows, csrSearch]);

  const selectedCsrLabel = useMemo(() => {
    if (!ownerFilter) {
      return "";
    }

    const match = csrOptions.find((csr) => csr._id === ownerFilter);
    return getCsrDisplayName(match, "Selected CSR");
  }, [csrOptions, ownerFilter]);

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value;
    setPeriod(nextPeriod);
    setPage(1);

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
    setPage(1);
    setAppliedCustomRange({ startDate, endDate });
  };

  const handleOwnerFilterChange = (event) => {
    const nextOwner = event.target.value;
    setOwnerFilter(nextOwner);
    setPage(1);

    const nextParams = new URLSearchParams(searchParams);
    if (nextOwner) {
      nextParams.set("owner", nextOwner);
    } else {
      nextParams.delete("owner");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    loadSalesData();
  };

  return (
    <PanelLayout title="All Sales">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <CalendarRange className="h-4 w-4" aria-hidden />
              <p className="text-sm font-semibold">Sales period</p>
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

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Sales records"
          value={summary.totalRecords ?? 0}
          helper={
            selectedCsrLabel
              ? `Entries logged by ${selectedCsrLabel}`
              : "Entries logged by the CSR team"
          }
        />
        <SummaryCard
          label="Books sold"
          value={summary.totalQuantitySold ?? 0}
          helper="Total quantity in the selected period"
        />
        <SummaryCard
          label="Sales value"
          value={formatCurrency(summary.totalSalesValue)}
          helper="Discounted total in the selected period"
        />
      </div>

      <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Sales by CSR</h2>
            <p className="mt-2 text-sm text-slate-600">
              See which CSR staff logged sales in the selected period and open their full sales
              list.
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

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading CSR sales summary...</p>
          ) : filteredCsrRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">No CSR sales data found.</p>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">CSR</th>
                  <th className="pb-3 pr-4 font-medium">Staff ID</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Sales records</th>
                  <th className="pb-3 pr-4 font-medium">Books sold</th>
                  <th className="pb-3 pr-4 font-medium">Sales value</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCsrRows.map((csr) => (
                  <tr key={csr._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">{csr.name}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.staffId || "—"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          csr.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {csr.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{csr.salesRecords}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.booksSold}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">
                      {formatCurrency(csr.salesValue)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/csr/csr-sales?owner=${csr._id}`}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        View sales
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">All sales records</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedCsrLabel
              ? `Showing sales logged by ${selectedCsrLabel}.`
              : "Review every sale logged by CSR staff in the selected period."}
          </p>
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            placeholder="Search school, bookshop, location, or title..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <select
            value={ownerFilter}
            onChange={handleOwnerFilterChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All CSRs</option>
            {csrOptions.map((csr) => (
              <option key={csr._id} value={csr._id}>
                {getCsrDisplayName(csr)}
              </option>
            ))}
          </select>
          <select
            value={bookClassFilter}
            onChange={(event) => {
              setBookClassFilter(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All classes</option>
            {bookSaleClassOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Search
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading sales records...</p>
          ) : records.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">No sales records found.</p>
          ) : (
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Logged by</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Location</th>
                  <th className="pb-3 pr-4 font-medium">Titles, class, quantity, and price</th>
                  <th className="pb-3 pr-4 font-medium">Quantity</th>
                  <th className="pb-3 pr-4 font-medium">Subtotal</th>
                  <th className="pb-3 pr-4 font-medium">Discount</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {getCsrDisplayName(record.owner, "Unknown")}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatOrganizationType(record.organizationType || "school")}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {capitalizeWords(record.schoolName)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{record.location}</td>
                    <td className="max-w-[320px] py-3 pr-4 text-slate-700">
                      {record.bookItems?.length ? (
                        <div className="space-y-1">
                          {record.bookItems.map((item, index) => (
                            <div
                              key={`${item.title}-${index}`}
                              className="grid gap-1 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-3"
                            >
                              <span>{item.title}</span>
                              <span className="text-xs font-semibold text-slate-500">
                                {item.bookClass || record.bookClass
                                  ? formatBookSaleClass(item.bookClass || record.bookClass)
                                  : "-"}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                Qty {item.quantity || 1}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(item.totalPrice ?? item.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span title={record.bookTitles} className="line-clamp-2">
                          {record.bookTitles}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">
                      {record.quantitySold}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-700">
                      {formatCurrency(record.subtotalPrice)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {record.discountPercent ? `${record.discountPercent}% ` : ""}
                      {record.discountAmount
                        ? `(${formatCurrency(record.discountAmount)})`
                        : "-"}
                    </td>
                    <td className="py-3 pr-4 font-bold text-emerald-700">
                      {formatCurrency(record.totalPrice)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {new Date(record.saleDate || record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-slate-700">
                      {new Date(record.saleDate || record.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
                disabled={page >= pagination.pages}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </PanelLayout>
  );
};

export default CrmCsrSalesPage;
