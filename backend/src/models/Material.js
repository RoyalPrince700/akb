const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    tags: {
      type: [String],
      default: [],
    },
    audience: {
      type: String,
      enum: ["staff", "hr", "all"],
      default: "staff",
    },
    courseSlug: {
      type: String,
      trim: true,
      default: "",
    },
    file: {
      url: String,
      publicId: String,
      originalName: String,
      fileType: String,
      size: Number,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);
