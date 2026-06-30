const mongoose = require("mongoose");

const {
  CALLER_STATUSES,
  CONTACT_MEDIA,
  CRM_CATEGORIES,
  CRM_DIRECTIONS,
  CRM_STATUSES,
  CUSTOMER_TYPES,
  NIGERIAN_STATES,
} = require("../constants/crm");

const customerSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      enum: NIGERIAN_STATES,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    normalizedPhoneNumber: {
      type: String,
      required: [true, "Normalized phone number is required"],
      trim: true,
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

crmInteractionSchema.pre("validate", function validateInteraction() {
  if (this.category === "request" && !this.requestQuantity) {
    this.invalidate("requestQuantity", "Request quantity is required for request calls");
  }

  if (this.category === "complaint" && !this.complaintNature.trim()) {
    this.invalidate("complaintNature", "Complaint nature is required for complaint calls");
  }
});

module.exports = mongoose.model("CrmInteraction", crmInteractionSchema);
