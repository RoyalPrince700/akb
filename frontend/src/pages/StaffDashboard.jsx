import { Link } from "react-router-dom";

import CourseCard from "../components/CourseCard";
import DashboardLayout from "../layouts/DashboardLayout";
import assessments from "../assessments";
import courses, { getSortedChapters } from "../courses";

const StaffDashboard = () => {
  const totalChapters = courses.reduce(
    (sum, course) => sum + getSortedChapters(course).length,
    0
  );

  return (
    <DashboardLayout title="Staff Dashboard">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Courses</p>
          <h2 className="mt-4 text-5xl font-medium tracking-tight text-slate-900">
            {courses.length}
          </h2>
          <p className="mt-2 text-xs text-slate-400">Available learning paths</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Chapters</p>
          <h2 className="mt-4 text-5xl font-medium tracking-tight text-slate-900">
            {totalChapters}
          </h2>
          <p className="mt-2 text-xs text-slate-400">Chapters to read</p>
        </div>
        <Link
          to="/dashboard/results"
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Assessments</p>
          <h2 className="mt-4 text-5xl font-medium tracking-tight text-slate-900">
            {assessments.length}
          </h2>
          <p className="mt-2 text-xs text-slate-400">View your results →</p>
        </Link>
      </div>

      <div className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Your courses</h2>
          <Link
            to="/courses"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Browse all courses
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
