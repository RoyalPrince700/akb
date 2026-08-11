const mongoose = require("mongoose");

const kssAttendanceMarkSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KssSession",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Denormalized for stable reporting if user profile changes later
    name: {
      type: String,
      required: true,
      trim: true,
    },
    staffId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    // Server-authoritative mark time only
    markedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

kssAttendanceMarkSchema.index({ session: 1, user: 1 }, { unique: true });
kssAttendanceMarkSchema.index({ session: 1, markedAt: -1 });

kssAttendanceMarkSchema.methods.toPublicObject = function toPublicObject() {
  const mark = this.toObject();
  return {
    id: mark._id,
    _id: mark._id,
    session: mark.session,
    user: mark.user,
    name: mark.name,
    staffId: mark.staffId,
    department: mark.department,
    markedAt: mark.markedAt,
    createdAt: mark.createdAt,
  };
};

module.exports = mongoose.model("KssAttendanceMark", kssAttendanceMarkSchema);
