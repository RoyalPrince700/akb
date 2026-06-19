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

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
};

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
        <OverviewCard
          label="Staff accounts"
          value={staffCount}
          description="Create, edit, activate, and deactivate"
          to={staffPath}
        />
        <OverviewCard
          label="Built-in courses"
          value={courses.length}
          description="AI, finance, and company history"
        />
        <OverviewCard
          label="Uploaded materials"
          value={materialsCount}
          description={`${publishedCount} published in database`}
          to={materialsPath}
        />
        <OverviewCard
          label="Assessment results"
          value={resultsCount}
          description="Staff submissions on record"
          to={resultsPath}
        />
        <OverviewCard
          label="Course completions"
          value={courseCompletions}
          description={`${staffWithCompletions} users finished at least one course`}
          to={completionsPath}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Administrator tasks
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
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
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <p className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium leading-none text-blue-700">
            Live
          </p>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
            Platform status
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
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
