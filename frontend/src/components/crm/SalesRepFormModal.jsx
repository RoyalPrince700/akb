import { useEffect, useState } from "react";

import { nigerianStates } from "../../constants/crm";
import { capitalizeWords } from "../../utils/textFormat";

const emptyForm = {
  name: "",
  state: nigerianStates[0],
  location: "",
  phoneNumber: "",
  email: "",
  isActive: true,
};

const SalesRepFormModal = ({
  isOpen,
  salesRep,
  onClose,
  onSubmit,
  saving = false,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const isEdit = Boolean(salesRep);

  useEffect(() => {
    if (salesRep) {
      setFormData({
        name: capitalizeWords(salesRep.name || ""),
        state: salesRep.state || nigerianStates[0],
        location: salesRep.location || "",
        phoneNumber: salesRep.phoneNumber || "",
        email: salesRep.email || "",
        isActive: salesRep.isActive !== false,
      });
    } else if (isOpen) {
      setFormData(emptyForm);
    }
  }, [isOpen, salesRep]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    let nextValue = type === "checkbox" ? checked : value;

    if (name === "name") {
      nextValue = capitalizeWords(value);
    }

    setFormData((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData, isEdit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-950">
          {isEdit ? "Edit sales rep" : "Add sales rep"}
        </h2>

        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="state" className="text-sm font-medium text-slate-700">
              State
            </label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              {nigerianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="text-sm font-medium text-slate-700"
            >
              Phone number
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
            />
            Active sales rep
          </label>

          <div className="flex justify-end gap-3 pt-2 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create sales rep"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesRepFormModal;
