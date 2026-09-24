const mongoose = require("mongoose");

const RECEIPT_STATUSES = ["none", "pending", "approved", "rejected"];

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
    receiptUrl: {
      type: String,
      default: null,
    },
    receiptPublicId: {
      type: String,
      default: null,
    },
    receiptStatus: {
      type: String,
      enum: RECEIPT_STATUSES,
      default: "none",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedByName: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Review note must be 500 characters or fewer"],
    },
    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointAward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaPointAward",
      default: null,
    },
  },
  { timestamps: true }
);

paProgressSchema.index({ group: 1, createdAt: -1 });
paProgressSchema.index({ author: 1, createdAt: -1 });
paProgressSchema.index({ receiptStatus: 1, createdAt: -1 });

module.exports = mongoose.model("PaProgress", paProgressSchema);
module.exports.RECEIPT_STATUSES = RECEIPT_STATUSES;
