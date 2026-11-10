const mongoose = require("mongoose");

const dailyTodoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, "Write a to-do before adding it"],
      trim: true,
      maxlength: [280, "To-do is too long"],
    },
    done: {
      type: Boolean,
      default: false,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Choose a valid day"],
    },
  },
  { timestamps: true }
);

dailyTodoSchema.index({ user: 1, date: 1, createdAt: 1 });

module.exports = mongoose.model("DailyTodo", dailyTodoSchema);
