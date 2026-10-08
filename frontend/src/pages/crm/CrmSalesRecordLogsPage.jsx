import { useCallback, useEffect, useState } from "react";

import { formatOrganizationType, getCsrDisplayName } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { listCrmSalesRecordLogs } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleTimeString();
};

const getLogChanges = (log) => {
  if (log.changes?.length) {
    return log.changes;
  }

  if (log.previousSaleDate || log.newSaleDate) {
    return [
      {
        field: "saleDate",
        label: "Sale date and time",
        before: log.previousSaleDate,
        after: log.newSaleDate,
      },
    ];
  }

  return [];
};

const formatLoggedValue = (change, key) => {
  const value = change?.[key];

  if (!value) {
    return "—";
  }

  if (change.field === "saleDate") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  if (change.field === "organizationType") {
    return formatOrganizationType(value);
  }

  return value;
};

const CrmSalesRecordLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listCrmSalesRecordLogs({
        page,
        limit: 15,
        search: appliedSearch.trim() || undefined,
      });

      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load sales change logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  return (
    <PanelLayout title="Sales Change Log">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Audit log</h2>
          <p className="mt-1 text-sm text-slate-600">
            Every sales record edit made by a CSR admin is recorded here, including amounts,
            books, and the sale date.
          </p>
        </div>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Search organization, location, title, or who changed it..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Search
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading change logs...</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No sales record edits have been logged yet.
            </p>
          ) : (
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Changed</th>
                  <th className="pb-3 pr-4 font-medium">Changed by</th>
                  <th className="pb-3 pr-4 font-medium">Sale</th>
                  <th className="pb-3 pr-4 font-medium">Logged by</th>
                  <th className="pb-3 font-medium">What changed</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="py-3 pr-4 text-slate-700">
                      <div>{formatDate(log.createdAt)}</div>
                      <div className="text-xs text-slate-500">{formatTime(log.createdAt)}</div>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {getCsrDisplayName(log.changedBy, log.changedByName || "Unknown")}
                    </td>
                    <td className="max-w-[240px] py-3 pr-4 text-slate-700">
                      <div className="font-medium text-slate-950">
                        {capitalizeWords(log.schoolName) || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.organizationType
                          ? formatOrganizationType(log.organizationType)
                          : "Sale"}
                        {log.location ? ` · ${log.location}` : ""}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {getCsrDisplayName(log.owner, log.ownerName || "Unknown")}
                    </td>
                    <td className="py-3 text-slate-700">
                      <div className="space-y-2">
                        {getLogChanges(log).map((change) => (
                          <div key={`${log._id}-${change.field}`}>
                            <p className="font-medium text-slate-950">{change.label}</p>
                            <p className="text-xs text-slate-500">
                              {formatLoggedValue(change, "before")}
                            </p>
                            <p className="text-xs font-semibold text-emerald-700">
                              {formatLoggedValue(change, "after")}
                            </p>
                          </div>
                        ))}
                      </div>
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

export default CrmSalesRecordLogsPage;
