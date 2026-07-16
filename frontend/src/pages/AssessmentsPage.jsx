import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, ChevronRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";

import AssessmentCourseAction from "../components/AssessmentCourseAction";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import assessments from "../assessments";
import courses, { getCourseById } from "../courses";
import { useAuth } from "../context/AuthContext";
import { useContentLocks } from "../hooks/useContentLocks";
import { listMyResults } from "../services/api";
import { isLearningRole } from "../utils/rolePaths";

const AssessmentsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const canTake = isAuthenticated && isLearningRole(user?.role);
  const isPrivilegedUser = ["hr", "admin"].includes(user?.role);
  const { getLock, isReady: locksReady } = useContentLocks();
  const [takenCourseIds, setTakenCourseIds] = useState(() => new Set());
  const [statusReady, setStatusReady] = useState(!canTake);

  useEffect(() => {
    if (!canTake) {
      setTakenCourseIds(new Set());
      setStatusReady(true);
      return undefined;
    }

    let cancelled = false;

    const loadResults = async () => {
      setStatusReady(false);
      try {
        const data = await listMyResults();
        if (cancelled) return;
        const ids = new Set(
          (data.results || []).map((result) => result.courseId)
        );
        setTakenCourseIds(ids);
      } catch {
        if (!cancelled) {
          setTakenCourseIds(new Set());
        }
      } finally {
        if (!cancelled) {
          setStatusReady(true);
        }
      }
    };

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [canTake]);

  const completedCount = useMemo(() => {
    return assessments.filter((assessment) =>
      takenCourseIds.has(assessment.courseId)
    ).length;
  }, [takenCourseIds]);

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
                Each course includes a focused assessment. Answer with care, earn
                gems on your first attempt, and keep a clear record of your
                progress.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                {assessments.length} assessment
                {assessments.length !== 1 ? "s" : ""}
              </span>
              {canTake && statusReady && (
                <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-2 text-emerald-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  {completedCount} completed
                </span>
              )}
            </div>

            {canTake && (
              <Link
                to="/dashboard/results"
                className="mt-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700"
              >
                View my results{" "}
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {assessments.map((assessment) => {
                const course = getCourseById(courses, assessment.courseId);
                const isCompleted =
                  canTake && takenCourseIds.has(assessment.courseId);
                const isHrLocked =
                  canTake &&
                  !isPrivilegedUser &&
                  locksReady &&
                  Boolean(getLock(assessment.courseId)?.assessmentLocked);

                return (
                  <article
                    key={assessment.courseId}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-[32px] border bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)] ${
                      isHrLocked
                        ? "border-red-200/80"
                        : isCompleted
                          ? "border-emerald-200/80"
                          : "border-slate-200/70"
                    }`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-br via-white to-white opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${
                        isHrLocked
                          ? "from-red-100/60"
                          : isCompleted
                            ? "from-emerald-100/60"
                            : "from-violet-100/60"
                      }`}
                    />
                    <div className="relative flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
                            isHrLocked
                              ? "border-red-100 bg-red-50 text-red-700"
                              : isCompleted
                                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                : "border-violet-100 bg-violet-50 text-violet-700"
                          }`}
                        >
                          <ClipboardCheck className="h-[18px] w-[18px] stroke-[1.8]" />
                        </div>

                        {canTake && statusReady && (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${
                              isHrLocked
                                ? "bg-red-50 text-red-700 ring-1 ring-red-200/80"
                                : isCompleted
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80"
                                  : "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80"
                            }`}
                          >
                            {isHrLocked ? (
                              <>
                                <Lock className="h-3.5 w-3.5" aria-hidden />
                                Locked
                              </>
                            ) : isCompleted ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                Completed
                              </>
                            ) : (
                              <>
                                <Circle className="h-3.5 w-3.5" aria-hidden />
                                Not taken
                              </>
                            )}
                          </span>
                        )}
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
                      <AssessmentCourseAction assessment={assessment} />
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
