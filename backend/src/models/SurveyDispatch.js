const crypto = require("crypto");
const mongoose = require("mongoose");

const { SURVEY_CHANNELS } = require("../constants/crm");

const surveyResponseSchema = new mongoose.Schema(
  {
    serviceRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    marketerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    csrRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    responseSpeedRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    resolutionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    recommendRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    respondedAt: Date,
  },
  { _id: false }
);

const surveyDispatchSchema = new mongoose.Schema(
  {
    interaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmInteraction",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    channel: {
      type: String,
      enum: SURVEY_CHANNELS,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(18).toString("hex"),
    },
    surveyUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "responded"],
      default: "sent",
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    response: {
      type: surveyResponseSchema,
      default: null,
    },
  },
  { timestamps: true }
);

surveyDispatchSchema.index({ interaction: 1, createdAt: -1 });
surveyDispatchSchema.index({ customerPhoneNumber: 1, createdAt: -1 });

module.exports = mongoose.model("SurveyDispatch", surveyDispatchSchema);
