import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { listMyResults } from "../services/api";

const StaffResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await listMyResults();
        setResults(data.results || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <DashboardLayout title="My Assessment Results">
      <p className="mb-6 text-sm leading-6 text-slate-600">
        Each submission is scored out of 10 (1 point per correct answer). Pass
        mark is 7/10.
      </p>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-600">Loading...</p>
        ) : results.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              No assessment results yet
            </p>
            <Link
              to="/courses"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 pr-4 font-medium">Assessment</th>
                <th className="pb-3 pr-4 font-medium">Score</th>
                <th className="pb-3 pr-4 font-medium">Percentage</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={result._id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-slate-950">
                    {result.assessmentTitle}
                  </td>
                  <td className="py-3 pr-4">
                    {result.score}/{result.totalQuestions}
                  </td>
                  <td className="py-3 pr-4">{result.percentage}%</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        result.passed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {result.passed ? "Passed" : "Not passed"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">
                    {new Date(result.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffResultsPage;
