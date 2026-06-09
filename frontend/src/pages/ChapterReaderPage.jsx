import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import * as Icons from "lucide-react";

import ChapterContent from "../components/ChapterContent";
import CongratulationModal from "../components/CongratulationModal";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import courses, {
  getAdjacentChapters,
  getChapterById,
  getCourseById,
  getSortedChapters,
} from "../courses";
import { useProgress } from "../hooks/useProgress";

const BackToCourses = () => (
  <Link
    to="/courses"
    className="mb-6 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
  >
    ← Back to courses
  </Link>
);

const ChapterReaderPage = () => {
  const { courseId, chapterId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const rawFirstName = user?.name?.split(" ")[0] || "Staff";
  const firstName =
    rawFirstName.charAt(0).toUpperCase() +
    rawFirstName.slice(1).toLowerCase();
  const course = getCourseById(courses, courseId);
  const chapter = getChapterById(course, chapterId);
  const chapters = getSortedChapters(course);
  const { previous, next } = getAdjacentChapters(course, chapterId);
  const chapterIndex = chapters.findIndex((item) => item.id === chapterId);
  const {
    progress,
    markChapterCompleted,
    isReady: isProgressReady,
    lastCompletion,
    clearLastCompletion,
  } = useProgress(courseId);

  const [showCongrats, setShowCongrats] = useState(false);
  const [completing, setCompleting] = useState(false);

  const chunks = useMemo(() => {
    if (!chapter?.sections) return [];
    const result = [];
    let currentChunk = [];
    
    chapter.sections.forEach((section) => {
      if (section.type === "heading" && currentChunk.length > 0) {
        result.push(currentChunk);
        currentChunk = [section];
      } else {
        currentChunk.push(section);
      }
    });
    
    if (currentChunk.length > 0) {
      result.push(currentChunk);
    }
    return result;
  }, [chapter]);

  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  useEffect(() => {
    setCurrentChunkIndex(0);
    window.scrollTo(0, 0);
  }, [chapterId]);

  if (!course || !chapter) {
    return <Navigate to="/" replace />;
  }

  // Ensure staff can only access if they've completed previous chapters
  const canRead = isAuthenticated && ["staff", "hr", "admin"].includes(user?.role);
  if (!canRead) {
    return <Navigate to={`/courses/${courseId}`} replace />;
  }

  const prevChapterCompleted =
    chapterIndex > 0 ? progress.includes(chapters[chapterIndex - 1].id) : true;
  if (isProgressReady && !prevChapterCompleted && chapterIndex > 0) {
    return <Navigate to={`/courses/${courseId}`} replace />;
  }

  if (!isProgressReady) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 pb-10 pt-8 lg:px-8">
          <BackToCourses />
          <p className="text-center text-slate-600">Loading chapter…</p>
        </section>
      </main>
    );
  }

  const hasPrevChunk = currentChunkIndex > 0;
  const hasNextChunk = currentChunkIndex < chunks.length - 1;
  const currentSections = chunks[currentChunkIndex] || [];
  const isCurrentChapterCompleted = progress.includes(chapterId);

  const TitleIcon = chapter?.icon ? Icons[chapter.icon] : null;

  const handleCompleteChapter = async () => {
    if (completing) return;
    setCompleting(true);
    await markChapterCompleted(chapterId);
    setShowCongrats(true);
    setCompleting(false);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <CongratulationModal
        isOpen={showCongrats}
        onClose={() => {
          setShowCongrats(false);
          clearLastCompletion();
        }}
        courseId={courseId}
        firstName={firstName}
        nextChapter={next}
        gemsAwarded={lastCompletion?.gemsAwarded}
        gemsEarned={lastCompletion?.gemsEarned ?? 10}
      />
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 pb-10 pt-8 lg:px-8">
        <BackToCourses />
        <header>
          <p className="text-sm font-semibold text-slate-500">
            Chapter {chapterIndex + 1} of {chapters.length}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 flex items-center gap-3">
            {TitleIcon && <TitleIcon className="w-8 h-8 text-blue-600" />}
            {chapter.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Estimated reading time: {chapter.readingMinutes} minutes
          </p>
          {chunks.length > 1 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                <span>Progress: Part {currentChunkIndex + 1} of {chunks.length}</span>
                <span>{Math.round(((currentChunkIndex + 1) / chunks.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out" 
                  style={{ width: `${((currentChunkIndex + 1) / chunks.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </header>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <ChapterContent sections={currentSections} />
        </div>

        <nav className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          {hasPrevChunk ? (
            <button
              onClick={() => {
                setCurrentChunkIndex((i) => i - 1);
                window.scrollTo(0, 0);
              }}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white text-left"
            >
              ← Previous section
            </button>
          ) : previous ? (
            <Link
              to={`/courses/${course.id}/chapters/${previous.id}`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}

          {hasNextChunk ? (
            <button
              onClick={() => {
                setCurrentChunkIndex((i) => i + 1);
                window.scrollTo(0, 0);
              }}
              className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 sm:text-right"
            >
              Next section →
            </button>
          ) : isCurrentChapterCompleted ? (
            next ? (
              <Link
                to={`/courses/${course.id}/chapters/${next.id}`}
                className="rounded-full bg-blue-700 px-6 py-2 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-800 sm:ml-auto"
              >
                Next chapter →
              </Link>
            ) : (
              <Link
                to={`/courses/${course.id}`}
                className="rounded-full bg-blue-700 px-6 py-2 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-800 sm:ml-auto"
              >
                Back to course
              </Link>
            )
          ) : (
            <button
              onClick={handleCompleteChapter}
              disabled={completing}
              className="rounded-full bg-green-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 hover:bg-green-700 disabled:opacity-60 sm:ml-auto"
            >
              {completing
                ? "Saving…"
                : next
                  ? "Complete Chapter ✨"
                  : "Finish Course 🎉"}
            </button>
          )}
        </nav>
      </section>
    </main>
  );
};

export default ChapterReaderPage;
