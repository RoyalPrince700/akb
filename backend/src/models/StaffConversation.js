const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
    },
    authorName: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    preview: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
  },
  { _id: false }
);

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
      maxlength: 2000,
      default: "",
      required: function requiredBody() {
        return !this.deletedAt;
      },
    },
    replyTo: {
      type: replySchema,
      default: undefined,
    },
    deletedAt: {
      type: Date,
    },
    deletedKind: {
      type: String,
      enum: ["text", "media"],
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
