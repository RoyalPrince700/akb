import { useCallback, useEffect, useState } from "react";
import { Lock, Plus, Trash2, Unlock } from "lucide-react";

import PanelLayout from "../layouts/PanelLayout";
import {
  createHrAssessment,
  deleteHrAssessment,
  listHrAssessments,
  publishHrAssessment,
  setHrAssessmentAccess,
  updateHrAssessment,
} from "../services/api";

const OPTION_KEYS = ["A", "B", "C", "D"];

const emptyQuestion = () => ({
  prompt: "",
  options: { A: "", B: "", C: "", D: "" },
  correctOption: "A",
});

const questionIsStarted = (question) => {
  if (question.prompt.trim()) return true;
  return OPTION_KEYS.some((key) => question.options[key].trim());
};

const validateQuestion = (question) => {
  const prompt = question.prompt.trim();
  if (!prompt) return "Enter the question text.";

  const options = {};
  for (const key of OPTION_KEYS) {
    const value = question.options[key].trim();
    if (!value) return `Enter option ${key}.`;
    options[key] = value;
  }

  const unique = new Set(Object.values(options).map((value) => value.toLowerCase()));
  if (unique.size !== OPTION_KEYS.length) {
    return "Options A to D must all be different.";
  }

  if (!OPTION_KEYS.includes(question.correctOption)) {
    return "Select the correct answer.";
  }

  return "";
};

const formatWhen = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
};

const HrStaffAssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeId, setActiveId] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [draft, setDraft] = useState(emptyQuestion);
  const [editingIndex, setEditingIndex] = useState(null);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHrAssessments();
      setAssessments(data.assessments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const resetEditor = () => {
    setActiveId("");
    setTitle("");
    setQuestions([]);
    setDraft(emptyQuestion());
    setEditingIndex(null);
  };

  const loadIntoEditor = (assessment) => {
    setActiveId(assessment.id);
    setTitle(assessment.title || "");
    setQuestions(
      (assessment.questions || []).map((question) => ({
        prompt: question.prompt,
        options: { ...question.options },
        correctOption: question.correctOption,
      }))
    );
    setDraft(emptyQuestion());
    setEditingIndex(null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateDraftOption = (key, value) => {
    setDraft((current) => ({
      ...current,
      options: { ...current.options, [key]: value },
    }));
  };

  const commitDraft = () => {
    const message = validateQuestion(draft);
    if (message) {
      setError(message);
      return false;
    }

    const next = {
      prompt: draft.prompt.trim(),
      options: {
        A: draft.options.A.trim(),
        B: draft.options.B.trim(),
        C: draft.options.C.trim(),
        D: draft.options.D.trim(),
      },
      correctOption: draft.correctOption,
    };

    setQuestions((current) => {
      if (editingIndex == null) return [...current, next];
      return current.map((question, index) =>
        index === editingIndex ? next : question
      );
    });
    setDraft(emptyQuestion());
    setEditingIndex(null);
    setError("");
    return true;
  };

  const payloadQuestions = () =>
    questions.map((question) => ({
      prompt: question.prompt,
      options: question.options,
      correctOption: question.correctOption,
    }));

  const saveDraft = async () => {
    if (questionIsStarted(draft)) {
      setError("Add the question you started before saving.");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Add a title first.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = { title: trimmedTitle, questions: payloadQuestions() };
      const data = activeId
        ? await updateHrAssessment(activeId, payload)
        : await createHrAssessment(payload);
      setActiveId(data.assessment?.id || activeId);
      setSuccess(data.message || "Draft saved.");
      await loadAssessments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save the draft.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (questionIsStarted(draft)) {
      setError("Add the question you started before publishing.");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Add a title first.");
      return;
    }

    if (!questions.length) {
      setError("Add at least one multiple-choice question before publishing.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = { title: trimmedTitle, questions: payloadQuestions() };
      const data = activeId
        ? await publishHrAssessment(activeId, payload)
        : await createHrAssessment({ ...payload, publish: true });
      setSuccess(
        data.message ||
          "Assessment published. It now appears on the assessments page."
      );
      resetEditor();
      await loadAssessments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish the assessment.");
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async (assessment) => {
    setBusyId(assessment.id);
    setError("");
    setSuccess("");
    try {
      const data = await setHrAssessmentAccess(assessment.id, {
        locked: !assessment.locked,
      });
      setSuccess(data.message || "Assessment access updated.");
      await loadAssessments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update access.");
    } finally {
      setBusyId("");
    }
  };

  const removeDraft = async (assessment) => {
    setBusyId(assessment.id);
    setError("");
    setSuccess("");
    try {
      const data = await deleteHrAssessment(assessment.id);
      if (activeId === assessment.id) resetEditor();
      setSuccess(data.message || "Draft deleted.");
      await loadAssessments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete the draft.");
    } finally {
      setBusyId("");
    }
  };

  const activeAssessment = assessments.find((item) => item.id === activeId);
  const editorLocked = activeAssessment?.status === "published";

  return (
    <PanelLayout title="Assessments">
      <div className="space-y-6">
        <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Write a title, add multiple-choice questions (A–D), mark the correct
          answer, then publish. Published assessments appear on the assessments
          page. You can lock or unlock a published assessment at any time.
          Course assessments still use Lock Access.
        </p>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {success}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                {activeId ? "Edit assessment" : "New assessment"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editorLocked
                  ? "This assessment is published. Questions stay as published. Use lock or unlock below."
                  : "Save a draft while you write, or publish when the questions are ready."}
              </p>
            </div>
            {activeId ? (
              <button
                type="button"
                onClick={resetEditor}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                New assessment
              </button>
            ) : null}
          </div>

          <label className="mt-5 block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Title</span>
            <input
              type="text"
              value={title}
              disabled={editorLocked || saving}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. September knowledge check"
              className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            />
          </label>

          {questions.length ? (
            <ol className="mt-6 space-y-3">
              {questions.map((question, index) => (
                <li
                  key={`${question.prompt}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {index + 1}. {question.prompt}
                    </p>
                    {editorLocked ? null : (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDraft({
                              prompt: question.prompt,
                              options: { ...question.options },
                              correctOption: question.correctOption,
                            });
                            setEditingIndex(index);
                            setError("");
                          }}
                          className="text-xs font-semibold text-violet-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index)
                            );
                            if (editingIndex === index) {
                              setDraft(emptyQuestion());
                              setEditingIndex(null);
                            }
                          }}
                          className="text-xs font-semibold text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {OPTION_KEYS.map((key) => (
                      <li key={key}>
                        <span className="font-semibold text-slate-800">{key}.</span>{" "}
                        {question.options[key]}
                        {question.correctOption === key ? (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            Correct
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 text-sm text-slate-500">No questions added yet.</p>
          )}

          {editorLocked ? null : (
            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-950">
                {editingIndex == null ? "Add a question" : "Update question"}
              </h3>
              <label className="mt-3 block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">
                  Question
                </span>
                <textarea
                  value={draft.prompt}
                  rows={3}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      prompt: event.target.value,
                    }))
                  }
                  placeholder="Write the question"
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <div className="mt-3 space-y-2">
                {OPTION_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="flex w-16 shrink-0 items-center gap-2 text-sm font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="correct-option"
                        checked={draft.correctOption === key}
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            correctOption: key,
                          }))
                        }
                        className="h-4 w-4 text-violet-700"
                      />
                      {key}
                    </label>
                    <input
                      type="text"
                      value={draft.options[key]}
                      onChange={(event) => updateDraftOption(key, event.target.value)}
                      placeholder={`Option ${key}`}
                      className="w-full rounded-xl border border-slate-200/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Select the letter next to the correct answer.
              </p>
              <button
                type="button"
                onClick={commitDraft}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {editingIndex == null ? "Add question" : "Update question"}
              </button>
            </div>
          )}

          {editorLocked ? null : (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={saveDraft}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={publish}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {saving ? "Publishing..." : "Publish assessment"}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            Your assessments
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Drafts stay private. Published assessments show on the assessments
            page, and you can lock or unlock them after publishing.
          </p>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Loading assessments...
            </p>
          ) : assessments.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No assessments yet. Add a title and your first question above.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {assessments.map((assessment) => {
                const published = assessment.status === "published";
                const busy = busyId === assessment.id;
                return (
                  <li
                    key={assessment.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">
                          {assessment.title}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            published
                              ? assessment.locked
                                ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                                : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {published
                            ? assessment.locked
                              ? "Published · Locked"
                              : "Published · Open"
                            : "Draft"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {assessment.questionCount} question
                        {assessment.questionCount === 1 ? "" : "s"}
                        {published
                          ? ` · ${assessment.submissionCount || 0} submission${
                              assessment.submissionCount === 1 ? "" : "s"
                            }`
                          : ""}
                        {assessment.publishedAt
                          ? ` · Published ${formatWhen(assessment.publishedAt)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {published ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleLock(assessment)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                            assessment.locked
                              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {assessment.locked ? (
                            <Lock className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {busy
                            ? "Saving..."
                            : assessment.locked
                              ? "Locked"
                              : "Open"}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => loadIntoEditor(assessment)}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit draft
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => removeDraft(assessment)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PanelLayout>
  );
};

export default HrStaffAssessmentsPage;
