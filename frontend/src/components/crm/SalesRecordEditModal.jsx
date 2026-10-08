import { useMemo, useState } from "react";

import {
  bookSaleClassOptions,
  getOrganizationNameLabel,
  getOrganizationNamePlaceholder,
  organizationTypes,
} from "../../constants/crm";
import { updateCrmSalesRecord } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";
import SchoolSearchSelect from "./SchoolSearchSelect";

const createEmptyBookItem = () => ({
  title: "",
  bookClass: "",
  quantity: "1",
  price: "",
  discountPercent: "",
});

const parseMoney = (value) => Number(value) || 0;

const clampPercent = (value) => Math.min(100, Math.max(0, parseMoney(value)));

const parseQuantity = (value) => Math.max(0, Number(value) || 0);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const toDateTimeLocalValue = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const recordToForm = (record) => {
  const bookItems = record.bookItems?.length
    ? record.bookItems.map((item) => ({
        title: item.title || "",
        bookClass: item.bookClass || record.bookClass || "",
        quantity: String(item.quantity || 1),
        price: item.price === 0 || item.price ? String(item.price) : "",
        discountPercent: item.discountPercent ? String(item.discountPercent) : "",
      }))
    : [
        {
          ...createEmptyBookItem(),
          title: record.bookTitles || "",
          bookClass: record.bookClass || "",
          quantity: String(record.quantitySold || 1),
          price:
            record.quantitySold && record.subtotalPrice
              ? String(Number((record.subtotalPrice / record.quantitySold).toFixed(2)))
              : "",
          discountPercent: record.discountPercent ? String(record.discountPercent) : "",
        },
      ];

  return {
    organizationType: record.organizationType || "school",
    schoolName: record.schoolName || "",
    location: record.location || "",
    saleDate: toDateTimeLocalValue(record.saleDate || record.createdAt),
    bookItems,
  };
};

const getBookItemTotals = (item) => {
  const quantity = parseQuantity(item.quantity);
  const price = parseMoney(item.price);
  const discountPercent = clampPercent(item.discountPercent);
  const subtotalPrice = quantity * price;
  const discountAmount = (subtotalPrice * discountPercent) / 100;

  return {
    quantity,
    subtotalPrice,
    discountAmount,
    totalPrice: Math.max(0, subtotalPrice - discountAmount),
  };
};

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

const SalesRecordEditModal = ({ record, onClose, onSaved }) => {
  const [formData, setFormData] = useState(() => recordToForm(record));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    return formData.bookItems.reduce(
      (summary, item) => {
        const itemTotals = getBookItemTotals(item);
        const counts =
          item.title.trim() || item.bookClass || String(item.price).trim();

        return {
          quantity: summary.quantity + (counts ? itemTotals.quantity : 0),
          subtotalPrice: summary.subtotalPrice + itemTotals.subtotalPrice,
          discountAmount: summary.discountAmount + itemTotals.discountAmount,
          totalPrice: summary.totalPrice + itemTotals.totalPrice,
        };
      },
      { quantity: 0, subtotalPrice: 0, discountAmount: 0, totalPrice: 0 }
    );
  }, [formData.bookItems]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const bookItems = formData.bookItems
      .map((item) => ({
        title: item.title.trim(),
        bookClass: item.bookClass.trim(),
        quantity: parseQuantity(item.quantity),
        price: parseMoney(item.price),
        discountPercent: clampPercent(item.discountPercent),
        hasPrice: String(item.price).trim() !== "",
      }))
      .filter((item) => item.title || item.bookClass || item.hasPrice);

    if (!formData.schoolName.trim() || !formData.location.trim()) {
      setError("Name and location are required.");
      return;
    }

    if (!bookItems.length) {
      setError("Add at least one book title and price.");
      return;
    }

    if (
      bookItems.some(
        (item) => !item.title || item.quantity < 1 || !item.hasPrice || item.price < 0
      )
    ) {
      setError("Each book row must include a title, quantity, and valid price.");
      return;
    }

    const nextSaleDate = new Date(formData.saleDate);

    if (!formData.saleDate || Number.isNaN(nextSaleDate.getTime())) {
      setError("Choose a valid sale date and time.");
      return;
    }

    setSaving(true);

    try {
      const data = await updateCrmSalesRecord(record._id, {
        organizationType: formData.organizationType,
        schoolName: formData.schoolName,
        location: formData.location,
        bookItems,
        saleDate: nextSaleDate.toISOString(),
      });

      onSaved(
        data.unchanged
          ? "No changes to save."
          : "Sales record updated. The changes are recorded in Logs."
      );
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || "Failed to update the sales record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-slate-950">Edit sales record</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update the customer, books, amounts, and sale date. The original CSR who logged it stays
          the same.
        </p>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Customer type</span>
            <select
              value={formData.organizationType}
              onChange={(event) =>
                setFormData((current) => ({ ...current, organizationType: event.target.value }))
              }
              className={inputClassName}
            >
              {organizationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Sale date and time</span>
            <input
              type="datetime-local"
              step="1"
              value={formData.saleDate}
              onChange={(event) =>
                setFormData((current) => ({ ...current, saleDate: event.target.value }))
              }
              className={inputClassName}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              {getOrganizationNameLabel(formData.organizationType)}
            </span>
            {formData.organizationType === "school" ? (
              <SchoolSearchSelect
                name="schoolName"
                value={formData.schoolName}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    schoolName: capitalizeWords(value, { trim: false }),
                  }))
                }
                onSchoolSelect={(school) =>
                  setFormData((current) => ({
                    ...current,
                    schoolName: school.schoolName || current.schoolName,
                    location: school.location || current.location,
                  }))
                }
                placeholder="Search uploaded school name..."
                required
                inputClassName="w-full rounded-xl border border-slate-300 px-4 py-3 pl-10 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            ) : (
              <input
                type="text"
                value={formData.schoolName}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, schoolName: event.target.value }))
                }
                className={inputClassName}
                placeholder={getOrganizationNamePlaceholder(formData.organizationType)}
                required
              />
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Location</span>
            <input
              type="text"
              value={formData.location}
              onChange={(event) =>
                setFormData((current) => ({ ...current, location: event.target.value }))
              }
              className={inputClassName}
              placeholder="Town, state, or area"
              required
            />
          </label>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Books, quantity, and price</p>
            <span className="text-xs font-medium text-slate-500">Quantity: {totals.quantity}</span>
          </div>

          {formData.bookItems.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_0.7fr_0.4fr_0.5fr_0.45fr_auto]"
            >
              <input
                type="text"
                value={item.title}
                onChange={(event) => handleBookItemChange(index, "title", event.target.value)}
                className={inputClassName}
                placeholder={`Book title ${index + 1}`}
              />
              <select
                value={item.bookClass}
                onChange={(event) => handleBookItemChange(index, "bookClass", event.target.value)}
                className={inputClassName}
                aria-label={`Book class ${index + 1}`}
              >
                <option value="">Select class (optional)</option>
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
                onChange={(event) => handleBookItemChange(index, "quantity", event.target.value)}
                className={inputClassName}
                placeholder="Qty"
                aria-label={`Quantity ${index + 1}`}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(event) => handleBookItemChange(index, "price", event.target.value)}
                className={inputClassName}
                placeholder="Price"
                aria-label={`Price ${index + 1}`}
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
                className={inputClassName}
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

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-700">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(totals.subtotalPrice)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span>Discount</span>
            <span className="font-semibold">-{formatCurrency(totals.discountAmount)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-4 border-t border-emerald-100 pt-3 text-base font-bold text-emerald-800">
            <span>Total</span>
            <span>{formatCurrency(totals.totalPrice)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save record"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesRecordEditModal;
