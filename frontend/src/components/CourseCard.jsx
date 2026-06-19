import { BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getSortedChapters } from "../courses";
import { useProgress } from "../hooks/useProgress";

const accentStyles = {
  amber: {
    icon: "border-amber-100 bg-amber-50 text-amber-700",
    glow: "from-amber-100/70 via-white to-white",
    progress: "from-amber-500 to-orange-500",
    button: "group-hover:bg-amber-600 group-hover:text-white",
  },
  blue: {
    icon: "border-blue-100 bg-blue-50 text-blue-700",
    glow: "from-blue-100/70 via-white to-white",
    progress: "from-blue-600 to-cyan-500",
    button: "group-hover:bg-blue-600 group-hover:text-white",
  },
  emerald: {
    icon: "border-emerald-100 bg-emerald-50 text-emerald-700",
    glow: "from-emerald-100/70 via-white to-white",
    progress: "from-emerald-500 to-teal-500",
    button: "group-hover:bg-emerald-600 group-hover:text-white",
  },
  rose: {
    icon: "border-rose-100 bg-rose-50 text-rose-700",
    glow: "from-rose-100/70 via-white to-white",
    progress: "from-rose-500 to-pink-500",
    button: "group-hover:bg-rose-600 group-hover:text-white",
  },
  violet: {
    icon: "border-violet-100 bg-violet-50 text-violet-700",
    glow: "from-violet-100/70 via-white to-white",
    progress: "from-violet-600 to-blue-500",
    button: "group-hover:bg-violet-600 group-hover:text-white",
  },
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
  const displayPercentage = isAuthenticated && isReady ? percentage : 0;
  const progressLabel = isAuthenticated
    ? isReady
      ? `${completedCount} of ${chapterCount} lessons completed`
      : "Loading your progress..."
    : `${chapterCount} lesson${chapterCount !== 1 ? "s" : ""} available. Sign in to track progress.`;
  const progressStatus = courseCompleted ? "Completed" : `${displayPercentage}%`;
  const ctaLabel = courseCompleted
    ? "Review Course"
    : displayPercentage > 0
      ? "Continue Learning"
      : "Start Learning";
  const accent = accentStyles[course.accent] ?? accentStyles.blue;
  const metadataItems = [
    `${chapterCount} lesson${chapterCount !== 1 ? "s" : ""}`,
    course.duration ?? course.estimatedDuration,
    course.level ?? course.difficulty,
  ].filter(Boolean);
  const showMetadata = metadataItems.length > 1;

  return (
    <Link
      to={`/courses/${course.id}`}
      aria-label={`${ctaLabel}: ${course.title}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] outline-none transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 sm:p-9"
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-br ${accent.glow} opacity-80 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative flex flex-1 flex-col">
        <div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${accent.icon}`}
            aria-hidden="true"
          >
            <BookOpen className="h-[18px] w-[18px] stroke-[1.8]" />
          </div>

          <p className="mt-6 inline-flex rounded-full bg-slate-100/70 px-2.5 py-1 text-xs font-medium leading-none text-slate-500">
            {course.category}
          </p>
          <h3 className="mt-5 text-[1.7rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-[1.9rem]">
            {course.title}
          </h3>
        </div>

        {showMetadata ? (
          <p className="mt-10 text-[13px] font-medium leading-5 text-slate-500">
            {metadataItems.join(" • ")}
          </p>
        ) : (
          <p className="mt-10 overflow-hidden text-ellipsis text-[15px] leading-7 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {course.shortDescription}
          </p>
        )}

        <div className="mt-auto pt-14">
          <div className="flex justify-end">
            <p className="text-sm font-semibold tabular-nums text-slate-900">
              {progressStatus}
            </p>
          </div>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80"
            role="progressbar"
            aria-label={`${course.title} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayPercentage}
            aria-valuetext={progressStatus}
          >
            <div
              className={`h-full rounded-full bg-linear-to-r ${accent.progress} transition-all duration-500 ease-out`}
              style={{ width: `${displayPercentage}%` }}
            />
          </div>

          <p className="mt-4 text-[13px] font-medium leading-5 text-slate-500">
            {progressLabel}
          </p>

          <div
            className={`mt-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition-all duration-300 ${accent.button}`}
          >
            <span>{ctaLabel}</span>
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.2] transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
