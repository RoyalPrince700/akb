const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    staffId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    position: {
      type: String,
      trim: true,
      default: "",
    },
    // Business calendar day in Africa/Lagos (YYYY-MM-DD)
    date: {
      type: String,
      required: true,
      index: true,
    },
    // Server-authoritative punch times only (never client clock)
    checkInAt: {
      type: Date,
      default: null,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    // Primary status: arrival / day completeness (departure uses flags below)
    status: {
      type: String,
      enum: ["present", "partial", "late", "absent"],
      default: "partial",
    },
    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEarlyLeave: {
      type: Boolean,
      default: false,
      index: true,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    checkInMatchConfidence: {
      type: Number,
      default: null,
    },
    checkOutMatchConfidence: {
      type: Number,
      default: null,
    },
    checkInSnapshotUrl: {
      type: String,
      default: null,
    },
    checkOutSnapshotUrl: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      enum: ["facial"],
      default: "facial",
    },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceRecordSchema.index({ checkInAt: -1 });
attendanceRecordSchema.index({ department: 1, date: -1 });
attendanceRecordSchema.index({ date: 1, isLate: 1 });
attendanceRecordSchema.index({ date: 1, isEarlyLeave: 1 });

attendanceRecordSchema.methods.toPublicObject = function toPublicObject() {
  const record = this.toObject();

  let durationMinutes = null;
  if (record.checkInAt && record.checkOutAt) {
    durationMinutes = Math.max(
      0,
      Math.round((new Date(record.checkOutAt) - new Date(record.checkInAt)) / 60000)
    );
  }

  const overtimeMinutes = Number(record.overtimeMinutes) || 0;
  const overtimeHours = Math.round((overtimeMinutes / 60) * 100) / 100;

  return {
    ...record,
    isLate: Boolean(record.isLate),
    isEarlyLeave: Boolean(record.isEarlyLeave),
    overtimeMinutes,
    overtimeHours,
    durationMinutes,
  };
};

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
