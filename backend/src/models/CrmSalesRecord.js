const mongoose = require("mongoose");

const { BOOK_SALE_CLASSES, ORGANIZATION_TYPES } = require("../constants/crm");

const crmSalesRecordSchema = new mongoose.Schema(
  {
    organizationType: {
      type: String,
      enum: ORGANIZATION_TYPES,
      default: "school",
      required: [true, "Organization type is required"],
    },
    schoolName: {
      type: String,
      required: [true, "Organization name is required"],
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
    bookItems: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        discountPercent: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        discountAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
        subtotalPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
        totalPrice: {
          type: Number,
          default: 0,
          min: 0,
        },
        bookClass: {
          type: String,
          required: true,
          enum: BOOK_SALE_CLASSES,
        },
      },
    ],
    quantitySold: {
      type: Number,
      required: [true, "Quantity sold is required"],
      min: 1,
    },
    bookClass: {
      type: String,
      enum: BOOK_SALE_CLASSES,
    },
    subtotalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
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
crmSalesRecordSchema.index({ "bookItems.bookClass": 1, saleDate: -1 });
crmSalesRecordSchema.index({ schoolName: 1, location: 1, saleDate: -1 });

module.exports = mongoose.model("CrmSalesRecord", crmSalesRecordSchema);
