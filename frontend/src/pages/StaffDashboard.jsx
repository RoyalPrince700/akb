import { Link } from "react-router-dom";

import CourseCard from "../components/CourseCard";
import DashboardLayout from "../layouts/DashboardLayout";
import assessments from "../assessments";
import courses, { getSortedChapters } from "../courses";

const StatCard = ({ label, value, description, to }) => {
  const content = (
    <>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h2 className="mt-5 text-5xl font-bold tracking-tighter text-slate-950">
        {value}
      </h2>
      <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p>
    </>
  );

  const className =
    "rounded-[28px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)]";

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
};

const StaffDashboard = () => {
  const totalChapters = courses.reduce(
    (sum, course) => sum + getSortedChapters(course).length,
    0
  );

  return (
    <DashboardLayout title="Staff Dashboard">
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          label="Courses"
          value={courses.length}
          description="Available learning paths"
        />
        <StatCard
          label="Lessons"
          value={totalChapters}
          description="Short chapters to complete"
        />
        <StatCard
          label="Assessments"
          value={assessments.length}
          description="View your results"
          to="/dashboard/results"
        />
      </div>

      <div className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Your courses
          </h2>
          <Link
            to="/courses"
            className="text-sm font-semibold text-slate-500 transition hover:text-blue-700"
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
