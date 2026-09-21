const mongoose = require("mongoose");

const paPointAwardSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaGroup",
      required: true,
    },
    points: {
      type: Number,
      required: [true, "Points are required"],
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Note must be 500 characters or fewer"],
    },
    awardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    awardedByName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

paPointAwardSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("PaPointAward", paPointAwardSchema);
