const mongoose = require("mongoose");

const STATUSES = ["todo", "in_progress", "review", "done"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const activitySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      trim: true,
      default: "updated",
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 240,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const chatAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
    originalName: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    size: {
      type: Number,
      min: 0,
      max: 2 * 1024 * 1024,
      default: 0,
    },
    resourceType: {
      type: String,
      enum: ["image", "raw"],
      default: "image",
    },
  },
  { _id: false }
);

const chatReplySchema = new mongoose.Schema(
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

const chatMessageSchema = new mongoose.Schema(
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
    },
    attachment: {
      type: chatAttachmentSchema,
      default: undefined,
    },
    replyTo: {
      type: chatReplySchema,
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

const MAX_COMPLETION_ATTACHMENTS = 3;

const completionAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
    originalName: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    size: {
      type: Number,
      min: 0,
      max: 2 * 1024 * 1024,
      default: 0,
    },
    resourceType: {
      type: String,
      enum: ["image", "raw"],
      default: "image",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const statusChangeSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: STATUSES,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [180, "Task title is too long"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [4000, "Description is too long"],
      default: "",
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // The day this task sits on the board. A new day starts empty until a task is created or moved here.
    boardDate: {
      type: Date,
      default: null,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Choose who owns this task"],
      index: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Last time the status itself changed, including the status set at creation.
    statusChangedAt: {
      type: Date,
      default: null,
    },
    // Set when the task reaches Done. Cleared if it is moved out of Done.
    completedAt: {
      type: Date,
      default: null,
    },
    statusHistory: {
      type: [statusChangeSchema],
      default: [],
    },
    activity: {
      type: [activitySchema],
      default: [],
    },
    chat: {
      type: [chatMessageSchema],
      default: [],
    },
    completionAttachments: {
      type: [completionAttachmentSchema],
      default: [],
      validate: [
        (items) => items.length <= MAX_COMPLETION_ATTACHMENTS,
        `At most ${MAX_COMPLETION_ATTACHMENTS} completion files are allowed`,
      ],
    },
  },
  { timestamps: true }
);

taskSchema.index({ assignees: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
module.exports.TASK_STATUSES = STATUSES;
module.exports.TASK_PRIORITIES = PRIORITIES;
module.exports.MAX_COMPLETION_ATTACHMENTS = MAX_COMPLETION_ATTACHMENTS;
