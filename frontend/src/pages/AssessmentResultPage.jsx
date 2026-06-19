import { Link, Navigate, useLocation, useParams } from "react-router-dom";

import assessments, { getAssessmentByCourseId } from "../assessments";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import courses, { getCourseById } from "../courses";

const AssessmentResultPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const course = getCourseById(courses, courseId);
  const assessment = getAssessmentByCourseId(assessments, courseId);
  const result = location.state?.result;

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  if (!result) {
    return <Navigate to={`/courses/${courseId}/assessment`} replace />;
  }

  const reviewedAnswers =
    result.answers?.map((answer, index) => {
      const question = assessment?.questions?.find(
        (item) => item.id === answer.questionId
      );

      return {
        ...answer,
        questionNumber: index + 1,
        questionText: question?.question || `Question ${index + 1}`,
        correctAnswer: question?.correctAnswer || "Not available",
      };
    }) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar>
        <Link
          to={`/courses/${courseId}`}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-violet-700"
        >
          ← Back to course
        </Link>
      </Navbar>

      <main>
      <section className="mx-auto max-w-2xl px-6 pb-12 pt-10 lg:px-8">
        <div
          className={`relative overflow-hidden rounded-[32px] border bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] ${
            result.passed
              ? "border-emerald-200/80"
              : "border-amber-200/80"
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-40 ${
              result.passed
                ? "bg-linear-to-br from-emerald-100/70 via-white to-white"
                : "bg-linear-to-br from-amber-100/70 via-white to-white"
            }`}
          />
          <div className="relative">
          <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
            Assessment complete
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950">
            {result.passed ? "You passed!" : "Keep learning"}
          </h1>
          <p className="mt-6 text-lg text-slate-700">
            <span className="font-bold">{result.score}</span> out of{" "}
            <span className="font-bold">{result.totalQuestions}</span> correct (
            {result.percentage}%)
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {result.assessmentTitle}
          </p>
          </div>
        </div>

        <div className="mt-6 rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <h2 className="font-bold tracking-tight text-slate-950">Questions and correct answers</h2>
          <ul className="mt-5 space-y-3">
            {reviewedAnswers.map((answer) => (
              <li
                key={answer.questionId}
                className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-semibold text-slate-950">
                    Question {answer.questionNumber}: {answer.questionText}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      answer.isCorrect
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {answer.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <p className="mt-3 text-slate-600">
                  Your answer:{" "}
                  <span
                    className={`font-medium ${
                      answer.isCorrect ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {answer.selectedAnswer || "No answer selected"}
                  </span>
                </p>
                <p className="mt-2 text-slate-600">
                  Correct answer:{" "}
                  <span className="font-medium text-slate-900">
                    {answer.correctAnswer}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dashboard/results"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700"
          >
            View all my results
          </Link>
          <Link
            to={`/courses/${courseId}/assessment`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
          >
            Retake assessment
          </Link>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
};

export default AssessmentResultPage;
