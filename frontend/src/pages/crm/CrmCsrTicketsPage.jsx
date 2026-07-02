import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { getCsrDisplayName } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { getCrmReports, listStaff } from "../../services/api";

const CrmCsrTicketsPage = () => {
  const [csrs, setCsrs] = useState([]);
  const [csrSearch, setCsrSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCsrs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [staffData, reportsData] = await Promise.all([
        listStaff({ role: "csr", limit: 100 }),
        getCrmReports({ period: "all" }),
      ]);

      const performanceById = new Map(
        (reportsData.reports?.csrPerformance || []).map((row) => [row._id, row])
      );

      const merged = (staffData.staff || []).map((csr) => {
        const metrics = performanceById.get(csr._id) || {};

        return {
          _id: csr._id,
          name: getCsrDisplayName(csr),
          staffId: csr.staffId || metrics.staffId || "",
          isActive: csr.isActive,
          totalTickets: metrics.totalTickets ?? 0,
          resolved: metrics.resolved ?? 0,
          unresolved: metrics.unresolved ?? 0,
          resolutionRate: metrics.resolutionRate ?? 0,
        };
      });

      setCsrs(merged.sort((a, b) => b.totalTickets - a.totalTickets));
    } catch (apiError) {
      setCsrs([]);
      setError(apiError.response?.data?.message || "Failed to load CSR ticket summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCsrs();
  }, [loadCsrs]);

  const filteredCsrs = useMemo(() => {
    const term = csrSearch.trim().toLowerCase();

    if (!term) {
      return csrs;
    }

    return csrs.filter(
      (csr) =>
        csr.name?.toLowerCase().includes(term) ||
        csr.staffId?.toLowerCase().includes(term)
    );
  }, [csrSearch, csrs]);

  return (
    <PanelLayout title="CSR Tickets">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">CSRs and their tickets</h2>
            <p className="mt-2 text-sm text-slate-600">
              Review each CSR&apos;s ticket volume and open their full ticket list in read-only
              mode.
            </p>
          </div>

          <label className="block w-full lg:max-w-sm">
            <span className="text-sm font-medium text-slate-700">Search CSR</span>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={csrSearch}
                onChange={(event) => setCsrSearch(event.target.value)}
                placeholder="Search by name or staff ID"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading CSR ticket summary...</p>
          ) : filteredCsrs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">No CSRs found.</p>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">CSR</th>
                  <th className="pb-3 pr-4 font-medium">Staff ID</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Tickets</th>
                  <th className="pb-3 pr-4 font-medium">Resolved</th>
                  <th className="pb-3 pr-4 font-medium">Unresolved</th>
                  <th className="pb-3 pr-4 font-medium">Resolution %</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCsrs.map((csr) => (
                  <tr key={csr._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">{csr.name}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.staffId || "—"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          csr.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {csr.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{csr.totalTickets}</td>
                    <td className="py-3 pr-4 text-emerald-700">{csr.resolved}</td>
                    <td className="py-3 pr-4 text-amber-700">{csr.unresolved}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.resolutionRate}%</td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/csr/interactions?owner=${csr._id}`}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        View tickets
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PanelLayout>
  );
};

export default CrmCsrTicketsPage;
