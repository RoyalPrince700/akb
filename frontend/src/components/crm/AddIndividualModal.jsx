import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { nigerianStates } from "../../constants/crm";
import { createIndividual } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";

const emptyForm = {
  individualName: "",
  address: "",
  state: "",
  phoneNumber: "",
};

const AddIndividualModal = ({
  isOpen,
  initialIndividualName = "",
  onClose,
  onIndividualAdded,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...emptyForm,
        individualName: capitalizeWords(initialIndividualName || ""),
      });
      setError("");
    }
  }, [initialIndividualName, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "individualName" || name === "address"
        ? capitalizeWords(value, { trim: false })
        : value;

    setFormData((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSaving(true);
    setError("");

    try {
      const data = await createIndividual(formData);
      onIndividualAdded?.(data.individual, data.message);
      onClose();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to add individual.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-950">Add new individual</h2>
        <p className="mt-2 text-sm text-slate-600">
          Save an individual who is not yet in the directory. They will be available for future
          tickets.
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
            <label htmlFor="add-individual-name" className="text-sm font-medium text-slate-700">
              Individual name
            </label>
            <input
              id="add-individual-name"
              name="individualName"
              required
              value={formData.individualName}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="add-individual-phone" className="text-sm font-medium text-slate-700">
              Phone number (optional)
            </label>
            <input
              id="add-individual-phone"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="add-individual-address" className="text-sm font-medium text-slate-700">
              Address (optional)
            </label>
            <textarea
              id="add-individual-address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="add-individual-state" className="text-sm font-medium text-slate-700">
              State (optional)
            </label>
            <select
              id="add-individual-state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Select state</option>
              {nigerianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
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
              {saving ? "Saving..." : "Save individual"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddIndividualModal;
