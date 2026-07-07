import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { crmStatuses, getCsrDisplayName } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { getCrmReports, listStaff } from "../../services/api";

const CrmCsrTicketsPage = () => {
  const [csrs, setCsrs] = useState([]);
  const [csrSearch, setCsrSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
          pending: metrics.pending ?? 0,
          resolutionRate: metrics.resolutionRate ?? 0,
          inbound: metrics.inbound ?? 0,
          outbound: metrics.outbound ?? 0,
          whatsapp: metrics.whatsapp ?? 0,
          sms: metrics.sms ?? 0,
          inboundFollowUp: metrics.inboundFollowUp ?? 0,
          outboundFollowUp: metrics.outboundFollowUp ?? 0,
          hoax: metrics.hoax ?? 0,
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

    return csrs.filter((csr) => {
      const matchesSearch =
        !term ||
        csr.name?.toLowerCase().includes(term) ||
        csr.staffId?.toLowerCase().includes(term);

      const matchesStatus =
        !statusFilter || (csr[statusFilter] ?? 0) > 0;

      return matchesSearch && matchesStatus;
    });
  }, [csrSearch, csrs, statusFilter]);

  const buildTicketsLink = (csrId, { status = "", direction = "" } = {}) => {
    const params = new URLSearchParams({ owner: csrId });
    if (status) {
      params.set("status", status);
    }
    if (direction) {
      params.set("direction", direction);
    }
    return `/csr/interactions?${params.toString()}`;
  };

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

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
            <label className="block flex-1">
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

            <label className="block sm:w-48">
              <span className="text-sm font-medium text-slate-700">Ticket status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All statuses</option>
                {crmStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading CSR ticket summary...</p>
          ) : filteredCsrs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">No CSRs found.</p>
          ) : (
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">CSR</th>
                  <th className="pb-3 pr-4 font-medium">Staff ID</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Tickets</th>
                  <th className="pb-3 pr-4 font-medium">Resolved</th>
                  <th className="pb-3 pr-4 font-medium">Unresolved</th>
                  <th className="pb-3 pr-4 font-medium">Pending</th>
                  <th className="pb-3 pr-4 font-medium">Resolution %</th>
                  <th className="pb-3 pr-4 font-medium">Inbound</th>
                  <th className="pb-3 pr-4 font-medium">Outbound</th>
                  <th className="pb-3 pr-4 font-medium">WhatsApp</th>
                  <th className="pb-3 pr-4 font-medium">SMS</th>
                  <th className="pb-3 pr-4 font-medium">Inbound F/U</th>
                  <th className="pb-3 pr-4 font-medium">Outbound F/U</th>
                  <th className="pb-3 pr-4 font-medium">Hoax</th>
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
                    <td className="py-3 pr-4 text-sky-700">{csr.pending}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.resolutionRate}%</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.inbound}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.outbound}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.whatsapp}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.sms}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.inboundFollowUp}</td>
                    <td className="py-3 pr-4 text-slate-700">{csr.outboundFollowUp}</td>
                    <td className="py-3 pr-4 text-amber-700">{csr.hoax}</td>
                    <td className="py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {csr.pending > 0 && (
                          <Link
                            to={buildTicketsLink(csr._id, { status: "pending" })}
                            className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                          >
                            Pending
                          </Link>
                        )}
                        <Link
                          to={buildTicketsLink(csr._id, { status: "unresolved" })}
                          className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          Unresolved
                        </Link>
                        <Link
                          to={buildTicketsLink(csr._id, { direction: "hoax" })}
                          className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          Hoax calls
                        </Link>
                        <Link
                          to={buildTicketsLink(csr._id, { status: statusFilter })}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          View tickets
                        </Link>
                      </div>
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
