import { useEffect, useState } from "react";

const SurveyReminderModal = ({
  isOpen,
  onClose,
  onSubmit,
  saving = false,
  customerName = "",
  schoolName = "",
  defaultPhoneNumber = "",
  dispatchId = null,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(defaultPhoneNumber || "");
    }
  }, [defaultPhoneNumber, isOpen]);

  if (!isOpen || !dispatchId) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      dispatchId,
      customerPhoneNumber: phoneNumber.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-950">Send survey reminder</h2>
        <p className="mt-2 text-sm text-slate-600">
          Send an SMS reminder with the existing survey link. Confirm the customer&apos;s
          phone number or enter a different one below.
        </p>

        {(customerName || schoolName) && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {customerName && <p className="font-medium text-slate-950">{customerName}</p>}
            {schoolName && <p className="mt-0.5 text-slate-600">Ticket: {schoolName}</p>}
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="customerPhoneNumber" className="text-sm font-medium text-slate-700">
              Customer SMS number
            </label>
            <input
              id="customerPhoneNumber"
              name="customerPhoneNumber"
              type="tel"
              required
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="2348012345678"
            />
            <p className="mt-1 text-xs text-slate-500">
              {defaultPhoneNumber
                ? "The number from the original survey send is shown above. Edit it if needed."
                : "No phone number was saved with this survey. Enter the customer's reachable number."}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This sends a reminder SMS only. It does not create a new survey link.
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              className="rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              {saving ? "Sending..." : "Send reminder SMS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyReminderModal;
