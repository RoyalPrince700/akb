import { Link } from "react-router-dom";

import CourseCard from "../CourseCard";

const CoursesSection = ({ courses }) => {
  return (
    <section id="courses" className="scroll-mt-24 bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Learning paths
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Courses for every department
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Select a course to preview its chapters. Sign in to read each chapter
              and track your progress as you go.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex shrink-0 items-center text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            View all courses →
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
