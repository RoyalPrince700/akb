import { ArrowRight, Award, BookOpen, Gem } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Link } from "react-router-dom";

const CongratulationModal = ({
  courseId,
  gemsAwarded,
  gemsEarned,
  isOpen,
  nextChapter,
  onClose,
}) => {
  const [windowDimensions, setWindowDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <Confetti
        height={windowDimensions.height}
        numberOfPieces={gemsAwarded ? 500 : 400}
        recycle={false}
        width={windowDimensions.width}
      />
      <div className="animate-in fade-in zoom-in relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl duration-300">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <Award className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="mb-2 text-3xl font-bold text-slate-950">Awesome Job! 🎉</h2>
        <p className="mb-4 leading-relaxed text-slate-600">
          You've successfully completed this chapter. Your progress has been saved
          {nextChapter ? ", and the next chapter is now unlocked!" : "!"}
        </p>

        {gemsAwarded && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <Gem className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-sm font-semibold">
              You finished the course — <span className="text-amber-800">{gemsEarned} gems</span> have been added to your account!
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {nextChapter ? (
            <Link
              onClick={onClose}
              to={`/courses/${courseId}/chapters/${nextChapter.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Start Next Chapter
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              onClick={onClose}
              to={`/courses/${courseId}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              Course Outline
              <BookOpen className="h-5 w-5" />
            </Link>
          )}
          {gemsAwarded && (
            <Link
              onClick={onClose}
              to="/leaderboard"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-6 py-3 font-semibold text-amber-900 transition-colors hover:bg-amber-100"
            >
              <Gem className="h-5 w-5" />
              View Leaderboard
            </Link>
          )}
          <button
            className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CongratulationModal;
