const crypto = require("crypto");
const mongoose = require("mongoose");

const kssSessionSchema = new mongoose.Schema(
  {
    // Business calendar day (YYYY-MM-DD)
    date: {
      type: String,
      required: [true, "KSS date is required"],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
      index: true,
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
    },
    takenBy: {
      type: String,
      required: [true, "Facilitator name is required"],
      trim: true,
    },
    token: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomBytes(18).toString("hex"),
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

kssSessionSchema.index({ createdAt: -1 });
kssSessionSchema.index({ date: -1, createdAt: -1 });

kssSessionSchema.methods.toPublicObject = function toPublicObject(extras = {}) {
  const session = this.toObject();
  return {
    id: session._id,
    _id: session._id,
    date: session.date,
    topic: session.topic,
    takenBy: session.takenBy,
    token: session.token,
    isActive: session.isActive,
    createdBy: session.createdBy,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    ...extras,
  };
};

module.exports = mongoose.model("KssSession", kssSessionSchema);
