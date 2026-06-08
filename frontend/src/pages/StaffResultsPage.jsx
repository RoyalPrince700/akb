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
      <p className="mb-4 text-sm text-slate-600">
        Each submission is scored out of 10 (1 point per correct answer). Pass
        mark is 7/10.
      </p>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-600">Loading...</p>
        ) : results.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              No assessment results yet
            </p>
            <Link
              to="/courses"
              className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Browse courses and take an assessment →
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
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
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
