import { Link, Navigate, useLocation, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import courses, { getCourseById } from "../courses";

const AssessmentResultPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const course = getCourseById(courses, courseId);
  const result = location.state?.result;

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  if (!result) {
    return <Navigate to={`/courses/${courseId}/assessment`} replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar>
        <Link
          to={`/courses/${courseId}`}
          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          ← Back to course
        </Link>
      </Navbar>

      <section className="mx-auto max-w-2xl px-6 pb-12 pt-8 lg:px-8">
        <div
          className={`rounded-3xl border p-8 shadow-sm ${
            result.passed
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Assessment complete
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            {result.passed ? "You passed!" : "Keep learning"}
          </h1>
          <p className="mt-4 text-lg text-slate-700">
            <span className="font-bold">{result.score}</span> out of{" "}
            <span className="font-bold">{result.totalQuestions}</span> correct (
            {result.percentage}%)
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {result.assessmentTitle} · 1 point per correct answer
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-950">Question breakdown</h2>
          <ul className="mt-4 space-y-2">
            {result.answers?.map((answer, index) => (
              <li
                key={answer.questionId}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2 text-sm"
              >
                <span>Question {index + 1}</span>
                <span
                  className={`font-semibold ${
                    answer.isCorrect ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {answer.isCorrect ? "+1 point" : "0 points"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dashboard/results"
            className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            View all my results
          </Link>
          <Link
            to={`/courses/${courseId}/assessment`}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Retake assessment
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AssessmentResultPage;
