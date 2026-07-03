const mongoose = require("mongoose");

const { NIGERIAN_STATES } = require("../constants/crm");

const bookshopSchema = new mongoose.Schema(
  {
    bookshopName: {
      type: String,
      required: [true, "Bookshop name is required"],
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

bookshopSchema.index({ normalizedPhoneNumber: 1 }, { unique: true, sparse: true });
bookshopSchema.index({ bookshopName: 1, state: 1, address: 1 }, { unique: true });

bookshopSchema.pre("save", async function cleanNormalizedPhone() {
  if (!this.normalizedPhoneNumber) {
    this.normalizedPhoneNumber = undefined;
  }
});

module.exports = mongoose.model("Bookshop", bookshopSchema);
