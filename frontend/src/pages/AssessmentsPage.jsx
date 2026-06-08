import { Link } from "react-router-dom";

import AssessmentCourseAction from "../components/AssessmentCourseAction";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import assessments from "../assessments";
import courses, { getCourseById } from "../courses";
import { useAuth } from "../context/AuthContext";

const AssessmentsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const canTake =
    isAuthenticated && ["staff", "hr", "admin"].includes(user?.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="border-b border-slate-200 bg-linear-to-br from-violet-50 via-white to-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-700">
              Knowledge checks
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Assessments
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Each course has a 10-question assessment. Earn 1 point per correct
              answer; pass mark is 7/10. Staff must finish all chapters in a
              course before taking its assessment.
            </p>
            {canTake && (
              <Link
                to="/dashboard/results"
                className="mt-6 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                View my results →
              </Link>
            )}
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {assessments.map((assessment) => {
                const course = getCourseById(courses, assessment.courseId);

                return (
                  <article
                    key={assessment.courseId}
                    className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {course?.category}
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-slate-950">
                      {assessment.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                      {assessment.description}
                    </p>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {assessment.totalQuestions} questions · pass{" "}
                      {assessment.passMark}/{assessment.totalQuestions}
                    </p>
                    <AssessmentCourseAction
                      assessment={assessment}
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AssessmentsPage;
