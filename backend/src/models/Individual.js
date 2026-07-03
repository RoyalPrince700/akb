const mongoose = require("mongoose");

const { NIGERIAN_STATES } = require("../constants/crm");

const individualSchema = new mongoose.Schema(
  {
    individualName: {
      type: String,
      required: [true, "Individual name is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
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

individualSchema.index({ normalizedPhoneNumber: 1 }, { unique: true, sparse: true });
individualSchema.index({ individualName: 1, state: 1, address: 1 }, { unique: true });

individualSchema.pre("save", async function cleanNormalizedPhone() {
  if (!this.normalizedPhoneNumber) {
    this.normalizedPhoneNumber = undefined;
  }
});

module.exports = mongoose.model("Individual", individualSchema);
