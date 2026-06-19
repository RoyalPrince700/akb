import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PanelLayout from "../layouts/PanelLayout";
import courses from "../courses";
import {
  getStaffCourseCompletions,
  listAllResults,
  listMaterials,
  listStaff,
} from "../services/api";
import { panelSegmentPath } from "../utils/rolePaths";

const OverviewCard = ({ label, value, description, to }) => {
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
    "rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)]";

  return (
    <Link to={to} className={className}>
      {content}
    </Link>
  );
};

const HrDashboard = () => {
  const [staffCount, setStaffCount] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [courseCompletions, setCourseCompletions] = useState(0);
  const [staffWithCompletions, setStaffWithCompletions] = useState(0);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [staffData, resultsData, materialsData, completionsData] =
          await Promise.all([
            listStaff({ limit: 1 }),
            listAllResults(),
            listMaterials(),
            getStaffCourseCompletions(),
          ]);

        setStaffCount(staffData.pagination?.total ?? 0);
        setResultsCount(resultsData.results?.length ?? 0);
        setMaterialsCount((materialsData.materials || []).length);
        setCourseCompletions(completionsData.summary?.totalCompletions ?? 0);
        setStaffWithCompletions(
          completionsData.summary?.usersWithCompletions ?? 0
        );
      } catch {
        setStaffCount(0);
        setResultsCount(0);
        setMaterialsCount(0);
        setCourseCompletions(0);
        setStaffWithCompletions(0);
      }
    };

    loadSummary();
  }, []);

  const staffPath = panelSegmentPath("hr", "staff");
  const completionsPath = panelSegmentPath("hr", "completions");
  const resultsPath = panelSegmentPath("hr", "results");
  const materialsPath = panelSegmentPath("hr", "materials");

  return (
    <PanelLayout title="HR Panel">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          label="Staff directory"
          value={staffCount}
          description="View all staff records"
          to={staffPath}
        />
        <OverviewCard
          label="Learning content"
          value={courses.length + materialsCount}
          description={`${courses.length} courses plus uploaded resources`}
          to={materialsPath}
        />
        <OverviewCard
          label="Assessment results"
          value={resultsCount}
          description="Review staff test scores"
          to={resultsPath}
        />
        <OverviewCard
          label="Course completions"
          value={courseCompletions}
          description={`${staffWithCompletions} staff finished at least one course`}
          to={completionsPath}
        />
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">
          HR access
        </h2>
        <ul className="mt-5 max-w-3xl list-inside list-disc space-y-2 leading-7 text-slate-600">
          <li>
            Browse the staff directory and filter by department or status.
          </li>
          <li>
            Open{" "}
            <strong>Course Completions</strong> to see how many courses each
            staff member has finished and view their completed course list.
          </li>
          <li>View assessment results for all staff (read-only).</li>
          <li>See published learning materials and built-in course catalog.</li>
          <li>
            Account changes (create, edit, activate, delete) require an
            administrator.
          </li>
        </ul>
      </div>
    </PanelLayout>
  );
};

export default HrDashboard;
