import { Link, Navigate, useParams } from "react-router-dom";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useState } from "react";

import Navbar from "../components/Navbar";
import LockedChapterModal from "../components/LockedChapterModal";
import assessments, { getAssessmentByCourseId } from "../assessments";
import { useAuth } from "../context/AuthContext";
import { useAssessmentAccess } from "../hooks/useAssessmentAccess";
import courses, { getCourseById, getSortedChapters } from "../courses";
import { useProgress } from "../hooks/useProgress";

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const course = getCourseById(courses, courseId);
  const chapters = getSortedChapters(course);
  const assessment = getAssessmentByCourseId(assessments, courseId);
  const { progress } = useProgress(courseId);
  const { canTakeAssessment, courseCompleted, isReady, isStaff } =
    useAssessmentAccess(courseId);

  const [lockedAttempt, setLockedAttempt] = useState(null);

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  const canRead = isAuthenticated && ["staff", "hr", "admin"].includes(user?.role);

  const rawFirstName = user?.name?.split(' ')[0] || "Staff";
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  return (
    <main className="min-h-screen bg-slate-50">
      <LockedChapterModal 
        isOpen={!!lockedAttempt}
        onClose={() => setLockedAttempt(null)}
        firstName={firstName}
        chapterTitle={lockedAttempt?.title}
        previousChapterTitle={lockedAttempt?.previousTitle}
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
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {course.category}
          </p>
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

        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-950">Chapters</h2>
          <ol className="mt-4 space-y-3">
            {chapters.map((chapter, index) => {
              const isFirst = index === 0;
              const prevChapterCompleted = index > 0 ? progress.includes(chapters[index - 1].id) : true;
              const isUnlocked = isFirst || prevChapterCompleted;
              const isCompleted = progress.includes(chapter.id);
              const canAccess = canRead && isUnlocked;

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
                          <p className="font-semibold text-slate-950">{chapter.title}</p>
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
                      onClick={() => setLockedAttempt({
                        title: chapter.title,
                        previousTitle: index > 0 ? chapters[index - 1].title : "the previous chapter"
                      })}
                      className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-100/60 px-5 py-4 opacity-80 transition hover:bg-slate-200/60"
                    >
                      <div className="flex items-center gap-4">
                        {canRead && !isUnlocked && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                            <Lock className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className="text-left">
                          <span className="text-xs font-semibold text-slate-500">
                            Chapter {index + 1}
                          </span>
                          <p className="font-semibold text-slate-700">{chapter.title}</p>
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
            {chapters[0] && (
              <Link
                to={`/courses/${course.id}/chapters/${chapters[0].id}`}
                className="inline-flex rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Start reading
              </Link>
            )}
            {assessment && canTakeAssessment && (
              <Link
                to={`/courses/${course.id}/assessment`}
                className="inline-flex rounded-full border border-blue-700 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Take assessment ({assessment.totalQuestions} questions)
              </Link>
            )}
            {assessment && isStaff && isReady && !courseCompleted && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-500">
                <Lock className="h-4 w-4" />
                Complete all chapters to unlock assessment
              </span>
            )}
          </div>
        )}

        {assessment && (
          <div className="mt-8 rounded-3xl border border-violet-200 bg-violet-50/50 p-6">
            <h2 className="text-lg font-bold text-slate-950">Course assessment</h2>
            <p className="mt-2 text-sm text-slate-600">
              {assessment.description} Score: 1 point per correct answer (10
              total). Pass mark: {assessment.passMark}/10.
            </p>
            {isStaff && isReady && !courseCompleted && (
              <p className="mt-3 text-sm font-medium text-amber-800">
                Finish every chapter above before you can take this assessment.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default CourseDetailPage;
