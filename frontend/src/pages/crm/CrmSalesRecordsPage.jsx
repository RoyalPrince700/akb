import { useCallback, useEffect, useState } from "react";

import { bookSaleClassOptions, formatBookSaleClass, formatOrganizationType, getOrganizationNameLabel, organizationTypes } from "../../constants/crm";
import { useAuth } from "../../context/AuthContext";
import PanelLayout from "../../layouts/PanelLayout";
import {
  createCrmSalesRecord,
  listCrmSalesRecords,
} from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const createEmptyBookItem = () => ({
  title: "",
  bookClass: "",
  quantity: "1",
  price: "",
  discountPercent: "",
});

const createEmptyForm = () => ({
  organizationType: "school",
  schoolName: "",
  location: "",
  bookItems: [createEmptyBookItem()],
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const parseMoney = (value) => Number(value) || 0;

const clampPercent = (value) => Math.min(100, Math.max(0, parseMoney(value)));

const parseQuantity = (value) => Math.max(0, Number(value) || 0);

const getBookItemTotals = (item) => {
  const quantity = parseQuantity(item.quantity);
  const price = parseMoney(item.price);
  const discountPercent = clampPercent(item.discountPercent);
  const subtotalPrice = quantity * price;
  const discountAmount = (subtotalPrice * discountPercent) / 100;

  return {
    discountAmount,
    discountPercent,
    quantity,
    subtotalPrice,
    totalPrice: Math.max(0, subtotalPrice - discountAmount),
  };
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
  const [formData, setFormData] = useState(createEmptyForm);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalQuantitySold: 0,
    totalSalesValue: 0,
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
          totalSalesValue: 0,
        }
      );
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load sales records.");
      setRecords([]);
      setSummary({
        totalRecords: 0,
        totalQuantitySold: 0,
        totalSalesValue: 0,
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

  const handleBookItemChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      bookItems: current.bookItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addBookItem = () => {
    setFormData((current) => ({
      ...current,
      bookItems: [...current.bookItems, createEmptyBookItem()],
    }));
  };

  const removeBookItem = (index) => {
    setFormData((current) => ({
      ...current,
      bookItems:
        current.bookItems.length === 1
          ? [createEmptyBookItem()]
          : current.bookItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const subtotalPrice = formData.bookItems.reduce(
    (total, item) => total + getBookItemTotals(item).subtotalPrice,
    0
  );
  const discountAmount = formData.bookItems.reduce(
    (total, item) => total + getBookItemTotals(item).discountAmount,
    0
  );
  const totalPrice = Math.max(0, subtotalPrice - discountAmount);
  const totalQuantity = formData.bookItems.reduce(
    (total, item) =>
      item.title.trim() || item.bookClass || String(item.price).trim()
        ? total + getBookItemTotals(item).quantity
        : total,
    0
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const bookItems = formData.bookItems
        .map((item) => ({
          title: item.title.trim(),
          bookClass: item.bookClass,
          quantity: parseQuantity(item.quantity),
          price: parseMoney(item.price),
          discountPercent: clampPercent(item.discountPercent),
          hasPrice: String(item.price).trim() !== "",
        }))
        .filter((item) => item.title || item.bookClass || item.hasPrice);

      if (!bookItems.length) {
        throw new Error("Add at least one book title and price.");
      }

      if (
        bookItems.some(
          (item) =>
            !item.title || !item.bookClass || item.quantity < 1 || !item.hasPrice || item.price < 0
        )
      ) {
        throw new Error("Each book row must include a title, class, quantity, and valid price.");
      }

      await createCrmSalesRecord({
        organizationType: formData.organizationType,
        schoolName: formData.schoolName,
        location: formData.location,
        bookItems,
        bookTitles: bookItems.map((item) => item.title).join(", "),
        quantitySold: totalQuantity,
      });
      setFormData(createEmptyForm());
      setSuccessMessage("Sales record saved successfully.");
      setPage(1);
      loadRecords();
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          apiError.message ||
          "Failed to save sales record."
      );
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

      <div className="space-y-5">
        {!isCsrAdmin && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Log a new sale</h2>
              <p className="mt-1 text-sm text-slate-600">
                Record each school or bookshop sale with the titles sold, quantity, and class group.
              </p>
            </div>

            <form className="mt-6 grid gap-4 lg:grid-cols-3" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer type
                </label>
                <select
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  {organizationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {getOrganizationNameLabel(formData.organizationType)}
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  placeholder={
                    formData.organizationType === "bookshop"
                      ? "Enter bookshop name"
                      : "Enter school name"
                  }
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

              <div className="space-y-3 lg:col-span-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Book titles and prices
                  </label>
                  <span className="text-xs font-medium text-slate-500">
                    Quantity: {totalQuantity}
                  </span>
                </div>

                {formData.bookItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_0.7fr_0.35fr_0.45fr_0.45fr_auto]"
                  >
                    <input
                      type="text"
                      value={item.title}
                      onChange={(event) =>
                        handleBookItemChange(index, "title", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      placeholder={`Book title ${index + 1}`}
                    />
                    <select
                      value={item.bookClass}
                      onChange={(event) =>
                        handleBookItemChange(index, "bookClass", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      aria-label={`Book class ${index + 1}`}
                    >
                      <option value="">Select class</option>
                      {bookSaleClassOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        handleBookItemChange(index, "quantity", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Qty"
                      aria-label={`Quantity ${index + 1}`}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(event) =>
                        handleBookItemChange(index, "price", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Price"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discountPercent}
                      onChange={(event) =>
                        handleBookItemChange(index, "discountPercent", event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Disc %"
                      aria-label={`Discount percent ${index + 1}`}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addBookItem}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-700 text-lg font-semibold text-white transition hover:bg-emerald-800"
                        aria-label="Add another book"
                      >
                        +
                      </button>
                      {formData.bookItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBookItem(index)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600"
                          aria-label="Remove book"
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 lg:col-span-2">
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotalPrice)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-bold text-emerald-800">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center self-end justify-self-start rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save sales record"}
              </button>
            </form>
          </div>
        )}

        <div>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
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
            <SummaryCard
              label="Sales value"
              value={formatCurrency(summary.totalSalesValue)}
              helper="Discounted total across the filtered records"
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
                placeholder="Search school, bookshop, location, or title..."
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
                <table className="w-full min-w-[1280px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Location</th>
                      <th className="pb-3 pr-4 font-medium">Titles, class, quantity, and price</th>
                      <th className="pb-3 pr-4 font-medium">Quantity</th>
                      <th className="pb-3 pr-4 font-medium">Subtotal</th>
                      <th className="pb-3 pr-4 font-medium">Discount</th>
                      <th className="pb-3 pr-4 font-medium">Total</th>
                      {isCsrAdmin && <th className="pb-3 pr-4 font-medium">Logged by</th>}
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record._id} className="border-b border-slate-100 last:border-0">
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
                                  <span className="text-xs text-slate-500 sm:col-start-2 sm:col-span-3">
                                    Unit {formatCurrency(item.price)}
                                    {item.discountPercent
                                      ? `, discount ${item.discountPercent}% (${formatCurrency(
                                          item.discountAmount
                                        )})`
                                      : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              <span title={record.bookTitles} className="line-clamp-2">
                                {record.bookTitles}
                              </span>
                              {record.bookClass && (
                                <span className="mt-1 block text-xs font-semibold text-slate-500">
                                  {formatBookSaleClass(record.bookClass)}
                                </span>
                              )}
                            </div>
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
