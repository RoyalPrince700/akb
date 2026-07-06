import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import SurveyDispatchModal from "../../components/crm/SurveyDispatchModal";
import {
  crmDirections,
  formatCrmCategory,
  formatCrmDirection,
  formatOrganizationType,
  getCsrDisplayName,
  isFollowUpDirection,
  nigerianStates,
} from "../../constants/crm";
import { useAuth } from "../../context/AuthContext";
import PanelLayout from "../../layouts/PanelLayout";
import {
  createSurveyDispatch,
  deleteCrmInteraction,
  listCrmInteractions,
  listStaff,
} from "../../services/api";
import {
  handleSurveyDispatchShare,
  wasSurveySentByServer,
} from "../../utils/crmSurvey";
import { panelSegmentPath } from "../../utils/rolePaths";
import { capitalizeWords } from "../../utils/textFormat";

const getPageFromSearchParams = (searchParams) =>
  Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

const CrmInteractionsPage = () => {
  const { user } = useAuth();
  const isCsrAdmin = user?.role === "csrAdmin";
  const [searchParams, setSearchParams] = useSearchParams();
  const [interactions, setInteractions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const appliedSearch = searchParams.get("search") || "";
  const [searchDraft, setSearchDraft] = useState(appliedSearch);
  const stateFilter = searchParams.get("state") || "";
  const directionFilter = searchParams.get("direction") || "";
  const statusFilter = searchParams.get("status") || "";
  const ownerFilter = searchParams.get("owner") || "";
  const startDateFilter = searchParams.get("startDate") || "";
  const endDateFilter = searchParams.get("endDate") || "";
  const page = getPageFromSearchParams(searchParams);
  const [csrOptions, setCsrOptions] = useState([]);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [sendingSurvey, setSendingSurvey] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const listPath = panelSegmentPath(user?.role, "interactions");

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

  const selectedCsrLabel = useMemo(() => {
    if (!ownerFilter) {
      return "";
    }

    const match = csrOptions.find((csr) => csr._id === ownerFilter);
    return getCsrDisplayName(match, "Selected CSR");
  }, [csrOptions, ownerFilter]);

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

  useEffect(() => {
    setSearchDraft(appliedSearch);
  }, [appliedSearch]);

  const loadInteractions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: 10 };
      if (appliedSearch.trim()) params.search = appliedSearch.trim();
      if (stateFilter) params.state = stateFilter;
      if (directionFilter) params.direction = directionFilter;
      if (statusFilter) params.status = statusFilter;
      if (isCsrAdmin && ownerFilter) params.owner = ownerFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

      const data = await listCrmInteractions(params);
      setInteractions(data.interactions || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load CRM tickets.");
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  }, [
    appliedSearch,
    directionFilter,
    isCsrAdmin,
    ownerFilter,
    page,
    startDateFilter,
    endDateFilter,
    stateFilter,
    statusFilter,
  ]);

  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateFilterParams({ search: searchDraft.trim() }, { resetPage: true });
  };

  const handleDirectionFilterChange = (event) => {
    updateFilterParams({ direction: event.target.value }, { resetPage: true });
  };

  const handleOwnerFilterChange = (event) => {
    updateFilterParams({ owner: event.target.value }, { resetPage: true });
  };

  const handlePageChange = (nextPage) => {
    updateFilterParams({ page: nextPage > 1 ? String(nextPage) : "" });
  };

  const handleDateFilterChange = (key, value) => {
    const nextStartDate = key === "startDate" ? value : startDateFilter;
    const nextEndDate = key === "endDate" ? value : endDateFilter;

    if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
      setError("Start date must be before or equal to end date.");
      return;
    }

    setError("");
    updateFilterParams({ [key]: value }, { resetPage: true });
  };

  const openSurveyModal = (interaction) => {
    setActiveInteraction(interaction);
    setSurveyModalOpen(true);
  };

  const closeSurveyModal = () => {
    setSurveyModalOpen(false);
    setActiveInteraction(null);
  };

  const handleDelete = async (interaction) => {
    const ticketLabel = capitalizeWords(interaction.customer.schoolName) || "this ticket";

    if (
      !window.confirm(
        `Delete the ticket for ${ticketLabel}? This will also remove any linked survey sends and cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(interaction._id);
    setError("");

    try {
      await deleteCrmInteraction(interaction._id);

      if (interactions.length === 1 && page > 1) {
        handlePageChange(page - 1);
      } else {
        loadInteractions();
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to delete ticket.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSurveySubmit = async (formData) => {
    setSendingSurvey(true);
    setError("");

    try {
      const data = await createSurveyDispatch(formData);
      if (data.dispatch) {
        if (!wasSurveySentByServer(data.dispatch, data)) {
          await handleSurveyDispatchShare(data.dispatch);
        }
        window.alert(
          data.dispatch.channel === "SMS" && data.sms?.sent
            ? "Survey SMS sent successfully."
            : "Survey link triggered successfully."
        );
      }
      closeSurveyModal();
      loadInteractions();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to create survey link.");
    } finally {
      setSendingSurvey(false);
    }
  };

  return (
    <PanelLayout title={isCsrAdmin ? "All CRM Tickets" : "CRM Tickets"}>
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
              {isCsrAdmin
                ? selectedCsrLabel
                  ? `${pagination.total} ticket${pagination.total !== 1 ? "s" : ""} for ${selectedCsrLabel}`
                  : `${pagination.total} ticket${pagination.total !== 1 ? "s" : ""} across the CSR team`
                : `${pagination.total} ticket${pagination.total !== 1 ? "s" : ""} logged`}
            </p>
          </div>
          {!isCsrAdmin && (
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
          )}
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            placeholder="Search school, bookshop, phone, address..."
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:col-span-2"
          />
          {isCsrAdmin && (
            <select
              value={ownerFilter}
              onChange={handleOwnerFilterChange}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">All CSRs</option>
              {csrOptions.map((csr) => (
                <option key={csr._id} value={csr._id}>
                  {getCsrDisplayName(csr)}
                </option>
              ))}
            </select>
          )}
          <select
            value={stateFilter}
            onChange={(event) => {
              updateFilterParams({ state: event.target.value }, { resetPage: true });
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
            onChange={handleDirectionFilterChange}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All directions</option>
            {crmDirections.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              updateFilterParams({ status: event.target.value }, { resetPage: true });
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All statuses</option>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
          </select>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">From date</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(event) => handleDateFilterChange("startDate", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">To date</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(event) => handleDateFilterChange("endDate", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 sm:col-span-2 xl:col-span-4 xl:w-fit"
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
                  <th className="pb-3 pr-4 font-medium">Survey</th>
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
                    <td className="py-3 pr-4 text-slate-700">
                      {formatCrmDirection(interaction.direction)}
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
                      {getCsrDisplayName(interaction.owner, "Unknown CSR")}
                    </td>
                    <td className="py-3 pr-4">
                      {isFollowUpDirection(interaction.direction) ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            interaction.status === "resolved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {interaction.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {isFollowUpDirection(interaction.direction) ? (
                        <span className="text-slate-500">—</span>
                      ) : interaction.surveyTriggered ? (
                        <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                          Sent
                          {interaction.surveyDispatchCount > 1
                            ? ` (${interaction.surveyDispatchCount}x)`
                            : ""}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          Not sent
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {new Date(interaction.dateOfContact).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isCsrAdmin ? (
                          <>
                            <Link
                              to={`${listPath}/${interaction._id}${
                                searchParams.toString() ? `?${searchParams.toString()}` : ""
                              }`}
                              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(interaction)}
                              disabled={deletingId === interaction._id}
                              className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {deletingId === interaction._id ? "Deleting..." : "Delete"}
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to={`${listPath}/${interaction._id}/edit`}
                              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                            >
                              Edit
                            </Link>
                            {!isFollowUpDirection(interaction.direction) && (
                              <button
                                type="button"
                                onClick={() => openSurveyModal(interaction)}
                                className={`rounded-full border bg-white px-3 py-1 text-xs font-semibold transition ${
                                  interaction.surveyTriggered
                                    ? "border-sky-200 text-sky-700 hover:bg-sky-50"
                                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                }`}
                              >
                                {interaction.surveyTriggered
                                  ? "Resend trigger"
                                  : "Trigger survey"}
                              </button>
                            )}
                          </>
                        )}
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
              onClick={() => handlePageChange(page - 1)}
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
              onClick={() => handlePageChange(page + 1)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {!isCsrAdmin && (
        <SurveyDispatchModal
          interaction={activeInteraction}
          isOpen={surveyModalOpen}
          onClose={closeSurveyModal}
          onSubmit={handleSurveySubmit}
          saving={sendingSurvey}
        />
      )}
    </PanelLayout>
  );
};

export default CrmInteractionsPage;
