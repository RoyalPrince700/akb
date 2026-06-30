import { useEffect, useState } from "react";

import { surveyChannels } from "../../constants/crm";

const emptyForm = {
  channel: surveyChannels[0].value,
  customerEmail: "",
  customerPhoneNumber: "",
  message: "",
};

const SurveyDispatchModal = ({
  interaction,
  isOpen,
  onClose,
  onSubmit,
  saving = false,
}) => {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...emptyForm,
        customerPhoneNumber: interaction?.customer?.phoneNumber || "",
      });
    }
  }, [isOpen, interaction]);

  if (!isOpen || !interaction) {
    return null;
  }

  const isPhoneChannel = formData.channel === "WhatsApp" || formData.channel === "SMS";
  const isEmailChannel = formData.channel === "Email";
  const isManualChannel = formData.channel === "Manual";

  const recipientLabel =
    formData.channel === "WhatsApp"
      ? "Customer WhatsApp number"
      : formData.channel === "SMS"
        ? "Customer SMS number"
        : "Customer email";

  const recipientPlaceholder =
    formData.channel === "WhatsApp" || formData.channel === "SMS"
      ? "2348012345678"
      : "client@example.com";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      interactionId: interaction._id,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-950">Trigger customer survey</h2>
        <p className="mt-2 text-sm text-slate-600">
          Create a survey link for <strong>{interaction.customer.schoolName}</strong>{" "}
          and record how your team shared it after this ticket.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="channel" className="text-sm font-medium text-slate-700">
              Send channel
            </label>
            <select
              id="channel"
              name="channel"
              value={formData.channel}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              {surveyChannels.map((channel) => (
                <option key={channel.value} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </select>
          </div>

          {!isManualChannel ? (
            <div>
              <label
                htmlFor={isEmailChannel ? "customerEmail" : "customerPhoneNumber"}
                className="text-sm font-medium text-slate-700"
              >
                {recipientLabel}
              </label>
              <input
                id={isEmailChannel ? "customerEmail" : "customerPhoneNumber"}
                name={isEmailChannel ? "customerEmail" : "customerPhoneNumber"}
                type={isEmailChannel ? "email" : "tel"}
                required
                value={
                  isEmailChannel ? formData.customerEmail : formData.customerPhoneNumber
                }
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                placeholder={recipientPlaceholder}
              />
              {isPhoneChannel && (
                <p className="mt-1 text-xs text-slate-500">
                  Use the customer&apos;s reachable number. For WhatsApp, include the
                  country code when possible.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Manual sends create the survey link and copy it to the clipboard so the CSR
              can paste it wherever needed.
            </div>
          )}

          <div>
            <label htmlFor="message" className="text-sm font-medium text-slate-700">
              Message note (optional)
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="Thank you for speaking with us today. Kindly complete this short survey."
            />
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
              className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving
                ? "Triggering..."
                : isEmailChannel
                  ? "Send survey email"
                  : formData.channel === "WhatsApp"
                    ? "Send on WhatsApp"
                    : formData.channel === "SMS"
                      ? "Send SMS link"
                      : "Create and copy link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyDispatchModal;
