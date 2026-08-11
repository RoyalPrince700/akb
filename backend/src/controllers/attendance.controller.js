const AttendanceRecord = require("../models/AttendanceRecord");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const {
  ATTENDANCE_POLICY,
  ATTENDANCE_TIMEZONE,
  businessDayEndUtc,
  businessDayStartUtc,
  getBusinessDateKey,
  getOvertimeHours,
  getOvertimeMinutes,
  isEarlyLeave,
  isLateCheckIn,
} = require("../utils/attendanceDate");
const { uploadBuffer, hasCloudinaryConfig } = require("../config/cloudinary");

/**
 * Official punch times always use server `new Date()`.
 * Any client-supplied timestamp fields are ignored intentionally.
 */

const resolveStaffMember = async (userId, staffId) => {
  const projection =
    "name staffId department position isActive facePhotoUrl faceEnrolledAt +faceDescriptor";

  if (userId) {
    const user = await User.findById(userId).select(projection);
    if (user) {
      return user;
    }
  }

  if (staffId) {
    return User.findOne({ staffId: String(staffId).trim().toUpperCase() }).select(
      projection
    );
  }

  return null;
};

const assertMatchableStaff = (staffMember) => {
  if (!staffMember || !staffMember.isActive) {
    const error = new Error("Staff member not found or inactive");
    error.statusCode = 404;
    throw error;
  }

  const enrolled =
    Boolean(staffMember.facePhotoUrl) ||
    Boolean(staffMember.faceEnrolledAt) ||
    (Array.isArray(staffMember.faceDescriptor) &&
      staffMember.faceDescriptor.length > 0);

  if (!enrolled) {
    const error = new Error("Staff member has no enrolled face data");
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Recompute primary status + departure flags from server punch times.
 * Status = arrival/day completeness; isEarlyLeave / overtimeMinutes are flags.
 */
const recomputeStatus = (record) => {
  const late = record.checkInAt ? isLateCheckIn(record.checkInAt) : false;
  record.isLate = late;

  if (record.checkOutAt) {
    record.isEarlyLeave = isEarlyLeave(record.checkOutAt);
    record.overtimeMinutes = getOvertimeMinutes(record.checkOutAt);
  } else {
    record.isEarlyLeave = false;
    record.overtimeMinutes = 0;
  }

  if (record.checkInAt && record.checkOutAt) {
    record.status = late ? "late" : "present";
    return;
  }

  if (record.checkInAt) {
    record.status = late ? "late" : "partial";
    return;
  }

  record.status = "partial";
};

const optionalSnapshotUpload = async (file) => {
  if (!file?.buffer) {
    return null;
  }

  if (!hasCloudinaryConfig) {
    return null;
  }

  try {
    const result = await uploadBuffer(file.buffer, {
      folder: "akb/attendance-snapshots",
      public_id: `snap_${Date.now()}`,
    });
    return result.secure_url || result.url || null;
  } catch {
    return null;
  }
};

const parseBoolQuery = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes"].includes(normalized)) return true;
  if (["0", "false", "no"].includes(normalized)) return false;
  return undefined;
};

const buildAttendanceFilter = (query) => {
  const filter = {};

  if (query.date) {
    filter.date = query.date;
  } else if (query.month && /^\d{4}-\d{2}$/.test(String(query.month))) {
    const month = String(query.month);
    filter.date = {
      $gte: `${month}-01`,
      $lte: `${month}-31`,
    };
  } else if (query.from || query.to) {
    filter.date = {};
    if (query.from) {
      filter.date.$gte = query.from;
    }
    if (query.to) {
      filter.date.$lte = query.to;
    }
  }

  if (query.department) {
    filter.department = new RegExp(query.department.trim(), "i");
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.staffId) {
    filter.staffId = String(query.staffId).trim().toUpperCase();
  }

  if (query.search) {
    const search = query.search.trim();
    filter.$or = [
      { name: new RegExp(search, "i") },
      { staffId: new RegExp(search, "i") },
      { department: new RegExp(search, "i") },
    ];
  }

  const isLate = parseBoolQuery(query.isLate);
  if (isLate !== undefined) {
    filter.isLate = isLate;
  }

  const earlyLeave = parseBoolQuery(query.isEarlyLeave);
  if (earlyLeave !== undefined) {
    filter.isEarlyLeave = earlyLeave;
  }

  const hasOvertime = parseBoolQuery(query.hasOvertime);
  if (hasOvertime === true) {
    filter.overtimeMinutes = { $gt: 0 };
  } else if (hasOvertime === false) {
    filter.overtimeMinutes = { $lte: 0 };
  }

  return filter;
};

/**
 * Resolve punch type for kiosk auto mode from today's AttendanceRecord.
 * First punch of business day → in; second (checked in, not out) → out;
 * both already set → reject (caller throws 409).
 */
const resolveAutoPunchType = (record) => {
  if (!record?.checkInAt) {
    return "in";
  }
  if (!record.checkOutAt) {
    return "out";
  }
  return null;
};

const markAttendance = asyncHandler(async (req, res) => {
  let type = (req.body.type || req.body.punchType || "auto").toLowerCase();
  if (!["in", "out", "check-in", "check-out", "auto"].includes(type)) {
    res.status(400);
    throw new Error('type must be "in", "out", or "auto"');
  }

  const staffMember = await resolveStaffMember(req.body.userId, req.body.staffId);

  assertMatchableStaff(staffMember);

  // Server clock only — never trust client timestamps
  const now = new Date();
  const dateKey = getBusinessDateKey(now);

  let record = await AttendanceRecord.findOne({
    user: staffMember._id,
    date: dateKey,
  });

  if (!record) {
    record = new AttendanceRecord({
      user: staffMember._id,
      staffId: staffMember.staffId,
      name: staffMember.name,
      department: staffMember.department || "",
      position: staffMember.position || "",
      date: dateKey,
      source: "facial",
    });
  }

  // Server decides direction for type=auto (security kiosk queue mode)
  if (type === "auto") {
    const resolved = resolveAutoPunchType(record);
    if (!resolved) {
      res.status(409);
      throw new Error(
        `${staffMember.name} already completed check-in and check-out for today`
      );
    }
    type = resolved;
  }

  const isCheckIn = type === "in" || type === "check-in";

  const confidence =
    req.body.matchConfidence !== undefined && req.body.matchConfidence !== ""
      ? Number(req.body.matchConfidence)
      : null;

  const snapshotUrl = await optionalSnapshotUpload(req.file);

  if (isCheckIn) {
    if (record.checkInAt && !record.checkOutAt) {
      res.status(409);
      throw new Error(
        `${staffMember.name} is already checked in today. Check out first or wait until next business day.`
      );
    }

    if (record.checkInAt && record.checkOutAt) {
      res.status(409);
      throw new Error(
        `${staffMember.name} already has a complete attendance record for today`
      );
    }

    record.checkInAt = now;
    record.markedBy = req.user._id;
    if (Number.isFinite(confidence)) {
      record.checkInMatchConfidence = confidence;
    }
    if (snapshotUrl) {
      record.checkInSnapshotUrl = snapshotUrl;
    }
  } else {
    if (!record.checkInAt) {
      res.status(409);
      throw new Error(
        `${staffMember.name} has not checked in today. Record check-in first.`
      );
    }

    if (record.checkOutAt) {
      res.status(409);
      throw new Error(`${staffMember.name} is already checked out today`);
    }

    record.checkOutAt = now;
    record.markedBy = req.user._id;
    if (Number.isFinite(confidence)) {
      record.checkOutMatchConfidence = confidence;
    }
    if (snapshotUrl) {
      record.checkOutSnapshotUrl = snapshotUrl;
    }
  }

  recomputeStatus(record);
  await record.save();

  res.status(201).json({
    message: isCheckIn ? "Check-in recorded" : "Check-out recorded",
    punchType: isCheckIn ? "in" : "out",
    timezone: ATTENDANCE_TIMEZONE,
    policy: ATTENDANCE_POLICY,
    attendance: record.toPublicObject(),
  });
});

const listTodayAttendance = asyncHandler(async (req, res) => {
  const dateKey = getBusinessDateKey(new Date());
  const records = await AttendanceRecord.find({ date: dateKey })
    .sort({ checkInAt: -1 })
    .limit(100);

  res.json({
    date: dateKey,
    timezone: ATTENDANCE_TIMEZONE,
    policy: ATTENDANCE_POLICY,
    records: records.map((record) => record.toPublicObject()),
  });
});

const listAttendance = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const filter = buildAttendanceFilter(req.query);

  const [records, total] = await Promise.all([
    AttendanceRecord.find(filter)
      .sort({ date: -1, checkInAt: -1 })
      .skip(skip)
      .limit(limit),
    AttendanceRecord.countDocuments(filter),
  ]);

  res.json({
    timezone: ATTENDANCE_TIMEZONE,
    policy: ATTENDANCE_POLICY,
    records: records.map((record) => record.toPublicObject()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * Monthly / ranged export payload for HR Excel.
 * Query: month=YYYY-MM (preferred) or from/to date keys.
 * Returns all matching records (capped) for client-side xlsx generation.
 */
const exportAttendance = asyncHandler(async (req, res) => {
  const hasRange =
    req.query.month ||
    req.query.from ||
    req.query.to ||
    req.query.date;

  if (!hasRange) {
    res.status(400);
    throw new Error("Provide month (YYYY-MM), date, or from/to for export");
  }

  const filter = buildAttendanceFilter(req.query);
  const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit, 10) || 5000));

  const records = await AttendanceRecord.find(filter)
    .sort({ date: 1, checkInAt: 1, name: 1 })
    .limit(limit);

  const totalOvertimeMinutes = records.reduce(
    (sum, record) => sum + (Number(record.overtimeMinutes) || 0),
    0
  );

  res.json({
    timezone: ATTENDANCE_TIMEZONE,
    policy: ATTENDANCE_POLICY,
    filter: {
      month: req.query.month || null,
      date: req.query.date || null,
      from: req.query.from || null,
      to: req.query.to || null,
      department: req.query.department || null,
      status: req.query.status || null,
      isLate: req.query.isLate ?? null,
      isEarlyLeave: req.query.isEarlyLeave ?? null,
      hasOvertime: req.query.hasOvertime ?? null,
      search: req.query.search || null,
    },
    totals: {
      records: records.length,
      late: records.filter((r) => r.isLate).length,
      earlyLeave: records.filter((r) => r.isEarlyLeave).length,
      withOvertime: records.filter((r) => (r.overtimeMinutes || 0) > 0).length,
      overtimeMinutes: totalOvertimeMinutes,
      overtimeHours: getOvertimeHours(totalOvertimeMinutes),
    },
    records: records.map((record) => record.toPublicObject()),
  });
});

const getAttendanceSummary = asyncHandler(async (req, res) => {
  const dateKey = req.query.date || getBusinessDateKey(new Date());

  const [byStatus, presentCount, earlyLeaveCount, overtimeAgg, totalActiveStaff] =
    await Promise.all([
      AttendanceRecord.aggregate([
        { $match: { date: dateKey } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      AttendanceRecord.countDocuments({
        date: dateKey,
        checkInAt: { $ne: null },
      }),
      AttendanceRecord.countDocuments({
        date: dateKey,
        isEarlyLeave: true,
      }),
      AttendanceRecord.aggregate([
        {
          $match: {
            date: dateKey,
            overtimeMinutes: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalMinutes: { $sum: "$overtimeMinutes" },
          },
        },
      ]),
      User.countDocuments({
        isActive: true,
        role: { $in: ["staff", "hr", "admin", "csr", "csrAdmin", "security"] },
      }),
    ]);

  const statusCounts = byStatus.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const overtimeRow = overtimeAgg[0] || { count: 0, totalMinutes: 0 };

  res.json({
    date: dateKey,
    timezone: ATTENDANCE_TIMEZONE,
    policy: ATTENDANCE_POLICY,
    summary: {
      present: presentCount,
      late: statusCounts.late || 0,
      partial: statusCounts.partial || 0,
      complete: statusCounts.present || 0,
      earlyLeave: earlyLeaveCount,
      withOvertime: overtimeRow.count || 0,
      overtimeMinutes: overtimeRow.totalMinutes || 0,
      overtimeHours: getOvertimeHours(overtimeRow.totalMinutes || 0),
      recorded: Object.values(statusCounts).reduce((sum, n) => sum + n, 0),
      totalActiveStaff,
      absentEstimate: Math.max(0, totalActiveStaff - presentCount),
    },
    dayBounds: {
      start: businessDayStartUtc(dateKey),
      end: businessDayEndUtc(dateKey),
    },
  });
});

/** Matching gallery for security kiosk (descriptors included) */
const listEnrolledFaces = asyncHandler(async (req, res) => {
  const users = await User.find({
    isActive: true,
    $or: [
      { facePhotoUrl: { $ne: null } },
      { faceEnrolledAt: { $ne: null } },
      { "faceDescriptor.0": { $exists: true } },
    ],
  }).select(
    "name staffId department position role facePhotoUrl faceEnrolledAt +faceDescriptor"
  );

  res.json({
    staff: users.map((user) => ({
      _id: user._id,
      name: user.name,
      staffId: user.staffId,
      department: user.department,
      position: user.position,
      role: user.role,
      facePhotoUrl: user.facePhotoUrl,
      faceDescriptor: user.faceDescriptor || null,
      faceEnrolledAt: user.faceEnrolledAt,
    })),
    count: users.length,
  });
});

module.exports = {
  exportAttendance,
  getAttendanceSummary,
  listAttendance,
  listEnrolledFaces,
  listTodayAttendance,
  markAttendance,
  recomputeStatus,
};
