import { ClipboardCheck, ChevronRight } from "lucide-react";
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
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-br from-violet-100/60 via-white to-slate-50" />
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-100/50 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                Knowledge checks
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                Assessments that confirm real understanding.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Each course includes a focused 10-question assessment. Complete
                the course, answer with care, and keep a clear record of your
                progress.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                {assessments.length} assessment{assessments.length !== 1 ? "s" : ""}
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                10 questions each
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                Pass mark 7/10
              </span>
            </div>

            {canTake && (
              <Link
                to="/dashboard/results"
                className="mt-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700"
              >
                View my results <ChevronRight className="h-3.5 w-3.5" aria-hidden />
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
                    className="group relative flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)]"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-br from-violet-100/60 via-white to-white opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex flex-1 flex-col">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <ClipboardCheck className="h-[18px] w-[18px] stroke-[1.8]" />
                    </div>
                    <p className="mt-6 inline-flex w-fit rounded-full bg-slate-100/70 px-2.5 py-1 text-xs font-medium leading-none text-slate-500">
                      {course?.category}
                    </p>
                    <h2 className="mt-5 text-2xl font-bold leading-[1.08] tracking-tight text-slate-950">
                      {assessment.title}
                    </h2>
                    <p className="mt-8 flex-1 overflow-hidden text-ellipsis text-[15px] leading-7 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {assessment.description}
                    </p>
                    <p className="mt-10 text-[13px] font-medium leading-5 text-slate-500">
                      {assessment.totalQuestions} questions • pass{" "}
                      {assessment.passMark}/{assessment.totalQuestions}
                    </p>
                    <AssessmentCourseAction
                      assessment={assessment}
                    />
                    </div>
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
