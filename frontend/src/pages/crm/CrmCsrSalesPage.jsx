import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarRange, Search } from "lucide-react";

import SalesRecordEditModal from "../../components/crm/SalesRecordEditModal";
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
  { value: "lastWeek", label: "Last week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
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

const formatMonthLabel = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})$/);

  if (!match) {
    return "";
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const getPeriodDescription = (period, selectedMonth = "") => {
  if (!period || period.type === "all") {
    return "All time. Every sale is listed so you can find one and change its date.";
  }

  const start = formatDisplayDate(period.startDate);
  const end = formatDisplayDate(period.endDate);
  const range = start && end ? ` (${start} – ${end})` : "";

  if (period.type === "lastWeek") {
    return `Last week${range}.`;
  }

  if (period.type === "month") {
    return `This month${range}.`;
  }

  if (period.type === "selectedMonth") {
    const label = formatMonthLabel(selectedMonth);
    return label ? `${label}${range}.` : `Selected month${range}.`;
  }

  return "All time. Every sale is listed so you can find one and change its date.";
};

const SummaryCard = ({ label, value, helper }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</h2>
    <p className="mt-2 text-sm text-slate-500">{helper}</p>
  </div>
);

const getPageFromSearchParams = (searchParams) =>
  Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

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
  const requestedPeriod = searchParams.get("period") || "all";
  const monthFilter = searchParams.get("month") || "";
  const period = periodOptions.some((option) => option.value === requestedPeriod)
    ? requestedPeriod
    : requestedPeriod === "selectedMonth" && monthFilter
      ? "selectedMonth"
      : "all";
  const [activePeriod, setActivePeriod] = useState({ type: period });
  const ownerFilter = searchParams.get("owner") || "";
  const appliedSearch = searchParams.get("search") || "";
  const [searchDraft, setSearchDraft] = useState(appliedSearch);
  const bookClassFilter = searchParams.get("bookClass") || "";
  const page = getPageFromSearchParams(searchParams);
  const [csrSearch, setCsrSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);

  const emptySummary = {
    totalRecords: 0,
    totalQuantitySold: 0,
    totalSalesValue: 0,
  };

  const updateFilterParams = useCallback(
    (updates, { resetPage = false } = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      if (resetPage) {
        nextParams.delete("page");
      }

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, String(value));
        } else {
          nextParams.delete(key);
        }
      });

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const buildCsrSalesLink = useCallback(
    (ownerId) => {
      const params = new URLSearchParams(searchParams);
      params.set("owner", ownerId);
      return `/csr/csr-sales?${params.toString()}`;
    },
    [searchParams]
  );

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
    setSearchDraft(appliedSearch);
  }, [appliedSearch]);

  const buildPeriodParams = useCallback(() => {
    if (period === "selectedMonth") {
      return { period: "selectedMonth", month: monthFilter };
    }

    return { period };
  }, [monthFilter, period]);

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
        limit: 20,
      };

      if (appliedSearch.trim()) {
        salesParams.search = appliedSearch.trim();
      }

      if (bookClassFilter) {
        salesParams.bookClass = bookClassFilter;
      }

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
    appliedSearch,
    bookClassFilter,
    buildPeriodParams,
    csrOptions,
    ownerFilter,
    page,
    period,
  ]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const periodDescription = useMemo(
    () => getPeriodDescription(activePeriod, monthFilter),
    [activePeriod, monthFilter]
  );

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

  const selectPeriod = (nextPeriod) => {
    setError("");
    updateFilterParams(
      {
        period: nextPeriod,
        month: "",
        startDate: "",
        endDate: "",
      },
      { resetPage: true }
    );
  };

  const handleMonthChange = (event) => {
    const nextMonth = event.target.value;
    setError("");

    if (!nextMonth) {
      selectPeriod("all");
      return;
    }

    updateFilterParams(
      {
        period: "selectedMonth",
        month: nextMonth,
        startDate: "",
        endDate: "",
      },
      { resetPage: true }
    );
  };

  const handleOwnerFilterChange = (event) => {
    updateFilterParams({ owner: event.target.value }, { resetPage: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateFilterParams({ search: searchDraft.trim() }, { resetPage: true });
  };

  const handlePageChange = (nextPage) => {
    updateFilterParams({ page: nextPage > 1 ? String(nextPage) : "" });
  };

  const openRecordEditor = (record) => {
    setEditingRecord(record);
    setError("");
    setSuccessMessage("");
  };

  const handleRecordSaved = async (message) => {
    setEditingRecord(null);
    setSuccessMessage(message);
    await loadSalesData();
  };

  return (
    <PanelLayout title="All Sales">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </p>
      )}

      <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
        <div className="flex items-center gap-2 text-emerald-700">
          <CalendarRange className="h-4 w-4" aria-hidden />
          <p className="text-sm font-semibold">Show sales from</p>
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sales period">
            {periodOptions.map((option) => {
              const isActive = period === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectPeriod(option.value)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-700 text-white"
                      : "border border-slate-300 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <label className="block w-full lg:max-w-xs">
            <span className="text-sm font-medium text-slate-700">Or pick a month</span>
            <input
              type="month"
              value={period === "selectedMonth" ? monthFilter : ""}
              onChange={handleMonthChange}
              aria-label="Pick a month"
              className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 ${
                period === "selectedMonth"
                  ? "border-emerald-600 ring-4 ring-emerald-100"
                  : "border-slate-300"
              }`}
            />
          </label>
        </div>
        <p className="mt-3 text-sm text-slate-600">{periodDescription}</p>
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
        <div>
          <h2 className="text-xl font-bold text-slate-950">Sales to edit</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedCsrLabel
              ? `${summary.totalRecords ?? 0} sales logged by ${selectedCsrLabel}. Use Edit on a row to update the sale.`
              : `${summary.totalRecords ?? 0} sales in this view. Use Edit on a row to update the sale.`}
          </p>
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto]"
          onSubmit={handleSearchSubmit}
        >
          <label className="block sm:col-span-2 xl:col-span-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">Search sale</span>
            <input
              type="search"
              placeholder="School, bookshop, location, or title"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">CSR</span>
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
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Book class</span>
            <select
              value={bookClassFilter}
              onChange={(event) => {
                updateFilterParams({ bookClass: event.target.value }, { resetPage: true });
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
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center self-end rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Search
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading sales records...</p>
          ) : records.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-600">No sales in this view.</p>
              {period !== "all" && (
                <button
                  type="button"
                  onClick={() => selectPeriod("all")}
                  className="mt-3 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Show all time
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[1400px] text-left text-sm">
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
                  <th className="pb-3 pr-4 font-medium">Time</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
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
                    <td className="py-3 pr-4 text-slate-700">
                      {new Date(record.saleDate || record.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openRecordEditor(record)}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Edit
                      </button>
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
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.pages}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">CSR totals</h2>
            <p className="mt-2 text-sm text-slate-600">
              Totals for the same period. Choose a CSR to open only their sales.
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
                        to={buildCsrSalesLink(csr._id)}
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


      {editingRecord && (
        <SalesRecordEditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={handleRecordSaved}
        />
      )}
    </PanelLayout>
  );
};

export default CrmCsrSalesPage;
