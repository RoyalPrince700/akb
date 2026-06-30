import { useEffect, useState } from "react";

import PanelLayout from "../../layouts/PanelLayout";
import { getCrmReports } from "../../services/api";

const MetricCard = ({ label, value, helper }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">{value}</h2>
    <p className="mt-2 text-sm text-slate-500">{helper}</p>
  </div>
);

const ReportTable = ({ title, rows }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
    <h2 className="text-xl font-bold text-slate-950">{title}</h2>
    <div className="mt-5 overflow-x-auto">
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-slate-600">No data available.</p>
      ) : (
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 pr-4 font-medium">Label</th>
              <th className="pb-3 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row._id || row.name}-${index}`} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pr-4 font-medium text-slate-950">
                  {row.name || row._id || "Unknown"}
                </td>
                <td className="py-3 text-slate-700">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const CrmReportsPage = () => {
  const [reports, setReports] = useState({
    byDirection: [],
    byCategory: [],
    byState: [],
    byOwner: [],
    bySalesRep: [],
    surveyBySender: [],
    surveyByTicketOwner: [],
    surveySent: 0,
    surveyResponded: 0,
    surveyResponseRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getCrmReports();
        setReports(data.reports || {});
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load CRM reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  return (
    <PanelLayout title="CRM Reports">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 shadow-lg shadow-emerald-900/5">
          Loading CRM reports...
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <MetricCard
              label="Surveys triggered"
              value={reports.surveySent ?? 0}
              helper="Manual survey links generated after tickets"
            />
            <MetricCard
              label="Surveys responded"
              value={reports.surveyResponded ?? 0}
              helper="Customers who submitted the survey form"
            />
            <MetricCard
              label="Response rate"
              value={`${reports.surveyResponseRate ?? 0}%`}
              helper="Based on sent versus responded surveys"
            />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <ReportTable title="Tickets by direction" rows={reports.byDirection || []} />
            <ReportTable title="Tickets by category" rows={reports.byCategory || []} />
            <ReportTable title="Tickets by state" rows={reports.byState || []} />
            <ReportTable title="Tickets by CSR" rows={reports.byOwner || []} />
            <ReportTable title="Tickets by sales rep" rows={reports.bySalesRep || []} />
            <ReportTable title="Surveys triggered by CSR" rows={reports.surveyBySender || []} />
            <ReportTable title="Surveys by ticket owner" rows={reports.surveyByTicketOwner || []} />
          </div>
        </>
      )}
    </PanelLayout>
  );
};

export default CrmReportsPage;
