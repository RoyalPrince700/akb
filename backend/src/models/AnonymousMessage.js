const mongoose = require("mongoose");

const anonymousMessageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnonymousMessageSession",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

anonymousMessageSchema.index({ session: 1, submittedAt: -1 });

module.exports = mongoose.model("AnonymousMessage", anonymousMessageSchema);
