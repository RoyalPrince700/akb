const HrAssessment = require("../models/HrAssessment");
const Result = require("../models/Result");
const asyncHandler = require("../utils/asyncHandler");
const { isPrivilegedRole } = require("../utils/contentLocks");
const {
  applyPublishFields,
  assertValidObjectId,
  courseIdForHrAssessment,
  idFromHrCourseId,
  normalizeQuestions,
  normalizeTitle,
  toHrAssessmentResponse,
  toPublicCard,
  toPublicQuestion,
} = require("../utils/hrAssessment");

const submissionCountMap = async (docs) => {
  const courseIds = docs.map((doc) => courseIdForHrAssessment(doc._id));

  if (!courseIds.length) {
    return new Map();
  }

  const rows = await Result.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    { $group: { _id: "$courseId", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [row._id, row.count]));
};

const loadOwned = async (id) => {
  assertValidObjectId(id);
  const doc = await HrAssessment.findById(id);

  if (!doc) {
    const error = new Error("Assessment not found");
    error.statusCode = 404;
    throw error;
  }

  return doc;
};

const listPublishedHrAssessments = asyncHandler(async (req, res) => {
  const docs = await HrAssessment.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  res.json({
    assessments: docs.map(toPublicCard),
  });
});

const listHrAssessments = asyncHandler(async (req, res) => {
  const docs = await HrAssessment.find()
    .sort({ updatedAt: -1 })
    .lean();
  const counts = await submissionCountMap(docs);

  res.json({
    assessments: docs.map((doc) =>
      toHrAssessmentResponse(
        doc,
        counts.get(courseIdForHrAssessment(doc._id)) || 0
      )
    ),
  });
});

const getHrAssessment = asyncHandler(async (req, res) => {
  const doc = await loadOwned(req.params.id);
  const counts = await submissionCountMap([doc]);

  res.json({
    assessment: toHrAssessmentResponse(
      doc,
      counts.get(courseIdForHrAssessment(doc._id)) || 0
    ),
  });
});

const getHrAssessmentForTake = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id);
  const doc = await HrAssessment.findById(req.params.id).lean();

  if (!doc || doc.status !== "published") {
    res.status(404);
    throw new Error("Assessment not found");
  }

  const privileged = isPrivilegedRole(req.user?.role);
  const hideQuestions = Boolean(doc.locked) && !privileged;

  res.json({
    assessment: {
      ...toPublicCard(doc),
      questions: hideQuestions ? [] : doc.questions.map(toPublicQuestion),
    },
  });
});

const createHrAssessment = asyncHandler(async (req, res) => {
  const title = normalizeTitle(req.body?.title);
  const questions = normalizeQuestions(req.body?.questions || []);
  const publish = Boolean(req.body?.publish);

  const doc = new HrAssessment({
    title,
    questions,
    createdBy: req.user._id,
    status: "draft",
    locked: false,
  });

  if (publish) {
    applyPublishFields(doc);
  }

  await doc.save();

  res.status(201).json({
    message: publish
      ? "Assessment published. Staff can see it on the assessments page."
      : "Draft saved.",
    assessment: toHrAssessmentResponse(doc, 0),
  });
});

const updateHrAssessment = asyncHandler(async (req, res) => {
  const doc = await loadOwned(req.params.id);

  if (doc.status !== "draft") {
    res.status(400);
    throw new Error(
      "Published assessments cannot be edited. Lock or unlock them instead."
    );
  }

  if (req.body?.title != null) {
    doc.title = normalizeTitle(req.body.title);
  }

  if (req.body?.questions != null) {
    doc.questions = normalizeQuestions(req.body.questions);
  }

  await doc.save();
  const counts = await submissionCountMap([doc]);

  res.json({
    message: "Draft saved.",
    assessment: toHrAssessmentResponse(
      doc,
      counts.get(courseIdForHrAssessment(doc._id)) || 0
    ),
  });
});

const publishHrAssessment = asyncHandler(async (req, res) => {
  const doc = await loadOwned(req.params.id);

  if (doc.status === "published") {
    res.status(400);
    throw new Error("This assessment is already published");
  }

  if (req.body?.title != null) {
    doc.title = normalizeTitle(req.body.title);
  }

  if (req.body?.questions != null) {
    doc.questions = normalizeQuestions(req.body.questions);
  }

  applyPublishFields(doc);
  doc.locked = false;
  await doc.save();

  res.json({
    message: "Assessment published. Staff can see it on the assessments page.",
    assessment: toHrAssessmentResponse(doc, 0),
  });
});

const setHrAssessmentAccess = asyncHandler(async (req, res) => {
  const doc = await loadOwned(req.params.id);

  if (doc.status !== "published") {
    res.status(400);
    throw new Error("Publish the assessment before locking it");
  }

  if (typeof req.body?.locked !== "boolean") {
    res.status(400);
    throw new Error("Provide locked as true or false");
  }

  doc.locked = req.body.locked;
  await doc.save();
  const counts = await submissionCountMap([doc]);

  res.json({
    message: doc.locked
      ? "Assessment locked. Staff cannot take it until you unlock it."
      : "Assessment unlocked. Staff can take it.",
    assessment: toHrAssessmentResponse(
      doc,
      counts.get(courseIdForHrAssessment(doc._id)) || 0
    ),
  });
});

const deleteHrAssessment = asyncHandler(async (req, res) => {
  const doc = await loadOwned(req.params.id);

  if (doc.status !== "draft") {
    res.status(400);
    throw new Error(
      "Published assessments stay on record. Lock them to stop new attempts."
    );
  }

  await doc.deleteOne();

  res.json({ message: "Draft deleted." });
});

module.exports = {
  createHrAssessment,
  deleteHrAssessment,
  getHrAssessment,
  getHrAssessmentForTake,
  listHrAssessments,
  listPublishedHrAssessments,
  publishHrAssessment,
  setHrAssessmentAccess,
  updateHrAssessment,
};
