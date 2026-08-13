const crypto = require("crypto");
const mongoose = require("mongoose");

const anonymousMessageSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
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

anonymousMessageSessionSchema.index({ createdAt: -1 });

anonymousMessageSessionSchema.methods.toPublicObject = function toPublicObject(
  extras = {}
) {
  const session = this.toObject();
  return {
    id: session._id,
    _id: session._id,
    title: session.title,
    token: session.token,
    isActive: session.isActive,
    createdBy: session.createdBy,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    ...extras,
  };
};

module.exports = mongoose.model(
  "AnonymousMessageSession",
  anonymousMessageSessionSchema
);
