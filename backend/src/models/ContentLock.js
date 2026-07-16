const mongoose = require("mongoose");

const contentLockSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    courseLocked: {
      type: Boolean,
      default: false,
    },
    assessmentLocked: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContentLock", contentLockSchema);
