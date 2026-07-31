const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Country name is required"],
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

countrySchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

module.exports = mongoose.model("Country", countrySchema);
