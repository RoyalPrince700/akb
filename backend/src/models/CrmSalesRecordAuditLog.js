const mongoose = require("mongoose");

const crmSalesRecordAuditLogSchema = new mongoose.Schema(
  {
    salesRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmSalesRecord",
      required: true,
    },
    schoolName: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    bookTitles: {
      type: String,
      trim: true,
      default: "",
    },
    organizationType: {
      type: String,
      trim: true,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ownerName: {
      type: String,
      trim: true,
      default: "",
    },
    previousSaleDate: {
      type: Date,
    },
    newSaleDate: {
      type: Date,
    },
    changes: [
      {
        field: {
          type: String,
          required: true,
          trim: true,
        },
        label: {
          type: String,
          required: true,
          trim: true,
        },
        before: {
          type: String,
          default: "",
        },
        after: {
          type: String,
          default: "",
        },
      },
    ],
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

crmSalesRecordAuditLogSchema.index({ createdAt: -1 });
crmSalesRecordAuditLogSchema.index({ salesRecord: 1, createdAt: -1 });

module.exports = mongoose.model("CrmSalesRecordAuditLog", crmSalesRecordAuditLogSchema);
