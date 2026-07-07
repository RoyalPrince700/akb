import { useCallback, useEffect, useState } from "react";

import { getCsrDisplayName, surveyChannels } from "../../constants/crm";
import SurveyReminderModal from "../../components/crm/SurveyReminderModal";
import PanelLayout from "../../layouts/PanelLayout";
import { listSurveyDispatches, sendSurveyReminder } from "../../services/api";
import { handleSurveyDispatchShare } from "../../utils/crmSurvey";

const CrmSurveysPage = () => {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  const loadDispatches = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listSurveyDispatches({
        limit: 50,
        search: search.trim() || undefined,
        channel: channelFilter || undefined,
        status: statusFilter || undefined,
      });
      setDispatches(data.dispatches || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load survey history.");
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  }, [channelFilter, search, statusFilter]);

  useEffect(() => {
    loadDispatches();
  }, [loadDispatches]);

  const handleCopy = async (dispatch) => {
    await handleSurveyDispatchShare(dispatch);
    window.alert("Survey link prepared for sending.");
  };

  const openReminderModal = (dispatch) => {
    setActiveReminder({
      dispatchId: dispatch._id,
      customerName: dispatch.customerName || "",
      schoolName: dispatch.interaction?.customer?.schoolName || "",
      defaultPhoneNumber:
        dispatch.customerPhoneNumber ||
        dispatch.interaction?.customer?.phoneNumber ||
        "",
    });
    setReminderModalOpen(true);
  };

  const closeReminderModal = () => {
    setReminderModalOpen(false);
    setActiveReminder(null);
  };

  const handleReminderSubmit = async ({ dispatchId, customerPhoneNumber }) => {
    setSendingReminder(true);
    setError("");

    try {
      await sendSurveyReminder(dispatchId, { customerPhoneNumber });
      window.alert("Survey reminder SMS sent successfully.");
      closeReminderModal();
      loadDispatches();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to send survey reminder.");
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <PanelLayout title="Survey Send History">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Customer surveys</h2>
          <p className="mt-1 text-sm text-slate-600">
            View manual survey sends, track responses, and track which CSR staff owned or triggered each survey.
          </p>
        </div>

        <form
          className="mt-5 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            loadDispatches();
          }}
        >
          <input
            type="search"
            placeholder="Search school, phone, email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All channels</option>
            {surveyChannels.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="responded">Responded</option>
            <option value="pending">Pending</option>
          </select>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading surveys...</p>
          ) : dispatches.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No surveys have been sent yet.
            </p>
          ) : (
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Ticket owner</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Channel</th>
                  <th className="pb-3 pr-4 font-medium">Triggered by</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Sent at</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {dispatches.map((dispatch) => (
                  <tr key={dispatch._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {dispatch.customerName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {getCsrDisplayName(dispatch.interaction?.owner)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {dispatch.customerPhoneNumber}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{dispatch.customerEmail || "-"}</td>
                    <td className="py-3 pr-4 text-slate-700">{dispatch.channel}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {getCsrDisplayName(dispatch.sentBy, "Unknown")}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            dispatch.status === "responded"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {dispatch.status}
                        </span>
                        {dispatch.reminderSentAt && dispatch.status !== "responded" && (
                          <span className="inline-flex w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Reminder sent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {new Date(dispatch.sentAt).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {dispatch.status !== "responded" && !dispatch.reminderSentAt && (
                          <button
                            type="button"
                            onClick={() => openReminderModal(dispatch)}
                            className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                          >
                            Send reminder
                          </button>
                        )}
                        {dispatch.reminderSentAt && dispatch.status !== "responded" && (
                          <span
                            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                            title={`Reminder sent on ${new Date(dispatch.reminderSentAt).toLocaleString()}`}
                          >
                            Reminder sent
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(dispatch)}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Send again
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SurveyReminderModal
        isOpen={reminderModalOpen}
        onClose={closeReminderModal}
        onSubmit={handleReminderSubmit}
        saving={sendingReminder}
        dispatchId={activeReminder?.dispatchId}
        customerName={activeReminder?.customerName}
        schoolName={activeReminder?.schoolName}
        defaultPhoneNumber={activeReminder?.defaultPhoneNumber}
      />
    </PanelLayout>
  );
};

export default CrmSurveysPage;
