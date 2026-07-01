const mongoose = require("mongoose");

const { NIGERIAN_STATES } = require("../constants/crm");

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      required: [true, "State is required"],
      enum: NIGERIAN_STATES,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    normalizedPhoneNumber: {
      type: String,
      trim: true,
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

schoolSchema.index({ normalizedPhoneNumber: 1 }, { unique: true, sparse: true });
schoolSchema.index({ schoolName: 1, state: 1, address: 1 }, { unique: true });

schoolSchema.pre("save", async function cleanNormalizedPhone() {
  if (!this.normalizedPhoneNumber) {
    this.normalizedPhoneNumber = undefined;
  }
});

module.exports = mongoose.model("School", schoolSchema);
