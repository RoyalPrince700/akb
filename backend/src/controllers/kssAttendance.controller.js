const KssAttendanceMark = require("../models/KssAttendanceMark");
const KssSession = require("../models/KssSession");
const asyncHandler = require("../utils/asyncHandler");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const attendancePathForToken = (token) => `/kss-attendance/${token}`;

const absoluteAttendanceUrl = (token) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
  return `${clientUrl}${attendancePathForToken(token)}`;
};

const sessionResponse = (session, extras = {}) => {
  const base =
    typeof session.toPublicObject === "function"
      ? session.toPublicObject()
      : {
          id: session._id,
          _id: session._id,
          date: session.date,
          topic: session.topic,
          takenBy: session.takenBy,
          token: session.token,
          isActive: session.isActive,
          createdBy: session.createdBy,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };

  return {
    ...base,
    attendancePath: attendancePathForToken(base.token),
    attendanceUrl: absoluteAttendanceUrl(base.token),
    ...extras,
  };
};

const createKssSession = asyncHandler(async (req, res) => {
  const date = String(req.body.date || "").trim();
  const topic = String(req.body.topic || "").trim();
  const takenBy = String(req.body.takenBy || req.body.facilitator || "").trim();

  if (!date || !DATE_RE.test(date)) {
    res.status(400);
    throw new Error("Provide a valid KSS date (YYYY-MM-DD)");
  }

  if (!topic) {
    res.status(400);
    throw new Error("Topic is required");
  }

  if (!takenBy) {
    res.status(400);
    throw new Error("Who is taking the KSS is required");
  }

  const session = await KssSession.create({
    date,
    topic,
    takenBy,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: "KSS session created",
    session: sessionResponse(session, { attendanceCount: 0 }),
  });
});

const listKssSessions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;

  const [sessions, total] = await Promise.all([
    KssSession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    KssSession.countDocuments(filter),
  ]);

  const sessionIds = sessions.map((s) => s._id);
  const counts = await KssAttendanceMark.aggregate([
    { $match: { session: { $in: sessionIds } } },
    { $group: { _id: "$session", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  res.json({
    sessions: sessions.map((session) =>
      sessionResponse(session, {
        attendanceCount: countMap.get(String(session._id)) || 0,
      })
    ),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

const getKssSession = asyncHandler(async (req, res) => {
  const session = await KssSession.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error("KSS session not found");
  }

  const attendees = await KssAttendanceMark.find({ session: session._id })
    .sort({ markedAt: 1 })
    .lean();

  res.json({
    session: sessionResponse(session, {
      attendanceCount: attendees.length,
    }),
    attendees: attendees.map((mark) => ({
      id: mark._id,
      _id: mark._id,
      user: mark.user,
      name: mark.name,
      staffId: mark.staffId,
      department: mark.department || "",
      markedAt: mark.markedAt,
    })),
  });
});

const updateKssSession = asyncHandler(async (req, res) => {
  const session = await KssSession.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error("KSS session not found");
  }

  if (typeof req.body.isActive === "boolean") {
    session.isActive = req.body.isActive;
  } else if (req.body.isActive === "true" || req.body.isActive === "false") {
    session.isActive = req.body.isActive === "true";
  } else {
    res.status(400);
    throw new Error("Provide isActive (true or false) to close or reopen the session");
  }

  await session.save();

  const attendanceCount = await KssAttendanceMark.countDocuments({
    session: session._id,
  });

  res.json({
    message: session.isActive ? "KSS session reopened" : "KSS session closed",
    session: sessionResponse(session, { attendanceCount }),
  });
});

const previewMarkByToken = asyncHandler(async (req, res) => {
  const session = await KssSession.findOne({ token: req.params.token });
  if (!session) {
    res.status(404);
    throw new Error("Invalid or expired KSS attendance link");
  }

  const existing = await KssAttendanceMark.findOne({
    session: session._id,
    user: req.user._id,
  }).lean();

  res.json({
    session: {
      date: session.date,
      topic: session.topic,
      takenBy: session.takenBy,
      isActive: session.isActive,
    },
    alreadyMarked: Boolean(existing),
    mark: existing
      ? {
          markedAt: existing.markedAt,
          name: existing.name,
          staffId: existing.staffId,
        }
      : null,
  });
});

const markByToken = asyncHandler(async (req, res) => {
  const session = await KssSession.findOne({ token: req.params.token });
  if (!session) {
    res.status(404);
    throw new Error("Invalid or expired KSS attendance link");
  }

  const existing = await KssAttendanceMark.findOne({
    session: session._id,
    user: req.user._id,
  });

  if (existing) {
    return res.json({
      message: "Attendance already recorded",
      alreadyMarked: true,
      newlyMarked: false,
      session: {
        date: session.date,
        topic: session.topic,
        takenBy: session.takenBy,
        isActive: session.isActive,
      },
      mark: {
        markedAt: existing.markedAt,
        name: existing.name,
        staffId: existing.staffId,
        department: existing.department || "",
      },
    });
  }

  if (!session.isActive) {
    res.status(400);
    throw new Error("This KSS attendance link is closed. Contact HR if you need help.");
  }

  if (!req.user.isActive) {
    res.status(403);
    throw new Error("Your account is inactive");
  }

  try {
    const mark = await KssAttendanceMark.create({
      session: session._id,
      user: req.user._id,
      name: req.user.name,
      staffId: req.user.staffId,
      department: req.user.department || "",
      markedAt: new Date(),
    });

    return res.status(201).json({
      message: "Attendance recorded",
      alreadyMarked: false,
      newlyMarked: true,
      session: {
        date: session.date,
        topic: session.topic,
        takenBy: session.takenBy,
        isActive: session.isActive,
      },
      mark: {
        markedAt: mark.markedAt,
        name: mark.name,
        staffId: mark.staffId,
        department: mark.department || "",
      },
    });
  } catch (error) {
    // Race: concurrent marks for same user+session
    if (error && error.code === 11000) {
      const mark = await KssAttendanceMark.findOne({
        session: session._id,
        user: req.user._id,
      });
      return res.json({
        message: "Attendance already recorded",
        alreadyMarked: true,
        newlyMarked: false,
        session: {
          date: session.date,
          topic: session.topic,
          takenBy: session.takenBy,
          isActive: session.isActive,
        },
        mark: mark
          ? {
              markedAt: mark.markedAt,
              name: mark.name,
              staffId: mark.staffId,
              department: mark.department || "",
            }
          : null,
      });
    }
    throw error;
  }
});

module.exports = {
  createKssSession,
  listKssSessions,
  getKssSession,
  updateKssSession,
  previewMarkByToken,
  markByToken,
};
