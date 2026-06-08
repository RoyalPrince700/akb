const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    assessmentTitle: {
      type: String,
      required: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", resultSchema);
