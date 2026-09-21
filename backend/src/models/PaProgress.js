const mongoose = require("mongoose");

const paProgressSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaGroup",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: [true, "Progress update is required"],
      trim: true,
      maxlength: [2000, "Progress update must be 2000 characters or fewer"],
    },
  },
  { timestamps: true }
);

paProgressSchema.index({ group: 1, createdAt: -1 });
paProgressSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model("PaProgress", paProgressSchema);
