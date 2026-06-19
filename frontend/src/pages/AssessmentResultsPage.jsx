import { useEffect, useState } from "react";

import PanelLayout from "../layouts/PanelLayout";
import { listAllResults } from "../services/api";

const AssessmentResultsPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await listAllResults();
        setResults(data.results || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load assessment results."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <PanelLayout title="Assessment Results">
      <p className="mb-6 text-sm leading-6 text-slate-600">
        All staff assessment submissions. Each test has 10 questions scored at 1
        point per correct answer (pass mark: 7/10).
      </p>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-600">
            Loading results...
          </p>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">
            No assessment results yet. Results appear when staff submit course
            assessments.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Staff</th>
                  <th className="pb-3 pr-4 font-medium">Staff ID</th>
                  <th className="pb-3 pr-4 font-medium">Assessment</th>
                  <th className="pb-3 pr-4 font-medium">Score</th>
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
                      {result.staffName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{result.staffId}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {result.assessmentTitle}
                    </td>
                    <td className="py-3 pr-4">
                      {result.score}/{result.totalQuestions} ({result.percentage}
                      %)
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          result.passed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
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
          </div>
        )}
      </div>
    </PanelLayout>
  );
};

export default AssessmentResultsPage;
