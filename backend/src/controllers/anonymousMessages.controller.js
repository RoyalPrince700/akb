const AnonymousMessage = require("../models/AnonymousMessage");
const AnonymousMessageSession = require("../models/AnonymousMessageSession");
const asyncHandler = require("../utils/asyncHandler");

const publicPathForToken = (token) => `/anonymous-message/${token}`;

const absolutePublicUrl = (token) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
  return `${clientUrl}${publicPathForToken(token)}`;
};

const sessionResponse = (session, extras = {}) => {
  const base =
    typeof session.toPublicObject === "function"
      ? session.toPublicObject()
      : {
          id: session._id,
          _id: session._id,
          title: session.title,
          token: session.token,
          isActive: session.isActive,
          createdBy: session.createdBy,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };

  return {
    ...base,
    sharePath: publicPathForToken(base.token),
    shareUrl: absolutePublicUrl(base.token),
    ...extras,
  };
};

const createSession = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    res.status(400);
    throw new Error("Title is required");
  }

  const session = await AnonymousMessageSession.create({
    title,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: "Anonymous message link created",
    session: sessionResponse(session, { messageCount: 0 }),
  });
});

const listSessions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;

  const [sessions, total] = await Promise.all([
    AnonymousMessageSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AnonymousMessageSession.countDocuments(filter),
  ]);

  const sessionIds = sessions.map((s) => s._id);
  const counts = await AnonymousMessage.aggregate([
    { $match: { session: { $in: sessionIds } } },
    { $group: { _id: "$session", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  res.json({
    sessions: sessions.map((session) =>
      sessionResponse(session, {
        messageCount: countMap.get(String(session._id)) || 0,
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

const getSession = asyncHandler(async (req, res) => {
  const session = await AnonymousMessageSession.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error("Anonymous message session not found");
  }

  const messages = await AnonymousMessage.find({ session: session._id })
    .sort({ submittedAt: -1 })
    .lean();

  res.json({
    session: sessionResponse(session, {
      messageCount: messages.length,
    }),
    messages: messages.map((entry) => ({
      id: entry._id,
      _id: entry._id,
      message: entry.message,
      submittedAt: entry.submittedAt,
    })),
  });
});

const updateSession = asyncHandler(async (req, res) => {
  const session = await AnonymousMessageSession.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error("Anonymous message session not found");
  }

  if (typeof req.body.isActive === "boolean") {
    session.isActive = req.body.isActive;
  } else if (req.body.isActive === "true" || req.body.isActive === "false") {
    session.isActive = req.body.isActive === "true";
  } else {
    res.status(400);
    throw new Error(
      "Provide isActive (true or false) to close or reopen the link"
    );
  }

  await session.save();

  const messageCount = await AnonymousMessage.countDocuments({
    session: session._id,
  });

  res.json({
    message: session.isActive
      ? "Anonymous message link reopened"
      : "Anonymous message link closed",
    session: sessionResponse(session, { messageCount }),
  });
});

const previewByToken = asyncHandler(async (req, res) => {
  const session = await AnonymousMessageSession.findOne({
    token: req.params.token,
  });
  if (!session) {
    res.status(404);
    throw new Error("Invalid or expired anonymous message link");
  }

  res.json({
    session: {
      title: session.title,
      isActive: session.isActive,
    },
  });
});

const submitByToken = asyncHandler(async (req, res) => {
  const session = await AnonymousMessageSession.findOne({
    token: req.params.token,
  });
  if (!session) {
    res.status(404);
    throw new Error("Invalid or expired anonymous message link");
  }

  if (!session.isActive) {
    res.status(400);
    throw new Error(
      "This anonymous message link is closed. Contact HR if you need help."
    );
  }

  const message = String(req.body.message || "").trim();
  if (!message) {
    res.status(400);
    throw new Error("Message is required");
  }

  const entry = await AnonymousMessage.create({
    session: session._id,
    message,
    submittedAt: new Date(),
  });

  res.status(201).json({
    message: "Message submitted",
    submission: {
      submittedAt: entry.submittedAt,
    },
  });
});

module.exports = {
  createSession,
  listSessions,
  getSession,
  updateSession,
  previewByToken,
  submitByToken,
};
