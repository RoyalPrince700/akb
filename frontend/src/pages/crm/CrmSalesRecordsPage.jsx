import { useCallback, useEffect, useState } from "react";

import { bookSaleClassOptions, formatBookSaleClass } from "../../constants/crm";
import { useAuth } from "../../context/AuthContext";
import PanelLayout from "../../layouts/PanelLayout";
import {
  createCrmSalesRecord,
  listCrmSalesRecords,
} from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const emptyForm = {
  schoolName: "",
  location: "",
  bookTitles: "",
  quantitySold: "",
  bookClass: "",
};

const SummaryCard = ({ label, value, helper }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-emerald-900/5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</h2>
    <p className="mt-2 text-sm text-slate-500">{helper}</p>
  </div>
);

const CrmSalesRecordsPage = () => {
  const { user } = useAuth();
  const isCsrAdmin = user?.role === "csrAdmin";
  const [formData, setFormData] = useState(emptyForm);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalQuantitySold: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [bookClassFilter, setBookClassFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listCrmSalesRecords({
        page,
        limit: 12,
        search: search.trim() || undefined,
        bookClass: bookClassFilter || undefined,
      });

      setRecords(data.records || []);
      setSummary(
        data.summary || {
          totalRecords: 0,
          totalQuantitySold: 0,
        }
      );
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load sales records.");
      setRecords([]);
      setSummary({
        totalRecords: 0,
        totalQuantitySold: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [bookClassFilter, page, search]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await createCrmSalesRecord({
        ...formData,
        quantitySold: Number(formData.quantitySold),
      });
      setFormData(emptyForm);
      setSuccessMessage("Sales record saved successfully.");
      setPage(1);
      loadRecords();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to save sales record.");
    } finally {
      setSaving(false);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    loadRecords();
  };

  return (
    <PanelLayout title="Sales Records">
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

      <div className={`grid gap-5 ${isCsrAdmin ? "" : "xl:grid-cols-[1.05fr_1.4fr]"}`}>
        {!isCsrAdmin && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Log a new sale</h2>
              <p className="mt-1 text-sm text-slate-600">
                Record each school sale with the titles sold, quantity, and class group.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Name of school
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Enter school name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Town, state, or area"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Titles sold
                </label>
                <textarea
                  name="bookTitles"
                  value={formData.bookTitles}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Type all book titles sold"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantity sold
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="quantitySold"
                    value={formData.quantitySold}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Book class
                  </label>
                  <select
                    name="bookClass"
                    value={formData.bookClass}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    required
                  >
                    <option value="">Select class</option>
                    {bookSaleClassOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save sales record"}
              </button>
            </form>
          </div>
        )}

        <div>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <SummaryCard
              label="Sales records"
              value={summary.totalRecords ?? 0}
              helper="Entries currently visible in your dashboard"
            />
            <SummaryCard
              label="Books sold"
              value={summary.totalQuantitySold ?? 0}
              helper="Total quantity across the filtered records"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Recent sales activity</h2>
              <p className="mt-1 text-sm text-slate-600">
                {isCsrAdmin
                  ? "Review all sales logged by the CSR team."
                  : "Review the sales records you have logged."}
              </p>
            </div>

            <form
              className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_0.8fr_auto]"
              onSubmit={handleSearchSubmit}
            >
              <input
                type="search"
                placeholder="Search school, location, or title..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
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
                <p className="py-8 text-center text-sm text-slate-600">
                  Loading sales records...
                </p>
              ) : records.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600">
                  No sales records found yet.
                </p>
              ) : (
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 pr-4 font-medium">School</th>
                      <th className="pb-3 pr-4 font-medium">Location</th>
                      <th className="pb-3 pr-4 font-medium">Titles sold</th>
                      <th className="pb-3 pr-4 font-medium">Class</th>
                      <th className="pb-3 pr-4 font-medium">Quantity</th>
                      {isCsrAdmin && <th className="pb-3 pr-4 font-medium">Logged by</th>}
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record._id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-950">
                          {capitalizeWords(record.schoolName)}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{record.location}</td>
                        <td className="max-w-[320px] py-3 pr-4 text-slate-700">
                          <span title={record.bookTitles} className="line-clamp-2">
                            {record.bookTitles}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {formatBookSaleClass(record.bookClass)}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-emerald-700">
                          {record.quantitySold}
                        </td>
                        {isCsrAdmin && (
                          <td className="py-3 pr-4 text-slate-700">
                            {record.owner?.name || "Unknown"}
                          </td>
                        )}
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
        </div>
      </div>
    </PanelLayout>
  );
};

export default CrmSalesRecordsPage;
