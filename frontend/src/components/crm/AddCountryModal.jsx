import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { createCountry } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const AddCountryModal = ({ isOpen, initialCountryName = "", onClose, onCountryAdded }) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(capitalizeWords(initialCountryName || ""));
      setError("");
    }
  }, [initialCountryName, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSaving(true);
    setError("");

    try {
      const data = await createCountry({ name });
      onCountryAdded?.(data.country, data.message);
      onClose();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to add country.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-950">Add new country</h2>
        <p className="mt-2 text-sm text-slate-600">
          Save a country that is not yet in the directory. It will be available for future tickets.
        </p>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <form
          className="mt-5 grid gap-4"
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.stopPropagation();
            }
          }}
        >
          <div>
            <label htmlFor="add-country-name" className="text-sm font-medium text-slate-700">
              Country name
            </label>
            <input
              id="add-country-name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(capitalizeWords(event.target.value, { trim: false }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save country"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddCountryModal;
