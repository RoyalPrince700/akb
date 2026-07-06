import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Store, User } from "lucide-react";

import { nigerianStates } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { capitalizeWords } from "../../utils/textFormat";
import { listBookshops, listIndividuals, listSchools } from "../../services/api";

const TABS = [
  { id: "schools", label: "Schools", icon: GraduationCap },
  { id: "individuals", label: "Individuals", icon: User },
  { id: "bookshops", label: "Bookshops", icon: Store },
];

const TAB_CONFIG = {
  schools: {
    fetch: listSchools,
    listKey: "schools",
    nameKey: "schoolName",
    nameLabel: "Name",
    searchPlaceholder: "Search school, address, phone...",
    emptyMessage: "No schools found.",
  },
  individuals: {
    fetch: listIndividuals,
    listKey: "individuals",
    nameKey: "individualName",
    nameLabel: "Name",
    searchPlaceholder: "Search individual, address, phone...",
    emptyMessage: "No individuals found.",
  },
  bookshops: {
    fetch: listBookshops,
    listKey: "bookshops",
    nameKey: "bookshopName",
    nameLabel: "Name",
    searchPlaceholder: "Search bookshop, address, phone...",
    emptyMessage: "No bookshops found.",
  },
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const CrmCustomerDirectoryPage = () => {
  const [activeTab, setActiveTab] = useState("schools");
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedState, setAppliedState] = useState("");

  const config = TAB_CONFIG[activeTab];

  const loadRecords = useCallback(async () => {
    const tabConfig = TAB_CONFIG[activeTab];
    setLoading(true);
    setError("");

    try {
      const data = await tabConfig.fetch({
        page,
        limit: 50,
        search: appliedSearch.trim() || undefined,
        state: appliedState || undefined,
      });
      setRecords(data[tabConfig.listKey] || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load directory records.");
      setRecords([]);
      setPagination({ page: 1, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, appliedSearch, appliedState]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search);
    setAppliedState(stateFilter);
  };

  const activeTabMeta = TABS.find((tab) => tab.id === activeTab);

  return (
    <PanelLayout title="Customer Directory">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Schools, individuals & bookshops</h2>
          <p className="mt-1 text-sm text-slate-600">
            Browse all customer records stored in the CRM directory.
          </p>
        </div>

        <div className="mt-5 border-b border-slate-200">
          <div className="flex gap-2 overflow-x-auto pb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-t-xl px-4 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border border-b-white border-slate-200 bg-white text-emerald-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <tab.icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form
          className="mt-5 grid gap-3 md:grid-cols-3"
          onSubmit={handleFilterSubmit}
        >
          <input
            type="search"
            placeholder={config.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All states</option>
            {nigerianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Apply filters
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          {loading
            ? `Loading ${activeTabMeta?.label.toLowerCase()}...`
            : `${pagination.total} ${activeTabMeta?.label.toLowerCase()} found`}
        </p>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Loading {activeTabMeta?.label.toLowerCase()}...
            </p>
          ) : records.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">{config.emptyMessage}</p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">{config.nameLabel}</th>
                  <th className="pb-3 pr-4 font-medium">Address</th>
                  <th className="pb-3 pr-4 font-medium">State</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {capitalizeWords(record[config.nameKey] || "-")}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{record.address || "-"}</td>
                    <td className="py-3 pr-4 text-slate-700">{record.state || "-"}</td>
                    <td className="py-3 pr-4 text-slate-700">{record.phoneNumber || "-"}</td>
                    <td className="py-3 text-slate-700">{formatDate(record.createdAt)}</td>
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
              onClick={() => setPage((current) => current - 1)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages} ({pagination.total} records)
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </PanelLayout>
  );
};

export default CrmCustomerDirectoryPage;
