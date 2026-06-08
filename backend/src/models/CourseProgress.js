const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: String,
      required: true,
      trim: true,
    },
    completedChapters: {
      type: [String],
      default: [],
    },
    gemsAwarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

courseProgressSchema.index({ user: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", courseProgressSchema);
