import { useCallback, useEffect, useState } from "react";

import SalesRepFormModal from "../../components/crm/SalesRepFormModal";
import { nigerianStates } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { capitalizeWords } from "../../utils/textFormat";
import {
  createSalesRep,
  deleteSalesRep,
  importSalesReps,
  listSalesReps,
  updateSalesRep,
} from "../../services/api";

const parseCsvFile = (text) => {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length <= 1) {
    return [];
  }

  return rows.slice(1).map((row) => {
    const [name, state, location, phoneNumber = "", email = ""] = row.split(",");
    return {
      name: (name || "").trim(),
      state: (state || "").trim(),
      location: (location || "").trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
    };
  });
};

const CrmSalesRepPage = () => {
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadSalesReps = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listSalesReps({
        limit: 100,
        search: search.trim() || undefined,
        state: stateFilter || undefined,
      });
      setSalesReps(data.salesReps || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load sales reps.");
      setSalesReps([]);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter]);

  useEffect(() => {
    loadSalesReps();
  }, [loadSalesReps]);

  const openCreateModal = () => {
    setEditingSalesRep(null);
    setModalOpen(true);
  };

  const openEditModal = (salesRep) => {
    setEditingSalesRep(salesRep);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingSalesRep(null);
    setModalOpen(false);
  };

  const handleFormSubmit = async (formData, isEdit) => {
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        await updateSalesRep(editingSalesRep._id, formData);
      } else {
        await createSalesRep(formData);
      }
      closeModal();
      loadSalesReps();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to save sales rep.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (salesRep) => {
    if (!window.confirm(`Delete ${salesRep.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteSalesRep(salesRep._id);
      loadSalesReps();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to delete sales rep.");
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImporting(true);
    setError("");

    try {
      const text = await file.text();
      const parsedRows = parseCsvFile(text).filter(
        (row) => row.name && row.state && row.location
      );

      if (!parsedRows.length) {
        throw new Error("No valid sales reps were found in the selected CSV file.");
      }

      await importSalesReps(parsedRows);
      loadSalesReps();
      window.alert("Sales reps imported successfully.");
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || "Failed to import sales reps.");
    } finally {
      event.target.value = "";
      setImporting(false);
    }
  };

  return (
    <PanelLayout title="Sales Rep Directory">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Active sales reps</h2>
            <p className="mt-1 text-sm text-slate-600">
              Maintain the list used by CSR staff when assigning call records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
              {importing ? "Importing..." : "Import CSV"}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportFile}
                className="hidden"
                disabled={importing}
              />
            </label>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Add sales rep
            </button>
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          CSV format: <code>name,state,location,phoneNumber,email</code>
        </p>

        <form
          className="mt-5 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            loadSalesReps();
          }}
        >
          <input
            type="search"
            placeholder="Search name, state, location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All states</option>
            {nigerianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Apply filters
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading sales reps...</p>
          ) : salesReps.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No sales reps found.
            </p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">State</th>
                  <th className="pb-3 pr-4 font-medium">Location</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesReps.map((salesRep) => (
                  <tr key={salesRep._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {capitalizeWords(salesRep.name)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{salesRep.state}</td>
                    <td className="py-3 pr-4 text-slate-700">{salesRep.location}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {salesRep.phoneNumber || "-"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{salesRep.email || "-"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          salesRep.isActive !== false
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {salesRep.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(salesRep)}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(salesRep)}
                          className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SalesRepFormModal
        isOpen={modalOpen}
        salesRep={editingSalesRep}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        saving={saving}
      />
    </PanelLayout>
  );
};

export default CrmSalesRepPage;
