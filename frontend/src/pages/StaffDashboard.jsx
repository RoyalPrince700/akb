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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Courses</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            {courses.length}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Available learning paths</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Chapters</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            {totalChapters}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Chapters to read</p>
        </div>
        <Link
          to="/dashboard/results"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
        >
          <p className="text-sm font-medium text-slate-500">Assessments</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            {assessments.length}
          </h2>
          <p className="mt-2 text-sm text-slate-600">View your results →</p>
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">Your courses</h2>
          <Link
            to="/courses"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Browse all courses
          </Link>
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
