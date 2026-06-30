import { useCallback, useEffect, useState } from "react";

import PanelLayout from "../../layouts/PanelLayout";
import {
  getCrmCustomerHistory,
  listCrmCustomers,
  updateCrmInteraction,
} from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const CrmCustomerHistoryPage = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listCrmCustomers({
        limit: 25,
        search: search.trim() || undefined,
      });
      setCustomers(data.customers || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load customer history.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const loadHistory = async (phoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setHistoryLoading(true);

    try {
      const data = await getCrmCustomerHistory(phoneNumber);
      setHistory(data.interactions || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load customer history.");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleMarkResolved = async (interaction) => {
    setUpdatingId(interaction._id);
    setError("");

    try {
      await updateCrmInteraction(interaction._id, { status: "resolved" });
      if (selectedPhoneNumber) {
        const data = await getCrmCustomerHistory(selectedPhoneNumber);
        setHistory(data.interactions || []);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to update ticket status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PanelLayout title="Customer History">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Customer directory</h2>
              <p className="mt-1 text-sm text-slate-600">
                Search by school name, phone number, or address.
              </p>
            </div>
          </div>

          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              loadCustomers();
            }}
          >
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer history..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Search
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-600">Loading customers...</p>
            ) : customers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">
                No customers found yet.
              </p>
            ) : (
              customers.map((customer) => (
                <button
                  key={customer._id}
                  type="button"
                  onClick={() => loadHistory(customer.phoneNumber)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selectedPhoneNumber === customer.phoneNumber
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{customer.schoolName}</p>
                      <p className="mt-1 text-sm text-slate-600">{customer.phoneNumber}</p>
                      <p className="mt-1 text-sm text-slate-500">{customer.address}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {customer.totalInteractions} call
                      {customer.totalInteractions === 1 ? "" : "s"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
          <h2 className="text-xl font-bold text-slate-950">Interaction history</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a customer to review previous inbound and outbound calls.
          </p>

          <div className="mt-6">
            {!selectedPhoneNumber ? (
              <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                Choose a customer from the left to load their interaction timeline.
              </p>
            ) : historyLoading ? (
              <p className="py-10 text-center text-sm text-slate-600">Loading timeline...</p>
            ) : history.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-600">
                No call history available for this customer.
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((interaction) => (
                  <div
                    key={interaction._id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>{interaction.direction}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-700">
                        {interaction.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 ${
                          interaction.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {interaction.status}
                      </span>
                      {interaction.status === "unresolved" && (
                        <button
                          type="button"
                          onClick={() => handleMarkResolved(interaction)}
                          disabled={updatingId === interaction._id}
                          className="ml-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {updatingId === interaction._id ? "Updating..." : "Mark resolved"}
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-slate-700">
                      <strong>Contact date:</strong>{" "}
                      {new Date(interaction.dateOfContact).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      <strong>CSR:</strong> {interaction.owner?.name || "Unknown"}
                    </p>
                    {interaction.salesRep?.name && (
                      <p className="mt-2 text-sm text-slate-700">
                        <strong>Sales rep:</strong> {capitalizeWords(interaction.salesRep.name)}
                      </p>
                    )}
                    {interaction.complaintNature && (
                      <p className="mt-2 text-sm text-slate-700">
                        <strong>Complaint:</strong> {interaction.complaintNature}
                      </p>
                    )}
                    {interaction.requestQuantity ? (
                      <p className="mt-2 text-sm text-slate-700">
                        <strong>Quantity requested:</strong> {interaction.requestQuantity}
                      </p>
                    ) : null}
                    {interaction.bookTitles && (
                      <p className="mt-2 text-sm text-slate-700">
                        <strong>Book titles:</strong> {interaction.bookTitles}
                      </p>
                    )}
                    {interaction.remark && (
                      <p className="mt-2 text-sm text-slate-700">
                        <strong>Remark:</strong> {interaction.remark}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
};

export default CrmCustomerHistoryPage;
