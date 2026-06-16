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
        <Link
          to={staffPath}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Staff directory</p>
          <h2 className="mt-4 text-5xl font-medium tracking-tight text-slate-900">{staffCount}</h2>
          <p className="mt-2 text-xs text-slate-400">View all staff records</p>
        </Link>
        <Link
          to={materialsPath}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Learning content</p>
          <h2 className="mt-4 text-5xl font-medium tracking-tight text-slate-900">
            {courses.length + materialsCount}
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            {courses.length} courses plus uploaded resources
          </p>
        </Link>
        <Link
          to={resultsPath}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Assessment results</p>
          <h2 className="mt-4 text-5xl font-medium tracking-tight text-slate-900">
            {resultsCount}
          </h2>
          <p className="mt-2 text-xs text-slate-400">Review staff test scores</p>
        </Link>
        <Link
          to={completionsPath}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Course completions</p>
          <h2 className="mt-4 text-5xl font-medium tracking-tight text-slate-900">
            {courseCompletions}
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            {staffWithCompletions} staff finished at least one course
          </p>
        </Link>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">HR access</h2>
        <ul className="mt-3 max-w-3xl list-inside list-disc space-y-2 leading-7 text-slate-600">
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
