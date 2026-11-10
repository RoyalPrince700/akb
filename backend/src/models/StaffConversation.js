const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const staffConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

staffConversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("StaffConversation", staffConversationSchema);
