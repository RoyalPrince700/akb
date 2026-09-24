const mongoose = require("mongoose");

const OPTION_KEYS = ["A", "B", "C", "D"];
const HR_COURSE_PREFIX = "custom-";

const courseIdForHrAssessment = (id) => `${HR_COURSE_PREFIX}${id}`;

const isHrAssessmentCourseId = (courseId) =>
  typeof courseId === "string" && courseId.startsWith(HR_COURSE_PREFIX);

const idFromHrCourseId = (courseId) => courseId.slice(HR_COURSE_PREFIX.length);

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeTitle = (value) => {
  const title = String(value || "").trim();

  if (!title) {
    throw httpError(400, "Title is required");
  }

  if (title.length > 160) {
    throw httpError(400, "Title must be 160 characters or fewer");
  }

  return title;
};

const normalizeQuestions = (rawQuestions) => {
  if (!Array.isArray(rawQuestions)) {
    throw httpError(400, "Questions must be a list");
  }

  if (rawQuestions.length > 50) {
    throw httpError(400, "An assessment can have at most 50 questions");
  }

  return rawQuestions.map((question, index) => {
    const label = `Question ${index + 1}`;
    const prompt = String(question?.prompt || question?.question || "").trim();

    if (!prompt) {
      throw httpError(400, `${label} needs question text`);
    }

    if (prompt.length > 1000) {
      throw httpError(400, `${label} is too long`);
    }

    const source = question?.options || {};
    const options = {};

    OPTION_KEYS.forEach((key) => {
      const value = String(source[key] ?? "").trim();

      if (!value) {
        throw httpError(400, `${label} needs option ${key}`);
      }

      if (value.length > 400) {
        throw httpError(400, `${label} option ${key} is too long`);
      }

      options[key] = value;
    });

    const unique = new Set(
      OPTION_KEYS.map((key) => options[key].toLowerCase())
    );

    if (unique.size !== OPTION_KEYS.length) {
      throw httpError(400, `${label} options must all be different`);
    }

    const correctOption = String(question?.correctOption || "")
      .trim()
      .toUpperCase();

    if (!OPTION_KEYS.includes(correctOption)) {
      throw httpError(400, `${label} needs a correct answer from A to D`);
    }

    return {
      id: `q${index + 1}`,
      prompt,
      options,
      correctOption,
    };
  });
};

const passMarkFor = (count) => {
  if (!count) return 0;
  return Math.max(1, Math.ceil(count * 0.7));
};

const timeLimitFor = (count) => Math.min(45, Math.max(10, count || 1));

const descriptionFor = (count) =>
  `${count} multiple-choice question${count === 1 ? "" : "s"}. Choose one answer for each question.`;

const assertValidObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(404, "Assessment not found");
  }
};

const toPublicQuestion = (question) => ({
  id: question.id,
  type: "multiple_choice",
  question: question.prompt,
  options: OPTION_KEYS.map((key) => question.options[key]),
});

const toGradingAssessment = (doc) => ({
  courseId: courseIdForHrAssessment(doc._id),
  title: doc.title,
  totalQuestions: doc.questions.length,
  pointsPerQuestion: 1,
  passMark: doc.passMark,
  answers: Object.fromEntries(
    doc.questions.map((question) => [
      question.id,
      question.options[question.correctOption],
    ])
  ),
});

const reviewByQuestionId = (doc) =>
  Object.fromEntries(
    doc.questions.map((question) => [
      question.id,
      {
        questionText: question.prompt,
        correctAnswer: question.options[question.correctOption],
      },
    ])
  );

const toPublicCard = (doc) => ({
  courseId: courseIdForHrAssessment(doc._id),
  title: doc.title,
  description: doc.description,
  category: "HR assessment",
  totalQuestions: doc.questions.length,
  pointsPerQuestion: 1,
  passMark: doc.passMark,
  timeLimitMinutes: doc.timeLimitMinutes,
  locked: Boolean(doc.locked),
  source: "hr",
});

const toEditorQuestion = (question) => ({
  prompt: question.prompt,
  options: {
    A: question.options.A,
    B: question.options.B,
    C: question.options.C,
    D: question.options.D,
  },
  correctOption: question.correctOption,
});

const toHrAssessmentResponse = (doc, submissionCount = 0) => ({
  id: String(doc._id),
  courseId: courseIdForHrAssessment(doc._id),
  title: doc.title,
  description: doc.description || "",
  status: doc.status,
  locked: Boolean(doc.locked),
  questionCount: doc.questions.length,
  passMark: doc.passMark || 0,
  timeLimitMinutes: doc.timeLimitMinutes || 10,
  publishedAt: doc.publishedAt || null,
  updatedAt: doc.updatedAt,
  submissionCount,
  questions: (doc.questions || []).map(toEditorQuestion),
});

const applyPublishFields = (doc) => {
  if (!doc.questions.length) {
    throw httpError(400, "Add at least one question before publishing");
  }

  doc.status = "published";
  doc.publishedAt = doc.publishedAt || new Date();
  doc.passMark = passMarkFor(doc.questions.length);
  doc.timeLimitMinutes = timeLimitFor(doc.questions.length);
  doc.description = descriptionFor(doc.questions.length);
  if (typeof doc.locked !== "boolean") {
    doc.locked = false;
  }
};

module.exports = {
  OPTION_KEYS,
  applyPublishFields,
  assertValidObjectId,
  courseIdForHrAssessment,
  descriptionFor,
  idFromHrCourseId,
  isHrAssessmentCourseId,
  normalizeQuestions,
  normalizeTitle,
  passMarkFor,
  reviewByQuestionId,
  timeLimitFor,
  toGradingAssessment,
  toHrAssessmentResponse,
  toPublicCard,
  toPublicQuestion,
};
