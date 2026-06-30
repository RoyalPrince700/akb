import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import SurveyDispatchModal from "../../components/crm/SurveyDispatchModal";
import { formatCrmCategory, formatOrganizationType, formatRoleLabel, nigerianStates } from "../../constants/crm";
import { useAuth } from "../../context/AuthContext";
import PanelLayout from "../../layouts/PanelLayout";
import {
  createSurveyDispatch,
  listCrmInteractions,
} from "../../services/api";
import { handleSurveyDispatchShare } from "../../utils/crmSurvey";
import { panelSegmentPath } from "../../utils/rolePaths";
import { capitalizeWords } from "../../utils/textFormat";

const CrmInteractionsPage = () => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [sendingSurvey, setSendingSurvey] = useState(false);

  const listPath = panelSegmentPath(user?.role, "interactions");

  const loadInteractions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.state = stateFilter;
      if (directionFilter) params.direction = directionFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await listCrmInteractions(params);
      setInteractions(data.interactions || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load CRM tickets.");
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  }, [directionFilter, page, search, stateFilter, statusFilter]);

  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    loadInteractions();
  };

  const openSurveyModal = (interaction) => {
    setActiveInteraction(interaction);
    setSurveyModalOpen(true);
  };

  const closeSurveyModal = () => {
    setSurveyModalOpen(false);
    setActiveInteraction(null);
  };

  const handleSurveySubmit = async (formData) => {
    setSendingSurvey(true);
    setError("");

    try {
      const data = await createSurveyDispatch(formData);
      if (data.dispatch) {
        await handleSurveyDispatchShare(data.dispatch);
        window.alert("Survey link triggered successfully.");
      }
      closeSurveyModal();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to create survey link.");
    } finally {
      setSendingSurvey(false);
    }
  };

  return (
    <PanelLayout title="CRM Tickets">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Ticket log</h2>
            <p className="mt-1 text-sm text-slate-600">
              {pagination.total} ticket{pagination.total !== 1 ? "s" : ""} logged
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`${listPath}/new?direction=inbound`}
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Create inbound ticket
            </Link>
            <Link
              to={`${listPath}/new?direction=outbound`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Create outbound ticket
            </Link>
          </div>
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            placeholder="Search school, bookshop, phone, address..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:col-span-2"
          />
          <select
            value={stateFilter}
            onChange={(event) => {
              setStateFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All states</option>
            {nigerianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            value={directionFilter}
            onChange={(event) => {
              setDirectionFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All statuses</option>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 xl:col-span-5 xl:w-fit"
          >
            Apply filters
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading tickets...</p>
          ) : interactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No CRM tickets found.
            </p>
          ) : (
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Direction</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">State</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Sales rep</th>
                  <th className="pb-3 pr-4 font-medium">CSR</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interactions.map((interaction) => (
                  <tr key={interaction._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 text-slate-700">
                      {formatOrganizationType(interaction.customer.organizationType || "school")}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {capitalizeWords(interaction.customer.schoolName)}
                    </td>
                    <td className="py-3 pr-4 capitalize text-slate-700">
                      {interaction.direction}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatCrmCategory(interaction.category)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{interaction.customer.state}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {interaction.customer.phoneNumber}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {capitalizeWords(interaction.salesRep?.name) || "Unassigned"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {interaction.owner?.name || formatRoleLabel(user?.role)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          interaction.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {interaction.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {new Date(interaction.dateOfContact).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`${listPath}/${interaction._id}/edit`}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => openSurveyModal(interaction)}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Trigger survey
                        </button>
                      </div>
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
              Page {pagination.page} of {pagination.pages}
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

      <SurveyDispatchModal
        interaction={activeInteraction}
        isOpen={surveyModalOpen}
        onClose={closeSurveyModal}
        onSubmit={handleSurveySubmit}
        saving={sendingSurvey}
      />
    </PanelLayout>
  );
};

export default CrmInteractionsPage;
