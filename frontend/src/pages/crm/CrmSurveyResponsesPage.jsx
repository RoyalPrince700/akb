import { useCallback, useEffect, useState } from "react";

import { getCsrDisplayName } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { listSurveyResponses } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const formatRating = (value) => (value ? `${value}/5` : "-");

const averageRating = (response) => {
  if (!response) {
    return "-";
  }

  const ratings = [
    response.serviceRating,
    response.marketerRating,
    response.csrRating ?? response.responseSpeedRating,
    response.resolutionRating,
    response.recommendRating,
  ].filter((rating) => typeof rating === "number");

  if (!ratings.length) {
    return "-";
  }

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return `${average.toFixed(1)}/5`;
};

const SummaryCard = ({ label, value, helper }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</h2>
    {helper && <p className="mt-2 text-sm text-slate-500">{helper}</p>}
  </div>
);

const CrmSurveyResponsesPage = () => {
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    avgService: 0,
    avgMarketer: 0,
    avgCsr: 0,
    avgResolution: 0,
    avgRecommend: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadResponses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listSurveyResponses({
        page,
        limit: 15,
        search: search.trim() || undefined,
      });
      setResponses(data.responses || []);
      setSummary(data.summary || {});
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load survey responses.");
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    loadResponses();
  };

  return (
    <PanelLayout title="Survey Responses">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total responses"
          value={summary.total ?? 0}
          helper="All completed customer surveys"
        />
        <SummaryCard
          label="Avg. service"
          value={formatRating(summary.avgService)}
          helper="Overall service satisfaction"
        />
        <SummaryCard
          label="Avg. marketer"
          value={formatRating(summary.avgMarketer)}
          helper="Marketer who attended the customer"
        />
        <SummaryCard
          label="Avg. CSR"
          value={formatRating(summary.avgCsr)}
          helper="CSR who handled the call"
        />
        <SummaryCard
          label="Avg. resolution"
          value={formatRating(summary.avgResolution)}
          helper="Resolution satisfaction"
        />
        <SummaryCard
          label="Avg. recommend"
          value={formatRating(summary.avgRecommend)}
          helper="Likelihood to recommend"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">All survey responses</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review every customer survey submission across the CRM, including ratings and
            feedback.
          </p>
        </div>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Search school, phone, email, or feedback..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 sm:shrink-0"
          >
            Search
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading responses...</p>
          ) : responses.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No survey responses found yet.
            </p>
          ) : (
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">School</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium">Marketer</th>
                  <th className="pb-3 pr-4 font-medium">CSR</th>
                  <th className="pb-3 pr-4 font-medium">Resolution</th>
                  <th className="pb-3 pr-4 font-medium">Recommend</th>
                  <th className="pb-3 pr-4 font-medium">Average</th>
                  <th className="pb-3 pr-4 font-medium">Feedback</th>
                  <th className="pb-3 pr-4 font-medium">Ticket CSR</th>
                  <th className="pb-3 pr-4 font-medium">Sales rep</th>
                  <th className="pb-3 pr-4 font-medium">Triggered by</th>
                  <th className="pb-3 pr-4 font-medium">Responded</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((entry) => (
                  <tr key={entry._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {capitalizeWords(entry.customerName)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{entry.customerPhoneNumber}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatRating(entry.response?.serviceRating)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatRating(entry.response?.marketerRating)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatRating(
                        entry.response?.csrRating ?? entry.response?.responseSpeedRating
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatRating(entry.response?.resolutionRating)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatRating(entry.response?.recommendRating)}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">
                      {averageRating(entry.response)}
                    </td>
                    <td className="max-w-[220px] py-3 pr-4 text-slate-700">
                      {entry.response?.feedback ? (
                        <span title={entry.response.feedback} className="line-clamp-2">
                          {entry.response.feedback}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {getCsrDisplayName(entry.interaction?.owner, "Unknown")}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {capitalizeWords(entry.interaction?.salesRep?.name) || "Unassigned"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {getCsrDisplayName(entry.sentBy, "Unknown")}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {entry.response?.respondedAt
                        ? new Date(entry.response.respondedAt).toLocaleString()
                        : "-"}
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
              onClick={() => setPage((current) => current - 1)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages} ({pagination.total} responses)
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

export default CrmSurveyResponsesPage;
