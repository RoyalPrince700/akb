const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      A: { type: String, required: true, trim: true },
      B: { type: String, required: true, trim: true },
      C: { type: String, required: true, trim: true },
      D: { type: String, required: true, trim: true },
    },
    correctOption: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D"],
    },
  },
  { _id: false }
);

const hrAssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    passMark: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeLimitMinutes: {
      type: Number,
      default: 10,
      min: 1,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HrAssessment", hrAssessmentSchema);
