import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import AssessmentStartWarningModal from "../components/AssessmentStartWarningModal";
import AssessmentSubmitConfirmModal from "../components/AssessmentSubmitConfirmModal";
import LockedAssessmentModal from "../components/LockedAssessmentModal";
import assessments, { getAssessmentByCourseId } from "../assessments";
import { stripCorrectAnswers } from "../assessments/utils";
import { useAuth } from "../context/AuthContext";
import courses, { getCourseById } from "../courses";
import { useAssessmentAccess } from "../hooks/useAssessmentAccess";
import { listMyResults, submitAssessment } from "../services/api";
import { getResultsPath, isLearningRole } from "../utils/rolePaths";

const getAssessmentTimeSeconds = (assessment) => {
  if (assessment?.timeLimitMinutes) {
    return assessment.timeLimitMinutes * 60;
  }
  return 5 * 60; // default 5 minutes
};

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const BackToAssessments = () => (
  <Link
    to="/assessments"
    className="mb-6 inline-flex text-sm font-semibold text-slate-500 transition hover:text-violet-700"
  >
    ← Back to assessments
  </Link>
);

const TakeAssessmentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated } = useAuth();
  const { isLocked, isReady, assessmentLockedByHr } =
    useAssessmentAccess(courseId);
  const course = getCourseById(courses, courseId);
  const assessment = getAssessmentByCourseId(assessments, courseId);
  const rawFirstName = user?.name?.split(" ")[0] || "Staff";
  const firstName =
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();
  const resultsPath = getResultsPath(user?.role) || "/dashboard/results";
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const initialTime = assessment
    ? getAssessmentTimeSeconds(assessment)
    : 5 * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialTime);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [timerStarted, setTimerStarted] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [takenCheckReady, setTakenCheckReady] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pendingUnansweredCount, setPendingUnansweredCount] = useState(0);
  const hasSubmittedRef = useRef(false);
  const answersRef = useRef(answers);
  const timedOutHandledRef = useRef(false);

  const hasAssessment = Boolean(course && assessment);
  const questions = hasAssessment
    ? stripCorrectAnswers(assessment.questions)
    : [];
  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canTake =
    isAuthenticated && isLearningRole(user?.role);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!hasAssessment || !canTake) {
      setAlreadyTaken(false);
      setTakenCheckReady(true);
      return undefined;
    }

    let cancelled = false;

    const checkPriorAttempt = async () => {
      setTakenCheckReady(false);
      try {
        const data = await listMyResults();
        if (cancelled) return;
        const taken = (data.results || []).some(
          (result) => result.courseId === courseId
        );
        setAlreadyTaken(taken);
      } catch {
        if (!cancelled) {
          setAlreadyTaken(false);
        }
      } finally {
        if (!cancelled) {
          setTakenCheckReady(true);
        }
      }
    };

    checkPriorAttempt();

    return () => {
      cancelled = true;
    };
  }, [canTake, courseId, hasAssessment]);

  const finishSubmission = useCallback(
    async ({ timedOut = false } = {}) => {
      if (hasSubmittedRef.current) {
        return;
      }

      hasSubmittedRef.current = true;
      setError("");
      setSubmitting(true);
      setShowSubmitConfirm(false);

      try {
        const data = await submitAssessment(courseId, answersRef.current);
        if (data.totalGems != null) {
          updateUser({ gems: data.totalGems });
        }
        navigate(`/courses/${courseId}/assessment/result`, {
          state: {
            result: {
              ...data.result,
              gemsEarned: data.result?.gemsEarned ?? data.gemsEarned ?? 0,
              isFirstAttempt: data.result?.isFirstAttempt ?? true,
            },
            timedOut,
          },
        });
      } catch (err) {
        // Keep the lock on timeout so we never enter a retry loop.
        if (!timedOut) {
          hasSubmittedRef.current = false;
        }
        setError(
          err.response?.data?.message ||
            (timedOut
              ? "Time is up, but submission failed. Please refresh and try again."
              : "Failed to submit assessment.")
        );
        setSubmitting(false);
      }
    },
    [courseId, navigate, updateUser]
  );

  const submitAnswers = useCallback(
    async ({ timedOut = false } = {}) => {
      if (hasSubmittedRef.current || submitting) {
        return;
      }

      // "Next" action when not on the last question (manual submit button path).
      if (!timedOut && currentIndex < questions.length - 1) {
        if (!answers[currentQuestion?.id]) {
          setError("Please answer this question before continuing.");
          return;
        }

        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        setError("");
        return;
      }

      const currentAnswers = answersRef.current;
      const unanswered = questions.filter((q) => !currentAnswers[q.id]);

      // Manual final submit: confirm one-attempt policy before calling the API.
      if (!timedOut) {
        setPendingUnansweredCount(unanswered.length);
        setShowSubmitConfirm(true);
        return;
      }

      await finishSubmission({ timedOut: true });
    },
    [
      answers,
      currentIndex,
      currentQuestion?.id,
      finishSubmission,
      questions,
      submitting,
    ]
  );

  useEffect(() => {
    if (
      !hasAssessment ||
      isLocked ||
      !isReady ||
      !takenCheckReady ||
      alreadyTaken ||
      !timerStarted
    ) {
      return undefined;
    }

    if (secondsLeft <= 0) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [
    alreadyTaken,
    hasAssessment,
    isLocked,
    isReady,
    takenCheckReady,
    timerStarted,
    secondsLeft > 0,
  ]);

  useEffect(() => {
    if (
      !hasAssessment ||
      !isReady ||
      !takenCheckReady ||
      alreadyTaken ||
      isLocked ||
      !timerStarted ||
      secondsLeft > 0 ||
      timedOutHandledRef.current ||
      hasSubmittedRef.current
    ) {
      return;
    }

    timedOutHandledRef.current = true;
    finishSubmission({ timedOut: true });
  }, [
    alreadyTaken,
    finishSubmission,
    hasAssessment,
    isLocked,
    isReady,
    secondsLeft,
    takenCheckReady,
    timerStarted,
  ]);

  if (!hasAssessment) {
    return <Navigate to="/courses" replace />;
  }

  if (!isReady || !takenCheckReady) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 lg:px-8">
          <BackToAssessments />
          <p className="text-center text-slate-600">Checking assessment access…</p>
        </section>
      </main>
    );
  }

  if (alreadyTaken) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 lg:px-8">
          <BackToAssessments />
          <div className="rounded-[32px] border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-950">
              Assessment already taken
            </h1>
            <p className="mt-3 text-slate-600">
              You have already submitted this assessment. Each assessment can
              only be taken once.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={resultsPath}
                className="inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                View my results
              </Link>
              <Link
                to="/assessments"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to assessments
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (isLocked || assessmentLockedByHr) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 lg:px-8">
          <BackToAssessments />
          <div className="rounded-[32px] border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-950">
              Assessment locked
            </h1>
            <p className="mt-3 text-slate-600">
              This assessment is currently locked by HR. Please check back later.
            </p>
            <Link
              to="/assessments"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Back to assessments
            </Link>
          </div>
          <LockedAssessmentModal
            courseId={courseId}
            courseTitle={course?.title || assessment.title}
            firstName={firstName}
            isOpen
            onClose={() => navigate("/assessments")}
            reason="hr-lock"
          />
        </section>
      </main>
    );
  }

  const handleSelect = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError("");
  };

  const goToNext = () => {
    if (!answers[currentQuestion?.id]) {
      setError("Please answer this question before continuing.");
      return;
    }

    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setError("");
  };

  const timerUrgent = secondsLeft <= 60;

  const handleStartTest = () => {
    setShowWarning(false);
    setTimerStarted(true);
  };

  const handleCancelStart = () => {
    navigate("/assessments");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 lg:px-8">
        <BackToAssessments />
        <header className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-br from-violet-100/60 via-white to-white" />
          <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                {course.title}
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950">
                {assessment.title}
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {assessment.description}
              </p>
              <p className="mt-8 text-[13px] font-medium leading-5 text-slate-500">
                {questions.length} questions • 1 point each • pass mark{" "}
                {assessment.passMark}/{questions.length} • {assessment.timeLimitMinutes || 5} minute limit
              </p>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
                timerUrgent
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200/80 bg-white/80"
              }`}
            >
              <p className="text-xs font-medium text-slate-500">
                Time left
              </p>
              <p
                className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                  timerUrgent ? "text-red-700" : "text-slate-950"
                }`}
              >
                {formatTime(secondsLeft)}
              </p>
            </div>
          </div>
          <div className="mt-10">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>
                {Object.keys(answers).length} answered
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-600 to-blue-500 transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
          </div>
        </header>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {secondsLeft === 0 && submitting && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Time is up. Submitting your answers…
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8">
          {currentQuestion && (
            <fieldset
              disabled={submitting || secondsLeft === 0}
              className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] disabled:opacity-70"
            >
              <legend className="sr-only">
                Question {currentIndex + 1} of {questions.length}
              </legend>
              <p className="text-lg font-semibold leading-7 tracking-tight text-slate-950">
                {currentIndex + 1}. {currentQuestion.question}
              </p>
              <div className="mt-8 space-y-3">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
                      answers[currentQuestion.id] === option
                        ? "border-violet-300 bg-violet-50 text-slate-950"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() =>
                        handleSelect(currentQuestion.id, option)
                      }
                      className="h-4 w-4 text-violet-700"
                    />
                    <span className="text-sm text-slate-800">{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={isFirstQuestion || submitting || secondsLeft === 0}
              className="h-10 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex flex-wrap gap-3">
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={submitting || secondsLeft === 0}
                  className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700 disabled:opacity-60"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => submitAnswers({ timedOut: false })}
                  disabled={submitting || secondsLeft === 0}
                  className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit assessment"}
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      <AssessmentStartWarningModal
        isOpen={showWarning}
        onConfirm={handleStartTest}
        onCancel={handleCancelStart}
        assessmentTitle={assessment.title}
        timeLimitMinutes={assessment.timeLimitMinutes || 5}
      />

      <AssessmentSubmitConfirmModal
        isOpen={showSubmitConfirm}
        unansweredCount={pendingUnansweredCount}
        submitting={submitting}
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={() => finishSubmission({ timedOut: false })}
      />
    </main>
  );
};

export default TakeAssessmentPage;
