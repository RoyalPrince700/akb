const mongoose = require("mongoose");

const { BOOK_SALE_CLASSES } = require("../constants/crm");

const crmSalesRecordSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    bookTitles: {
      type: String,
      required: [true, "Book titles are required"],
      trim: true,
    },
    quantitySold: {
      type: Number,
      required: [true, "Quantity sold is required"],
      min: 1,
    },
    bookClass: {
      type: String,
      required: [true, "Book class is required"],
      enum: BOOK_SALE_CLASSES,
    },
    saleDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

crmSalesRecordSchema.index({ owner: 1, saleDate: -1 });
crmSalesRecordSchema.index({ bookClass: 1, saleDate: -1 });
crmSalesRecordSchema.index({ schoolName: 1, location: 1, saleDate: -1 });

module.exports = mongoose.model("CrmSalesRecord", crmSalesRecordSchema);
