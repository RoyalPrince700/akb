const PaGroup = require("../models/PaGroup");
const PaPointAward = require("../models/PaPointAward");
const PaProgress = require("../models/PaProgress");
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
});

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

  if (group.members.length >= MAX_MEMBERS_PER_GROUP) {
    throw httpError(400, `${group.name} is full (maximum ${MAX_MEMBERS_PER_GROUP} staff)`);
  }

  group.members.push({
    user: req.user._id,
    name: req.user.name,
    department: req.user.department || "",
    position: req.user.position || "",
    joinedAt: new Date(),
  });
  await group.save();

  res.status(201).json({
    message: `You joined ${group.name}`,
    myGroup: summarizeGroup(group, [], []),
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

  const progress = await PaProgress.create({
    group: group._id,
    author: req.user._id,
    authorName: req.user.name,
    body,
  });

  res.status(201).json({ update: serializeProgress(progress) });
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
    groups: groups.map((group) => {
      const related = updates.filter(
        (item) => String(item.group?._id || item.group) === String(group._id)
      );

      return {
        _id: group._id,
        key: group.key,
        name: group.name,
        headcount: group.members.length,
        totalPoints: group.totalPoints || 0,
        updateCount: related.length,
        latestUpdateAt: related[0]?.createdAt || null,
      };
    }),
    selectedGroup: selectedGroup
      ? summarizeGroup(selectedGroup, selectedUpdates, selectedAwards)
      : null,
  });
});

module.exports = {
  awardGroupPoints,
  createProgress,
  getMonitor,
  getMyWorkspace,
  joinGroup,
  removeGroupMember,
};
