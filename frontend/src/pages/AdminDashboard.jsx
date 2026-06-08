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

const AdminDashboard = () => {
  const [staffCount, setStaffCount] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
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

        const materials = materialsData.materials || [];
        setStaffCount(staffData.pagination?.total ?? 0);
        setResultsCount(resultsData.results?.length ?? 0);
        setMaterialsCount(materials.length);
        setPublishedCount(
          materials.filter((item) => item.status === "published").length
        );
        setCourseCompletions(completionsData.summary?.totalCompletions ?? 0);
        setStaffWithCompletions(
          completionsData.summary?.usersWithCompletions ?? 0
        );
      } catch {
        setStaffCount(0);
        setResultsCount(0);
        setMaterialsCount(0);
        setPublishedCount(0);
        setCourseCompletions(0);
        setStaffWithCompletions(0);
      }
    };

    loadSummary();
  }, []);

  const staffPath = panelSegmentPath("admin", "staff");
  const completionsPath = panelSegmentPath("admin", "completions");
  const resultsPath = panelSegmentPath("admin", "results");
  const materialsPath = panelSegmentPath("admin", "materials");

  return (
    <PanelLayout title="Admin Panel">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        <Link
          to={staffPath}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300"
        >
          <p className="text-sm font-medium text-slate-500">Staff accounts</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">{staffCount}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Create, edit, activate, and deactivate
          </p>
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Built-in courses</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            {courses.length}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            AI, finance, and company history
          </p>
        </div>
        <Link
          to={materialsPath}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300"
        >
          <p className="text-sm font-medium text-slate-500">Uploaded materials</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            {materialsCount}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {publishedCount} published in database
          </p>
        </Link>
        <Link
          to={resultsPath}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300"
        >
          <p className="text-sm font-medium text-slate-500">Assessment results</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            {resultsCount}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Staff submissions on record</p>
        </Link>
        <Link
          to={completionsPath}
          className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm transition hover:border-emerald-300"
        >
          <p className="text-sm font-medium text-emerald-800">Course completions</p>
          <h2 className="mt-3 text-3xl font-bold text-emerald-950">
            {courseCompletions}
          </h2>
          <p className="mt-2 text-sm text-emerald-900">
            {staffWithCompletions} users finished at least one course
          </p>
        </Link>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Administrator tasks</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>
              <Link to={staffPath} className="font-semibold text-blue-700 hover:underline">
                Staff management
              </Link>
              {" "}
              — add accounts, reset passwords, and deactivate leavers.
            </li>
            <li>
              <Link
                to={materialsPath}
                className="font-semibold text-blue-700 hover:underline"
              >
                Materials
              </Link>
              {" "}
              — publish supplementary PDFs and resources beyond built-in courses.
            </li>
            <li>
              <Link
                to={completionsPath}
                className="font-semibold text-blue-700 hover:underline"
              >
                Course completions
              </Link>
              {" "}
              — see which users finished each course.
            </li>
            <li>
              <Link
                to={resultsPath}
                className="font-semibold text-blue-700 hover:underline"
              >
                Assessment results
              </Link>
              {" "}
              — review pass/fail scores for all course tests.
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-950">Platform status</h2>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            Core courses and assessments are live. Cloudinary file uploads can be
            connected later; for now you can add materials with title, description,
            and optional external file URLs.
          </p>
        </div>
      </div>
    </PanelLayout>
  );
};

export default AdminDashboard;
