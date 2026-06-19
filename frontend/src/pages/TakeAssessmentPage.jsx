import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import AssessmentStartWarningModal from "../components/AssessmentStartWarningModal";
import assessments, { getAssessmentByCourseId } from "../assessments";
import { stripCorrectAnswers } from "../assessments/utils";
import courses, { getCourseById } from "../courses";
import { useAssessmentAccess } from "../hooks/useAssessmentAccess";
import { submitAssessment } from "../services/api";

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
  const { isLocked, isReady, isStaff } = useAssessmentAccess(courseId);
  const course = getCourseById(courses, courseId);
  const assessment = getAssessmentByCourseId(assessments, courseId);
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
  const hasSubmittedRef = useRef(false);

  const hasAssessment = Boolean(course && assessment);
  const questions = hasAssessment
    ? stripCorrectAnswers(assessment.questions)
    : [];
  const currentQuestion = questions[currentIndex];
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  const submitAnswers = useCallback(
    async ({ timedOut = false } = {}) => {
      if (hasSubmittedRef.current || submitting) {
        return;
      }

      if (!timedOut && currentIndex < questions.length - 1) {
        if (!answers[currentQuestion?.id]) {
          setError("Please answer this question before continuing.");
          return;
        }

        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        setError("");
        return;
      }

      const unanswered = questions.filter((q) => !answers[q.id]);

      if (!timedOut && unanswered.length > 0) {
        const proceed = window.confirm(
          `You have ${unanswered.length} unanswered question${
            unanswered.length === 1 ? "" : "s"
          }. Submit anyway? Unanswered questions count as incorrect.`
        );
        if (!proceed) {
          return;
        }
      }

      hasSubmittedRef.current = true;
      setError("");
      setSubmitting(true);

      try {
        const data = await submitAssessment(courseId, answers);
        navigate(`/courses/${courseId}/assessment/result`, {
          state: { result: data.result, timedOut },
        });
      } catch (err) {
        hasSubmittedRef.current = false;
        setError(err.response?.data?.message || "Failed to submit assessment.");
      } finally {
        setSubmitting(false);
      }
    },
    [answers, courseId, currentIndex, currentQuestion?.id, navigate, questions, submitting]
  );

  useEffect(() => {
    if (!hasAssessment || isLocked || !isReady || !timerStarted) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [hasAssessment, isLocked, isReady, timerStarted]);

  useEffect(() => {
    if (!hasAssessment || !isReady || isLocked || !timerStarted || secondsLeft > 0) {
      return;
    }

    submitAnswers({ timedOut: true });
  }, [hasAssessment, isLocked, isReady, timerStarted, secondsLeft, submitAnswers]);

  if (!hasAssessment) {
    return <Navigate to="/courses" replace />;
  }

  if (isStaff && !isReady) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 lg:px-8">
          <BackToAssessments />
          <div className="rounded-[28px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
            <p className="text-slate-600">Loading assessment…</p>
          </div>
        </section>
      </main>
    );
  }

  if (isLocked) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 pb-12 pt-10 lg:px-8">
          <BackToAssessments />
          <div className="relative overflow-hidden rounded-[32px] border border-amber-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-br from-amber-100/70 via-white to-white" />
            <div className="relative">
            <p className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium leading-none text-amber-700">
              Locked
            </p>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Assessment locked</h1>
            <p className="mt-3 text-slate-700">
              Complete every chapter in {course.title} before taking this
              assessment.
            </p>
            <Link
              to={`/courses/${courseId}`}
              className="mt-8 inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-amber-600"
            >
              Continue course
            </Link>
            </div>
          </div>
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
    navigate(`/courses/${courseId}`);
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
            <fieldset className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
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
              disabled={isFirstQuestion || submitting}
              className="h-10 rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex flex-wrap gap-3">
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={submitting}
                  className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-violet-700 disabled:opacity-60"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitAnswers}
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
    </main>
  );
};

export default TakeAssessmentPage;
