const mongoose = require("mongoose");

const {
  CALLER_STATUSES,
  CONTACT_MEDIA,
  CRM_CATEGORIES,
  CRM_DIRECTIONS,
  CRM_STATUSES,
  CUSTOMER_TYPES,
  NIGERIAN_STATES,
  ORGANIZATION_TYPES,
  PHONE_LINE_LABELS,
} = require("../constants/crm");

const customerSchema = new mongoose.Schema(
  {
    organizationType: {
      type: String,
      enum: ORGANIZATION_TYPES,
      default: "school",
      required: [true, "Organization type is required"],
    },
    schoolName: {
      type: String,
      trim: true,
      default: "",
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
      default: "",
    },
  },
  { _id: false }
);

const crmInteractionSchema = new mongoose.Schema(
  {
    direction: {
      type: String,
      enum: CRM_DIRECTIONS,
      required: [true, "Direction is required"],
    },
    category: {
      type: String,
      enum: CRM_CATEGORIES,
      required: [true, "Category is required"],
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    dateOfContact: {
      type: Date,
      required: [true, "Date of contact is required"],
    },
    medium: {
      type: String,
      enum: CONTACT_MEDIA,
      required: [true, "Contact medium is required"],
    },
    customerType: {
      type: String,
      enum: CUSTOMER_TYPES,
      required: [true, "Customer type is required"],
    },
    callerStatus: {
      type: String,
      enum: CALLER_STATUSES,
      required: [true, "Caller status is required"],
    },
    complaintNature: {
      type: String,
      trim: true,
      default: "",
    },
    requestQuantity: {
      type: Number,
      min: 1,
      default: null,
    },
    bookTitles: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: CRM_STATUSES,
      required: [true, "Resolution status is required"],
    },
    remark: {
      type: String,
      trim: true,
      default: "",
    },
    salesRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesRep",
      default: null,
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
    phoneLineLabel: {
      type: String,
      enum: [...PHONE_LINE_LABELS, ""],
      trim: true,
      default: "",
    },
    csrPhoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    callReference: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

crmInteractionSchema.index({ "customer.normalizedPhoneNumber": 1, dateOfContact: -1 });
crmInteractionSchema.index({ owner: 1, dateOfContact: -1 });
crmInteractionSchema.index({ salesRep: 1, dateOfContact: -1 });

module.exports = mongoose.model("CrmInteraction", crmInteractionSchema);
