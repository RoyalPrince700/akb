const PaGroup = require("../models/PaGroup");
const PaPointAward = require("../models/PaPointAward");
const PaProgress = require("../models/PaProgress");
const User = require("../models/User");
const { uploadBuffer, hasCloudinaryConfig } = require("../config/cloudinary");
const {
  GROUP_KEYS,
  MAX_MEMBERS_PER_GROUP,
  groupNameForKey,
} = require("../constants/projectAdvance");
const asyncHandler = require("../utils/asyncHandler");

let seedPromise = null;

const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isAdminUser = (user) => user?.role === "admin";
const isMonitorRole = (user) => user?.role === "admin" || user?.role === "hr";

const serializeMember = (member) => ({
  user: member.user?._id || member.user,
  name: member.name,
  department: member.department || "",
  position: member.position || "",
  joinedAt: member.joinedAt,
  isTeamLead: Boolean(member.isTeamLead),
});

const buildMemberFromUser = (user, { isTeamLead = false } = {}) => ({
  user: user._id,
  name: user.name,
  department: user.department || "",
  position: user.position || "",
  joinedAt: new Date(),
  isTeamLead: Boolean(isTeamLead),
});

const getAssignedUserIds = async () => {
  const groups = await PaGroup.find().select("members.user");
  const ids = new Set();

  for (const group of groups) {
    for (const member of group.members || []) {
      const userId = member?.user?._id || member?.user;
      if (userId) {
        ids.add(String(userId));
      }
    }
  }

  return ids;
};

const loadAssignableStaff = async () => {
  const assignedIds = await getAssignedUserIds();
  const staff = await User.find({
    role: "staff",
    isActive: true,
  })
    .select("name department position staffId")
    .sort({ name: 1 });

  return staff
    .filter((user) => !assignedIds.has(String(user._id)))
    .map((user) => ({
      _id: user._id,
      name: user.name,
      department: user.department || "",
      position: user.position || "",
      staffId: user.staffId || "",
    }));
};

const addUserToGroup = async (group, user, { isTeamLead = false } = {}) => {
  if (group.members.length >= MAX_MEMBERS_PER_GROUP) {
    throw httpError(
      400,
      `${group.name} is full (maximum ${MAX_MEMBERS_PER_GROUP} staff)`
    );
  }

  const alreadyInGroup = group.members.some(
    (member) => String(member.user) === String(user._id)
  );
  if (alreadyInGroup) {
    throw httpError(400, `${user.name} is already in ${group.name}`);
  }

  if (isTeamLead) {
    group.members.forEach((member) => {
      member.isTeamLead = false;
    });
  }

  group.members.push(buildMemberFromUser(user, { isTeamLead }));
  await group.save();
  return group;
};

const serializeProgress = (item) => {
  const doc = item.toObject ? item.toObject() : item;

  return {
    _id: doc._id,
    group: doc.group?._id || doc.group,
    groupKey: doc.group?.key,
    groupName: doc.group?.name,
    author: doc.author?._id || doc.author,
    authorName: doc.authorName,
    body: doc.body,
    receiptUrl: doc.receiptUrl || null,
    receiptStatus: doc.receiptStatus || "none",
    reviewedBy: doc.reviewedBy?._id || doc.reviewedBy || null,
    reviewedByName: doc.reviewedByName || "",
    reviewedAt: doc.reviewedAt || null,
    reviewNote: doc.reviewNote || "",
    pointsAwarded: doc.pointsAwarded || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const serializePointAward = (item) => {
  const doc = item.toObject ? item.toObject() : item;

  return {
    _id: doc._id,
    group: doc.group?._id || doc.group,
    groupKey: doc.group?.key,
    groupName: doc.group?.name,
    points: doc.points,
    note: doc.note || "",
    progress: doc.progress?._id || doc.progress || null,
    awardedBy: doc.awardedBy?._id || doc.awardedBy,
    awardedByName: doc.awardedByName,
    createdAt: doc.createdAt,
  };
};

const summarizeGroup = (group, updates = [], pointAwards = []) => ({
  _id: group._id,
  key: group.key,
  name: group.name,
  headcount: group.members.length,
  totalPoints: group.totalPoints || 0,
  isFull: group.members.length >= MAX_MEMBERS_PER_GROUP,
  members: group.members.map(serializeMember),
  updates: updates.map(serializeProgress),
  pointAwards: pointAwards.map(serializePointAward),
});

const isLinkedMember = (member) => {
  const userId = member?.user?._id || member?.user;
  return Boolean(userId);
};

const ensureGroupsSeeded = async () => {
  if (!seedPromise) {
    seedPromise = (async () => {
      // One-time wipe of allocation-sheet / demo members from the old PA setup.
      await PaGroup.collection.updateMany(
        { membersReset: { $ne: "self-join-v1" } },
        { $set: { members: [], membersReset: "self-join-v1" } }
      );

      for (const key of GROUP_KEYS) {
        let group = await PaGroup.findOneAndUpdate(
          { key },
          {
            $setOnInsert: {
              name: groupNameForKey(key),
              members: [],
              totalPoints: 0,
              membersReset: "self-join-v1",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (group.name !== groupNameForKey(key)) {
          group.name = groupNameForKey(key);
        }

        if (typeof group.totalPoints !== "number") {
          group.totalPoints = 0;
        }

        const linkedMembers = (group.members || []).filter(isLinkedMember);

        if (linkedMembers.length !== (group.members || []).length) {
          group.members = linkedMembers;
        }

        if (group.isModified()) {
          await group.save();
        }
      }
    })().finally(() => {
      seedPromise = null;
    });
  }

  await seedPromise;
};

const findGroupForUser = async (userId) => {
  await ensureGroupsSeeded();
  return PaGroup.findOne({ "members.user": userId });
};

const loadUpdatesForGroup = async (groupId, limit = 100) =>
  PaProgress.find({ group: groupId }).sort({ createdAt: -1 }).limit(limit);

const loadPointAwardsForGroup = async (groupId, limit = 50) =>
  PaPointAward.find({ group: groupId }).sort({ createdAt: -1 }).limit(limit);

const getMyWorkspace = asyncHandler(async (req, res) => {
  await ensureGroupsSeeded();

  const groups = await PaGroup.find().sort({ key: 1 });
  const myGroup = groups.find((group) =>
    group.members.some((member) => String(member.user) === String(req.user._id))
  );

  let updates = [];
  let pointAwards = [];
  if (myGroup) {
    [updates, pointAwards] = await Promise.all([
      loadUpdatesForGroup(myGroup._id),
      loadPointAwardsForGroup(myGroup._id),
    ]);
  }

  res.json({
    maxMembers: MAX_MEMBERS_PER_GROUP,
    myGroup: myGroup ? summarizeGroup(myGroup, updates, pointAwards) : null,
    groups: groups.map((group) => ({
      _id: group._id,
      key: group.key,
      name: group.name,
      isFull: group.members.length >= MAX_MEMBERS_PER_GROUP,
    })),
  });
});

const joinGroup = asyncHandler(async (req, res) => {
  await ensureGroupsSeeded();

  const groupKey = String(req.body.groupKey || "")
    .trim()
    .toUpperCase();

  if (!GROUP_KEYS.includes(groupKey)) {
    throw httpError(400, "Select a valid group from A to M");
  }

  const existing = await findGroupForUser(req.user._id);
  if (existing) {
    throw httpError(
      400,
      `You already joined ${existing.name}. You can only belong to one group.`
    );
  }

  const group = await PaGroup.findOne({ key: groupKey });
  if (!group) {
    throw httpError(404, "Group not found");
  }

  await addUserToGroup(group, req.user);

  res.status(201).json({
    message: `You joined ${group.name}`,
    myGroup: summarizeGroup(group, [], []),
  });
});

const assignGroupMember = asyncHandler(async (req, res) => {
  if (!isMonitorRole(req.user)) {
    throw httpError(403, "Only HR and admin can assign staff to a group");
  }

  await ensureGroupsSeeded();

  const groupId = String(req.params.groupId || "").trim();
  const userId = String(req.body.userId || "").trim();
  const makeTeamLead = Boolean(req.body.isTeamLead);

  if (!groupId || !userId) {
    throw httpError(400, "Group and staff member are required");
  }

  const group = await PaGroup.findById(groupId);
  if (!group) {
    throw httpError(404, "Group not found");
  }

  const staffMember = await User.findById(userId).select(
    "name department position role isActive"
  );
  if (!staffMember || !staffMember.isActive) {
    throw httpError(404, "Staff member not found or inactive");
  }

  if (staffMember.role !== "staff") {
    throw httpError(400, "Only staff accounts can be assigned to a Project ADVANCE group");
  }

  const existing = await findGroupForUser(staffMember._id);
  if (existing) {
    throw httpError(
      400,
      `${staffMember.name} already belongs to ${existing.name}. Remove them first if they need to move.`
    );
  }

  await addUserToGroup(group, staffMember, { isTeamLead: makeTeamLead });

  const [updates, pointAwards] = await Promise.all([
    loadUpdatesForGroup(group._id),
    loadPointAwardsForGroup(group._id),
  ]);

  res.status(201).json({
    message: makeTeamLead
      ? `${staffMember.name} was assigned to ${group.name} as team lead`
      : `${staffMember.name} was assigned to ${group.name}`,
    group: summarizeGroup(group, updates, pointAwards),
  });
});

const setGroupTeamLead = asyncHandler(async (req, res) => {
  if (!isMonitorRole(req.user)) {
    throw httpError(403, "Only HR and admin can set a group team lead");
  }

  await ensureGroupsSeeded();

  const groupId = String(req.params.groupId || "").trim();
  const userId = String(req.params.userId || "").trim();
  const isTeamLead =
    req.body.isTeamLead === undefined ? true : Boolean(req.body.isTeamLead);

  if (!groupId || !userId) {
    throw httpError(400, "Group and staff member are required");
  }

  const group = await PaGroup.findById(groupId);
  if (!group) {
    throw httpError(404, "Group not found");
  }

  const member = group.members.find(
    (entry) => String(entry.user) === String(userId)
  );

  if (!member) {
    throw httpError(404, "That staff member is not in this group");
  }

  group.members.forEach((entry) => {
    entry.isTeamLead = false;
  });

  if (isTeamLead) {
    member.isTeamLead = true;
  }

  await group.save();

  const [updates, pointAwards] = await Promise.all([
    loadUpdatesForGroup(group._id),
    loadPointAwardsForGroup(group._id),
  ]);

  res.json({
    message: isTeamLead
      ? `${member.name} is now the team lead for ${group.name}`
      : `${member.name} is no longer the team lead for ${group.name}`,
    group: summarizeGroup(group, updates, pointAwards),
  });
});

const createProgress = asyncHandler(async (req, res) => {
  const body = String(req.body.body || "").trim();

  if (!body) {
    throw httpError(400, "Write a progress update before posting");
  }

  if (body.length > 2000) {
    throw httpError(400, "Progress update must be 2000 characters or fewer");
  }

  const group = await findGroupForUser(req.user._id);
  if (!group) {
    throw httpError(400, "Join a Project ADVANCE group before posting progress");
  }

  const payload = {
    group: group._id,
    author: req.user._id,
    authorName: req.user.name,
    body,
    receiptStatus: "none",
  };

  if (req.file) {
    if (!hasCloudinaryConfig) {
      throw httpError(
        503,
        "Receipt upload is temporarily unavailable. Post progress without a receipt, or try again later."
      );
    }

    try {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: "akb/pa-receipts",
        public_id: `pa_receipt_${group.key}_${req.user._id}_${Date.now()}`,
      });

      payload.receiptUrl = upload.secure_url || upload.url;
      payload.receiptPublicId = upload.public_id;
      payload.receiptStatus = "pending";
    } catch (uploadError) {
      throw httpError(
        uploadError.statusCode || 502,
        uploadError.message || "Could not upload receipt image"
      );
    }
  }

  const progress = await PaProgress.create(payload);

  res.status(201).json({
    message: payload.receiptStatus === "pending"
      ? "Progress posted with receipt. HR will review it before awarding points."
      : "Progress update posted.",
    update: serializeProgress(progress),
  });
});

const reviewProgressReceipt = asyncHandler(async (req, res) => {
  if (!isMonitorRole(req.user)) {
    throw httpError(403, "Only HR and admin can review payment receipts");
  }

  await ensureGroupsSeeded();

  const updateId = String(req.params.updateId || "").trim();
  const action = String(req.body.action || "").trim().toLowerCase();
  const note = String(req.body.note || "").trim();
  const points = Number(req.body.points);

  if (!updateId) {
    throw httpError(400, "Progress update is required");
  }

  if (!["approve", "reject"].includes(action)) {
    throw httpError(400, "Choose approve or reject");
  }

  if (note.length > 500) {
    throw httpError(400, "Review note must be 500 characters or fewer");
  }

  const progress = await PaProgress.findById(updateId);
  if (!progress) {
    throw httpError(404, "Progress update not found");
  }

  if (progress.receiptStatus !== "pending" || !progress.receiptUrl) {
    throw httpError(400, "This update does not have a receipt waiting for review");
  }

  const group = await PaGroup.findById(progress.group);
  if (!group) {
    throw httpError(404, "Group not found");
  }

  if (action === "reject") {
    progress.receiptStatus = "rejected";
    progress.reviewedBy = req.user._id;
    progress.reviewedByName = req.user.name;
    progress.reviewedAt = new Date();
    progress.reviewNote = note;
    await progress.save();

    res.json({
      message: `Receipt from ${progress.authorName} was rejected`,
      update: serializeProgress(progress),
    });
    return;
  }

  if (!Number.isFinite(points) || !Number.isInteger(points) || points <= 0) {
    throw httpError(
      400,
      "Enter a whole number of points greater than zero to approve this receipt"
    );
  }

  if (points > 100000) {
    throw httpError(400, "Points amount is too large");
  }

  const award = await PaPointAward.create({
    group: group._id,
    points,
    note:
      note ||
      `Approved receipt from ${progress.authorName}: ${progress.body.slice(0, 120)}`,
    awardedBy: req.user._id,
    awardedByName: req.user.name,
    progress: progress._id,
  });

  group.totalPoints = (group.totalPoints || 0) + points;
  await group.save();

  progress.receiptStatus = "approved";
  progress.reviewedBy = req.user._id;
  progress.reviewedByName = req.user.name;
  progress.reviewedAt = new Date();
  progress.reviewNote = note;
  progress.pointsAwarded = points;
  progress.pointAward = award._id;
  await progress.save();

  res.json({
    message: `Approved receipt from ${progress.authorName} and awarded ${points} points to ${group.name}`,
    update: serializeProgress(progress),
    award: serializePointAward(award),
    group: {
      _id: group._id,
      key: group.key,
      name: group.name,
      totalPoints: group.totalPoints,
      headcount: group.members.length,
    },
  });
});

const awardGroupPoints = asyncHandler(async (req, res) => {
  if (!isMonitorRole(req.user)) {
    throw httpError(403, "Only HR and admin can award Project ADVANCE points");
  }

  await ensureGroupsSeeded();

  const groupId = String(req.body.groupId || "").trim();
  const note = String(req.body.note || "").trim();
  const points = Number(req.body.points);
  const isAdmin = isAdminUser(req.user);

  if (!groupId) {
    throw httpError(400, "Select a group to award points");
  }

  if (!Number.isFinite(points) || !Number.isInteger(points) || points === 0) {
    throw httpError(400, "Enter a whole number of points other than zero");
  }

  if (!isAdmin && points < 0) {
    throw httpError(
      403,
      "Only an administrator can reduce group points. Ask admin to correct a mistaken award."
    );
  }

  if (Math.abs(points) > 100000) {
    throw httpError(400, "Points amount is too large");
  }

  if (note.length > 500) {
    throw httpError(400, "Note must be 500 characters or fewer");
  }

  const group = await PaGroup.findById(groupId);
  if (!group) {
    throw httpError(404, "Group not found");
  }

  const nextTotal = (group.totalPoints || 0) + points;
  if (nextTotal < 0) {
    throw httpError(
      400,
      `${group.name} only has ${group.totalPoints || 0} points. You cannot subtract more than that.`
    );
  }

  const award = await PaPointAward.create({
    group: group._id,
    points,
    note,
    awardedBy: req.user._id,
    awardedByName: req.user.name,
  });

  group.totalPoints = nextTotal;
  await group.save();

  res.status(201).json({
    message:
      points > 0
        ? `Awarded ${points} points to ${group.name}`
        : `Removed ${Math.abs(points)} points from ${group.name}`,
    award: serializePointAward(award),
    group: {
      _id: group._id,
      key: group.key,
      name: group.name,
      totalPoints: group.totalPoints,
      headcount: group.members.length,
    },
  });
});

const removeGroupMember = asyncHandler(async (req, res) => {
  if (!isAdminUser(req.user)) {
    throw httpError(403, "Only an administrator can remove staff from a group");
  }

  await ensureGroupsSeeded();

  const groupId = String(req.params.groupId || "").trim();
  const userId = String(req.params.userId || "").trim();

  if (!groupId || !userId) {
    throw httpError(400, "Group and staff member are required");
  }

  const group = await PaGroup.findById(groupId);
  if (!group) {
    throw httpError(404, "Group not found");
  }

  const member = group.members.find(
    (entry) => String(entry.user) === String(userId)
  );

  if (!member) {
    throw httpError(404, "That staff member is not in this group");
  }

  const memberName = member.name;
  group.members = group.members.filter(
    (entry) => String(entry.user) !== String(userId)
  );
  await group.save();

  res.json({
    message: `${memberName} was removed from ${group.name}. They can join another group.`,
    group: {
      _id: group._id,
      key: group.key,
      name: group.name,
      headcount: group.members.length,
      totalPoints: group.totalPoints || 0,
      members: group.members.map(serializeMember),
    },
  });
});

const getMonitor = asyncHandler(async (req, res) => {
  if (!isMonitorRole(req.user)) {
    throw httpError(403, "Only HR and admin can monitor Project ADVANCE groups");
  }

  await ensureGroupsSeeded();

  const groups = await PaGroup.find().sort({ key: 1 });
  const groupIds = groups.map((group) => group._id);

  const [updates, pointAwards] = await Promise.all([
    PaProgress.find({ group: { $in: groupIds } })
      .populate("group", "name key")
      .sort({ createdAt: -1 }),
    PaPointAward.find({ group: { $in: groupIds } })
      .populate("group", "name key")
      .sort({ createdAt: -1 }),
  ]);

  const selectedId = req.query.groupId ? String(req.query.groupId) : "";
  const selectedGroup =
    groups.find((group) => String(group._id) === selectedId) || groups[0] || null;

  const selectedUpdates = selectedGroup
    ? updates.filter(
        (item) => String(item.group?._id || item.group) === String(selectedGroup._id)
      )
    : [];
  const selectedAwards = selectedGroup
    ? pointAwards.filter(
        (item) => String(item.group?._id || item.group) === String(selectedGroup._id)
      )
    : [];

  res.json({
    maxMembers: MAX_MEMBERS_PER_GROUP,
    assignableStaff: await loadAssignableStaff(),
    groups: groups.map((group) => {
      const related = updates.filter(
        (item) => String(item.group?._id || item.group) === String(group._id)
      );
      const pendingReceipts = related.filter(
        (item) => item.receiptStatus === "pending" && item.receiptUrl
      );
      const teamLead = group.members.find((member) => member.isTeamLead);

      return {
        _id: group._id,
        key: group.key,
        name: group.name,
        headcount: group.members.length,
        totalPoints: group.totalPoints || 0,
        updateCount: related.length,
        pendingReceiptCount: pendingReceipts.length,
        latestUpdateAt: related[0]?.createdAt || null,
        teamLeadName: teamLead?.name || null,
      };
    }),
    selectedGroup: selectedGroup
      ? summarizeGroup(selectedGroup, selectedUpdates, selectedAwards)
      : null,
  });
});

module.exports = {
  assignGroupMember,
  awardGroupPoints,
  createProgress,
  getMonitor,
  getMyWorkspace,
  joinGroup,
  removeGroupMember,
  reviewProgressReceipt,
  setGroupTeamLead,
};
