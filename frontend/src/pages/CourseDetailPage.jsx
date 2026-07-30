import { Link, Navigate, useParams } from "react-router-dom";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import LockedChapterModal from "../components/LockedChapterModal";
import LockedAssessmentModal from "../components/LockedAssessmentModal";
import assessments, { getAssessmentByCourseId } from "../assessments";
import { useAuth } from "../context/AuthContext";
import { useAssessmentAccess } from "../hooks/useAssessmentAccess";
import courses, { getCourseById, getSortedChapters } from "../courses";
import { useProgress } from "../hooks/useProgress";
import { listMyResults } from "../services/api";
import { getResultsPath, isLearningRole } from "../utils/rolePaths";

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const course = getCourseById(courses, courseId);
  const chapters = getSortedChapters(course);
  const assessment = getAssessmentByCourseId(assessments, courseId);
  const { progress } = useProgress(courseId);
  const {
    canTakeAssessment,
    courseLockedByHr,
    assessmentLockedByHr,
    isReady,
  } = useAssessmentAccess(courseId);

  const [lockedAttempt, setLockedAttempt] = useState(null);
  const [showAssessmentLocked, setShowAssessmentLocked] = useState(false);
  const [hasTakenAssessment, setHasTakenAssessment] = useState(false);

  const canRead = isAuthenticated && isLearningRole(user?.role);

  useEffect(() => {
    if (!canRead || !assessment) {
      setHasTakenAssessment(false);
      return undefined;
    }

    let cancelled = false;

    const loadTaken = async () => {
      try {
        const data = await listMyResults();
        if (cancelled) return;
        setHasTakenAssessment(
          (data.results || []).some((result) => result.courseId === courseId)
        );
      } catch {
        if (!cancelled) {
          setHasTakenAssessment(false);
        }
      }
    };

    loadTaken();

    return () => {
      cancelled = true;
    };
  }, [assessment, canRead, courseId]);

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  const courseIsLocked = canRead && courseLockedByHr;
  const resultsPath = getResultsPath(user?.role) || "/dashboard/results";

  const rawFirstName = user?.name?.split(" ")[0] || "Staff";
  const firstName =
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  return (
    <main className="min-h-screen bg-slate-50">
      <LockedChapterModal
        isOpen={!!lockedAttempt}
        onClose={() => setLockedAttempt(null)}
        firstName={firstName}
        chapterTitle={lockedAttempt?.title}
        previousChapterTitle={lockedAttempt?.previousTitle}
      />
      <LockedAssessmentModal
        courseId={course.id}
        courseTitle={course.title}
        firstName={firstName}
        isOpen={showAssessmentLocked}
        onClose={() => setShowAssessmentLocked(false)}
        reason="hr-lock"
      />
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 pb-10 pt-8 lg:px-8">
        <Link
          to="/courses"
          className="mb-6 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          ← Back to courses
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {course.category}
            </p>
            {courseIsLocked && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200/80">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Locked by HR
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{course.title}</h1>
          <p className="mt-4 leading-8 text-slate-600">{course.description}</p>
          <p className="mt-4 text-sm text-slate-500">
            {chapters.length} chapters · self-paced reading
          </p>
        </div>

        {!canRead && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <Link to="/login" className="font-semibold text-blue-700 underline">
              Sign in
            </Link>{" "}
            with your staff account to read course chapters.
          </div>
        )}

        {courseIsLocked && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
            This course is currently locked by HR. Chapter reading and progress
            are unavailable until it is unlocked.
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-950">Chapters</h2>
          <ol className="mt-4 space-y-3">
            {chapters.map((chapter, index) => {
              const isFirst = index === 0;
              const prevChapterCompleted =
                index > 0 ? progress.includes(chapters[index - 1].id) : true;
              const isUnlocked = isFirst || prevChapterCompleted;
              const isCompleted = progress.includes(chapter.id);
              const canAccess = canRead && isUnlocked && !courseIsLocked;

              return (
                <li key={chapter.id}>
                  {canAccess ? (
                    <Link
                      to={`/courses/${course.id}/chapters/${chapter.id}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-blue-300 hover:bg-blue-50/40 relative overflow-hidden"
                    >
                      {isCompleted && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                      )}
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs font-semibold text-slate-500">
                            Chapter {index + 1}
                          </span>
                          <p className="font-semibold text-slate-950">
                            {chapter.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <PlayCircle className="w-6 h-6 text-blue-500" />
                        )}
                      </span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (courseIsLocked) {
                          return;
                        }
                        setLockedAttempt({
                          title: chapter.title,
                          previousTitle:
                            index > 0
                              ? chapters[index - 1].title
                              : "the previous chapter",
                        });
                      }}
                      className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-100/60 px-5 py-4 opacity-80 transition hover:bg-slate-200/60"
                    >
                      <div className="flex items-center gap-4">
                        {canRead && (!isUnlocked || courseIsLocked) && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className="text-left">
                          <span className="text-xs font-semibold text-slate-500">
                            Chapter {index + 1}
                          </span>
                          <p className="font-semibold text-slate-700">
                            {chapter.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400">
                        <Lock className="w-5 h-5" />
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {canRead && (
          <div className="mt-8 flex flex-wrap gap-3">
            {chapters[0] && !courseIsLocked && (
              <Link
                to={`/courses/${course.id}/chapters/${chapters[0].id}`}
                className="inline-flex rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Start reading
              </Link>
            )}
            {assessment &&
              isReady &&
              assessmentLockedByHr && (
                <button
                  type="button"
                  onClick={() => setShowAssessmentLocked(true)}
                  className="inline-flex rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Assessment locked by HR
                </button>
              )}
            {assessment &&
              isReady &&
              !assessmentLockedByHr &&
              hasTakenAssessment && (
                <Link
                  to={resultsPath}
                  className="inline-flex rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Assessment taken — view result
                </Link>
              )}
            {assessment &&
              canTakeAssessment &&
              !hasTakenAssessment && (
                <Link
                  to={`/courses/${course.id}/assessment`}
                  className="inline-flex rounded-full border border-blue-700 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Take assessment ({assessment.totalQuestions} questions)
                </Link>
              )}
          </div>
        )}

        {assessment && (
          <div className="mt-8 rounded-3xl border border-violet-200 bg-violet-50/50 p-6">
            <h2 className="text-lg font-bold text-slate-950">Course assessment</h2>
            <p className="mt-2 text-sm text-slate-600">
              {assessment.description} Score: 1 point per correct answer (
              {assessment.totalQuestions} total). Pass mark: {assessment.passMark}/
              {assessment.totalQuestions}.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default CourseDetailPage;
