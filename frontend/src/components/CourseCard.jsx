import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getSortedChapters } from "../courses";
import { useProgress } from "../hooks/useProgress";

const ProgressRing = ({ percentage }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset =
    circumference - (Math.max(0, Math.min(100, percentage)) / 100) * circumference;

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="4"
          className="fill-none stroke-slate-200"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="4"
          strokeLinecap="round"
          className="fill-none stroke-blue-600 transition-all duration-500"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeOffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-950">
        {percentage}%
      </div>
    </div>
  );
};

const CourseCard = ({ course }) => {
  const { isAuthenticated } = useAuth();
  const { courseCompleted, isReady, progress } = useProgress(course.id);
  const chapters = getSortedChapters(course);
  const chapterCount = chapters.length;
  const completedCount = Math.min(progress.length, chapterCount);
  const percentage = chapterCount
    ? Math.round((completedCount / chapterCount) * 100)
    : 0;

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
    >
      <div className="relative overflow-hidden border-b border-slate-100 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.28),transparent_36%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.15em] text-slate-200">
              {course.category}
            </p>
            <h3 className="mt-4 text-xl font-bold leading-snug text-white">
              {course.title}
            </h3>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur">
            <BookOpen className="h-5 w-5 text-blue-200" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm leading-6 text-slate-600">
          {course.shortDescription}
        </p>

        <div className="mt-auto flex flex-col gap-5 pt-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    Course progress
                  </p>
                  {courseCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  )}
                </div>

                {isAuthenticated ? (
                  <>
                    <p className="mt-2 text-sm text-slate-600">
                      {isReady
                        ? `${completedCount} of ${chapterCount} chapters completed`
                        : "Loading your progress..."}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                        style={{ width: `${isReady ? percentage : 0}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    {chapterCount} chapter{chapterCount !== 1 ? "s" : ""} available.
                    Sign in to track your progress.
                  </p>
                )}
              </div>

              {isAuthenticated && (
                <ProgressRing percentage={isReady ? percentage : 0} />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
            <span>Open course</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
