import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import PanelLayout from "../../layouts/PanelLayout";
import { updateProfile } from "../../services/api";

const normalizePhoneNumbers = (phoneNumbers) => [
  ...new Set(phoneNumbers.map((phoneNumber) => phoneNumber.trim()).filter(Boolean)),
];

const CrmSettingsPage = () => {
  const { logout, updateUser, user } = useAuth();
  const navigate = useNavigate();
  const initialPhoneNumbers = useMemo(
    () => (Array.isArray(user?.csrPhoneNumbers) ? user.csrPhoneNumbers : []),
    [user?.csrPhoneNumbers]
  );
  const [phoneNumbers, setPhoneNumbers] = useState(
    initialPhoneNumbers.length ? initialPhoneNumbers : [""]
  );
  const [csrDisplayName, setCsrDisplayName] = useState(user?.csrDisplayName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePhoneChange = (index, value) => {
    setPhoneNumbers((current) =>
      current.map((phoneNumber, phoneIndex) => (phoneIndex === index ? value : phoneNumber))
    );
    setSuccess("");
  };

  const addPhoneNumber = () => {
    setPhoneNumbers((current) => [...current, ""]);
    setSuccess("");
  };

  const removePhoneNumber = (index) => {
    setPhoneNumbers((current) => {
      const nextPhoneNumbers = current.filter((_, phoneIndex) => phoneIndex !== index);
      return nextPhoneNumbers.length ? nextPhoneNumbers : [""];
    });
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const csrPhoneNumbers = normalizePhoneNumbers(phoneNumbers);
      const data = await updateProfile({ csrDisplayName, csrPhoneNumbers });
      updateUser(data.user);
      setCsrDisplayName(data.user.csrDisplayName || "");
      setPhoneNumbers(csrPhoneNumbers.length ? csrPhoneNumbers : [""]);
      setSuccess("CSR settings updated successfully.");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to update CSR settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <PanelLayout title="CSR Settings">
      <div className="mx-auto max-w-3xl">
        {error && (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Public CSR details
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              CSR settings
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Choose the CSR name customers see in surveys and add the phone numbers you use for
              customer calls.
            </p>
          </div>

          <div className="mt-6">
            <label htmlFor="csrDisplayName" className="text-sm font-medium text-slate-700">
              Survey and dashboard name
            </label>
            <input
              id="csrDisplayName"
              value={csrDisplayName}
              onChange={(event) => {
                setCsrDisplayName(event.target.value);
                setSuccess("");
              }}
              placeholder={user?.name || "Enter your preferred CSR name"}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This name will appear on customer surveys and CSR dashboard views. Leave it blank to
              use your profile name.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {phoneNumbers.map((phoneNumber, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor={`csrPhoneNumber-${index}`} className="sr-only">
                    CSR phone number {index + 1}
                  </label>
                  <input
                    id={`csrPhoneNumber-${index}`}
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => handlePhoneChange(index, event.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePhoneNumber(index)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addPhoneNumber}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Add another number
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </form>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Account
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Sign out</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              End your CRM session and return to the login page.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Logout
          </button>
        </section>
      </div>
    </PanelLayout>
  );
};

export default CrmSettingsPage;
