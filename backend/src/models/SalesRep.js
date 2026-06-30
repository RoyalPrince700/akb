const mongoose = require("mongoose");

const salesRepSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sales rep name is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

salesRepSchema.index({ name: 1, state: 1, location: 1 }, { unique: true });

module.exports = mongoose.model("SalesRep", salesRepSchema);
