import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import CourseCard from "../CourseCard";

const CoursesSection = ({ courses }) => {
  return (
    <section id="courses" className="scroll-mt-24 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              Learning paths
            </p>
            <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Courses for every department
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              Select a course to preview its chapters. Sign in to read each chapter
              and track your progress as you go.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white hover:text-blue-700"
          >
            View all courses <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
