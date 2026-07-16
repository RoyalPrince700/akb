import { useCallback, useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";

import PanelLayout from "../layouts/PanelLayout";
import {
  invalidateContentLocksCache,
  useContentLocks,
} from "../hooks/useContentLocks";
import { updateContentLock } from "../services/api";

const ContentLocksPage = () => {
  const { locksByCourseId, isReady, error: loadError, refresh } = useContentLocks();
  const [locks, setLocks] = useState([]);
  const [error, setError] = useState("");
  const [updatingKey, setUpdatingKey] = useState("");

  useEffect(() => {
    setLocks(
      Object.values(locksByCourseId).sort((a, b) =>
        (a.courseTitle || "").localeCompare(b.courseTitle || "")
      )
    );
  }, [locksByCourseId]);

  useEffect(() => {
    setError(loadError || "");
  }, [loadError]);

  const handleToggle = useCallback(
    async (courseId, field, nextValue) => {
      const key = `${courseId}:${field}`;
      setUpdatingKey(key);
      setError("");

      try {
        const data = await updateContentLock(courseId, { [field]: nextValue });
        invalidateContentLocksCache();
        setLocks((prev) =>
          prev.map((item) =>
            item.courseId === courseId ? { ...item, ...data.lock } : item
          )
        );
        await refresh({ force: true });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update lock.");
      } finally {
        setUpdatingKey("");
      }
    },
    [refresh]
  );

  const lockedCourses = locks.filter((item) => item.courseLocked).length;
  const lockedAssessments = locks.filter((item) => item.assessmentLocked).length;

  return (
    <PanelLayout title="Courses & Assessments">
      <p className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
        Lock a course to stop staff from reading chapters and earning progress.
        Lock an assessment to stop staff from taking that test. HR and admin can
        still preview locked content.
      </p>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Access controls</h2>
            <p className="mt-1 text-sm text-slate-600">
              {locks.length} course{locks.length !== 1 ? "s" : ""} ·{" "}
              {lockedCourses} course{lockedCourses !== 1 ? "s" : ""} locked ·{" "}
              {lockedAssessments} assessment
              {lockedAssessments !== 1 ? "s" : ""} locked
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {!isReady ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Loading courses and assessments...
            </p>
          ) : locks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No courses found.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Course</th>
                  <th className="pb-3 pr-4 font-medium">Assessment</th>
                  <th className="pb-3 pr-4 font-medium">Course access</th>
                  <th className="pb-3 font-medium">Assessment access</th>
                </tr>
              </thead>
              <tbody>
                {locks.map((item) => {
                  const courseBusy =
                    updatingKey === `${item.courseId}:courseLocked`;
                  const assessmentBusy =
                    updatingKey === `${item.courseId}:assessmentLocked`;

                  return (
                    <tr
                      key={item.courseId}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-medium text-slate-950">
                          {item.courseTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.category}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">
                        {item.hasAssessment
                          ? item.assessmentTitle
                          : "No assessment"}
                      </td>
                      <td className="py-4 pr-4">
                        <button
                          type="button"
                          disabled={courseBusy}
                          onClick={() =>
                            handleToggle(
                              item.courseId,
                              "courseLocked",
                              !item.courseLocked
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            item.courseLocked
                              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {item.courseLocked ? (
                            <Lock className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {courseBusy
                            ? "Saving..."
                            : item.courseLocked
                              ? "Locked"
                              : "Open"}
                        </button>
                      </td>
                      <td className="py-4">
                        {item.hasAssessment ? (
                          <button
                            type="button"
                            disabled={assessmentBusy}
                            onClick={() =>
                              handleToggle(
                                item.courseId,
                                "assessmentLocked",
                                !item.assessmentLocked
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              item.assessmentLocked
                                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {item.assessmentLocked ? (
                              <Lock className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Unlock className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {assessmentBusy
                              ? "Saving..."
                              : item.assessmentLocked
                                ? "Locked"
                                : "Open"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PanelLayout>
  );
};

export default ContentLocksPage;
