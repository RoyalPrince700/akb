const mongoose = require("mongoose");

const DailyTodo = require("../models/DailyTodo");
const Notification = require("../models/Notification");
const Task = require("../models/Task");
const {
  MAX_COMPLETION_ATTACHMENTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} = require("../models/Task");
const {
  deliveryUrlForAttachment,
  extensionForUpload,
  hasCloudinaryConfig,
  uploadBuffer,
} = require("../config/cloudinary");
const User = require("../models/User");
const { sendTaskAssignedEmails, sendTaskDoneEmails } = require("../mailtrap/email");
const { emitToUsers } = require("../realtime/io");
const asyncHandler = require("../utils/asyncHandler");

const PEOPLE_FIELDS = "name department position role avatar";

const STATUS_LABELS = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const lagosDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const formatDueDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const parseDueDate = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const error = new Error("Due date must be a valid date");
    error.statusCode = 400;
    throw error;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    const error = new Error("Due date must be a valid date");
    error.statusCode = 400;
    throw error;
  }

  return date;
};

const uniqueIds = (ids) => {
  const list = Array.isArray(ids) ? ids : [];
  const seen = new Set();
  const result = [];

  list.forEach((id) => {
    const value = idOf(id).trim();
    if (!mongoose.Types.ObjectId.isValid(value) || seen.has(value)) {
      return;
    }
    seen.add(value);
    result.push(value);
  });

  return result;
};

const idOf = (value) => {
  if (value == null || value === "") {
    return "";
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value.toHexString === "function") {
    return value.toHexString();
  }
  if (value._id != null && value._id !== value) {
    return idOf(value._id);
  }
  const text = typeof value.toString === "function" ? value.toString() : "";
  return text === "[object Object]" ? "" : text;
};

const sameId = (left, right) => {
  const leftId = idOf(left);
  const rightId = idOf(right);
  return Boolean(leftId) && leftId === rightId;
};

const memberIds = (task) =>
  uniqueIds([task?.createdBy, task?.owner, ...(task?.assignees || [])]);

const isOnTask = (task, userId) =>
  sameId(task.createdBy, userId) ||
  sameId(task.owner, userId) ||
  (task.assignees || []).some((person) => sameId(person, userId));

const isOwnerOrCreator = (task, userId) =>
  sameId(task.createdBy, userId) || sameId(task.owner, userId);

const assertAssignablePeople = async (res, ids, alreadyOnTask = []) => {
  if (!ids.length) {
    return [];
  }

  const kept = new Set(alreadyOnTask.map((id) => String(id)));
  const people = await User.find({ _id: { $in: ids } }).select("name isActive");

  if (people.length !== ids.length) {
    fail(res, 400, "One or more selected staff are not available");
  }

  const blocked = people.some(
    (person) => !person.isActive && !kept.has(String(person._id))
  );

  if (blocked) {
    fail(res, 400, "One or more selected staff are not available");
  }

  return people;
};

const toDate = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const inferStatusHistory = (plain) => {
  if (Array.isArray(plain.statusHistory) && plain.statusHistory.length) {
    return plain.statusHistory;
  }

  return (plain.activity || [])
    .map((entry) => {
      const match = String(entry.message || "").match(/^Moved this task to (.+)$/i);
      if (!match) {
        return null;
      }
      const label = match[1].trim().toLowerCase();
      const status = Object.keys(STATUS_LABELS).find(
        (key) => STATUS_LABELS[key].toLowerCase() === label
      );
      if (!status) {
        return null;
      }
      return {
        status,
        actor: entry.actor,
        createdAt: entry.createdAt,
      };
    })
    .filter(Boolean);
};

const serializeTask = (task) => {
  const plain = typeof task.toObject === "function" ? task.toObject() : { ...task };
  const statusHistory = inferStatusHistory(plain);
  const createdAt = toDate(plain.createdAt);
  const statusChangedAt =
    toDate(plain.statusChangedAt) ||
    toDate(statusHistory[statusHistory.length - 1]?.createdAt);

  let completedAt = plain.status === "done" ? toDate(plain.completedAt) : null;
  if (plain.status === "done" && !completedAt) {
    const doneChange = [...statusHistory].reverse().find((entry) => entry.status === "done");
    completedAt = toDate(doneChange?.createdAt);
    if (!completedAt) {
      const created = (plain.activity || []).find((entry) => entry.action === "created");
      completedAt = toDate(created?.createdAt) || createdAt;
    }
  }

  const durationMs =
    createdAt && completedAt
      ? Math.max(0, completedAt.getTime() - createdAt.getTime())
      : null;

  const completionAttachments = (plain.completionAttachments || []).map((item) => {
    const originalName = item.originalName || "";
    const mimeType = item.mimeType || "";
    const resourceType = item.resourceType || (String(mimeType).startsWith("image/") ? "image" : "raw");
    const url =
      deliveryUrlForAttachment({
        publicId: item.publicId,
        resourceType,
        originalName,
        mimeType,
        fallbackUrl: item.url,
      }) || item.url;

    return {
      ...item,
      resourceType,
      url,
    };
  });

  return {
    ...plain,
    dueDate: formatDueDate(plain.dueDate),
    boardDate: formatDueDate(plain.boardDate) || lagosDateKey(plain.createdAt || new Date()),
    createdAt,
    statusHistory,
    statusChangedAt,
    completedAt,
    durationMs,
    completionAttachments,
  };
};

const loadTask = (id) =>
  Task.findById(id)
    .populate("owner", PEOPLE_FIELDS)
    .populate("assignees", PEOPLE_FIELDS)
    .populate("createdBy", PEOPLE_FIELDS)
    .populate("activity.actor", "name avatar")
    .populate("statusHistory.actor", "name avatar")
    .populate("chat.author", PEOPLE_FIELDS)
    .populate("completionAttachments.uploadedBy", PEOPLE_FIELDS);

const pushActivity = (task, actorId, message, action = "updated") => {
  task.activity.push({ actor: actorId, action, message });
  if (task.activity.length > 40) {
    task.activity = task.activity.slice(-40);
  }
};

const actorName = (user) => String(user?.name || "Someone").trim() || "Someone";

const clientBaseUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const formatDueLabel = (value) => {
  const key = formatDueDate(value);
  if (!key) {
    return "";
  }

  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const emailTaskPeople = async ({ recipientIds, actor, task, kind }) => {
  const actorId = String(actor?._id || actor || "");
  const ids = uniqueIds(recipientIds).filter((id) => id !== actorId);

  if (!ids.length) {
    return;
  }

  try {
    const recipients = await User.find({ _id: { $in: ids } })
      .select("name email")
      .lean();
    const details = {
      actorName: actorName(actor),
      title: task.title,
      description: String(task.description || "").slice(0, 500),
      priorityLabel: PRIORITY_LABELS[task.priority] || "",
      dueDateLabel: formatDueLabel(task.dueDate),
      taskUrl: `${clientBaseUrl()}/taskboard?task=${task._id}`,
    };

    if (kind === "done") {
      await sendTaskDoneEmails({ recipients, ...details });
      return;
    }

    await sendTaskAssignedEmails({ recipients, ...details });
  } catch (error) {
    console.error("Task email failed:", error.message);
  }
};

const notifyUsers = async ({ recipientIds, actor, task, type, message }) => {
  const actorId = String(actor?._id || actor || "");
  const ids = [
    ...new Set((recipientIds || []).map((id) => String(id?._id || id || ""))),
  ].filter((id) => mongoose.Types.ObjectId.isValid(id) && id !== actorId);

  if (!ids.length || !message) {
    return;
  }

  try {
    const created = await Notification.insertMany(
      ids.map((recipient) => ({
        recipient,
        actor: actorId || undefined,
        task: task?._id,
        type,
        message: String(message).slice(0, 280),
      }))
    );
    const populated = await Notification.find({
      _id: { $in: created.map((entry) => entry._id) },
    })
      .populate("actor", "name avatar")
      .lean();

    await Promise.all(
      populated.map(async (notification) => {
        const unreadCount = await Notification.countDocuments({
          recipient: notification.recipient,
          readAt: null,
        });
        emitToUsers([notification.recipient], "notification:new", {
          notification: {
            ...notification,
            _id: String(notification._id),
            recipient: String(notification.recipient),
            task: notification.task ? String(notification.task) : null,
          },
          unreadCount,
        });
      })
    );
  } catch (error) {
    console.error("Task notification failed:", error.message);
  }
};

const listDirectory = asyncHandler(async (req, res) => {
  const people = await User.find({ isActive: true })
    .select(PEOPLE_FIELDS)
    .sort({ name: 1 })
    .lean();

  res.json({ people });
});

const publishTask = (task, userIds) => {
  emitToUsers(userIds, "task:upsert", {
    task: serializeTask(task),
  });
};

const listTasks = asyncHandler(async (req, res) => {
  const filter = {
    $or: [
      { owner: req.user._id },
      { assignees: req.user._id },
      { createdBy: req.user._id },
    ],
  };

  if (TASK_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const search = String(req.query.q || "").trim();
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$and = [{ $or: [{ title: pattern }, { description: pattern }] }];
  }

  const tasks = await Task.find(filter)
    .sort({ updatedAt: -1 })
    .limit(300)
    .populate("owner", PEOPLE_FIELDS)
    .populate("assignees", PEOPLE_FIELDS)
    .populate("createdBy", PEOPLE_FIELDS)
    .populate("activity.actor", "name avatar")
    .populate("statusHistory.actor", "name avatar")
    .populate("chat.author", PEOPLE_FIELDS)
    .populate("completionAttachments.uploadedBy", PEOPLE_FIELDS);

  res.json({ tasks: tasks.map(serializeTask) });
});

const createTask = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  if (!title) {
    fail(res, 400, "Task title is required");
  }

  const description = String(req.body.description || "").trim();
  const status = TASK_STATUSES.includes(req.body.status) ? req.body.status : "todo";
  const priority = TASK_PRIORITIES.includes(req.body.priority)
    ? req.body.priority
    : "medium";
  const dueDate = parseDueDate(req.body.dueDate);
  const ownerId = String(req.body.owner || req.user._id);

  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    fail(res, 400, "Choose a valid task owner");
  }

  const assigneeIds = uniqueIds([ownerId, ...(req.body.assignees || [])]);
  await assertAssignablePeople(res, assigneeIds);

  const openedAt = new Date();
  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    boardDate: parseDueDate(lagosDateKey()),
    owner: ownerId,
    assignees: assigneeIds,
    createdBy: req.user._id,
    createdAt: openedAt,
    statusChangedAt: openedAt,
    completedAt: status === "done" ? openedAt : null,
    statusHistory: [
      {
        status,
        actor: req.user._id,
        createdAt: openedAt,
      },
    ],
    activity: [
      {
        actor: req.user._id,
        action: "created",
        message: "Created this task",
      },
    ],
  });

  const assignedIds = uniqueIds([ownerId, ...assigneeIds]);
  await notifyUsers({
    recipientIds: assignedIds,
    actor: req.user,
    task,
    type: "assigned",
    message: `${actorName(req.user)} assigned you to "${title}".`,
  });
  await emailTaskPeople({
    recipientIds: assignedIds,
    actor: req.user,
    task,
    kind: "assigned",
  });

  if (status === "done") {
    await emailTaskPeople({
      recipientIds: uniqueIds([req.user._id, ...assignedIds]),
      actor: req.user,
      task,
      kind: "done",
    });
  }

  const populated = await loadTask(task._id);
  publishTask(populated, memberIds(populated));
  res.status(201).json({
    message: "Task created",
    task: serializeTask(populated),
  });
});

const updateTask = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Task not found");
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    fail(res, 404, "Task not found");
  }

  if (!isOnTask(task, req.user._id)) {
    fail(res, 403, "Only people on this task can update it");
  }

  const manager = isOwnerOrCreator(task, req.user._id);
  const body = req.body || {};
  const keys = Object.keys(body);
  const assigneeKeys = new Set(["status", "boardDate"]);

  if (!manager && keys.some((key) => !assigneeKeys.has(key))) {
    fail(
      res,
      403,
      "Only the owner or the person who created the task can change these details"
    );
  }

  const notes = [];
  const previouslyInvolved = new Set(
    [task.createdBy, task.owner, ...(task.assignees || [])].map((id) =>
      String(id?._id || id || "")
    )
  );
  let statusChangedTo = "";

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = String(body.title || "").trim();
    if (!title) {
      fail(res, 400, "Task title is required");
    }
    if (title !== task.title) {
      task.title = title;
      notes.push("Updated the title");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    const description = String(body.description || "").trim();
    if (description !== (task.description || "")) {
      task.description = description;
      notes.push("Updated the description");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "priority")) {
    if (!TASK_PRIORITIES.includes(body.priority)) {
      fail(res, 400, "Choose a valid priority");
    }
    if (body.priority !== task.priority) {
      task.priority = body.priority;
      notes.push(`Set priority to ${PRIORITY_LABELS[body.priority]}`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "dueDate")) {
    const nextDue = parseDueDate(body.dueDate);
    const previousKey = formatDueDate(task.dueDate);
    const nextKey = formatDueDate(nextDue);
    if (previousKey !== nextKey) {
      task.dueDate = nextDue;
      notes.push(nextDue ? "Changed the due date" : "Cleared the due date");
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "boardDate")) {
    const nextBoard = parseDueDate(body.boardDate);
    if (!nextBoard) {
      fail(res, 400, "Choose a valid day for this task");
    }
    const previousKey = formatDueDate(task.boardDate) || lagosDateKey(task.createdAt);
    const nextKey = formatDueDate(nextBoard);
    if (previousKey !== nextKey) {
      task.boardDate = nextBoard;
      notes.push(
        nextKey === lagosDateKey() ? "Moved this task to today" : "Moved this task to another day"
      );
    }
  }

  if (
    manager &&
    (Object.prototype.hasOwnProperty.call(body, "owner") ||
      Object.prototype.hasOwnProperty.call(body, "assignees"))
  ) {
    const nextOwner = String(body.owner || task.owner);
    if (!mongoose.Types.ObjectId.isValid(nextOwner)) {
      fail(res, 400, "Choose a valid task owner");
    }

    const nextAssignees = uniqueIds([
      nextOwner,
      ...(Object.prototype.hasOwnProperty.call(body, "assignees")
        ? body.assignees || []
        : task.assignees),
    ]);
    const people = await assertAssignablePeople(res, nextAssignees, [
      task.owner,
      ...task.assignees,
    ]);
    const nameById = new Map(people.map((person) => [String(person._id), person.name]));
    const previousOwner = String(task.owner);
    const previousAssignees = task.assignees.map((id) => String(id)).sort().join(",");
    const nextAssigneeKey = [...nextAssignees].sort().join(",");

    if (previousOwner !== nextOwner) {
      task.owner = nextOwner;
      notes.push(`Set ${nameById.get(nextOwner) || "a teammate"} as the owner`);
    }

    if (previousAssignees !== nextAssigneeKey) {
      task.assignees = nextAssignees;
      notes.push("Updated who is working on this task");
    }
  }

  const detailsChanged = notes.length > 0;

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    if (!TASK_STATUSES.includes(body.status)) {
      fail(res, 400, "Choose a valid status");
    }
    if (body.status !== task.status) {
      const changedAt = new Date();
      task.status = body.status;
      task.statusChangedAt = changedAt;
      task.completedAt = body.status === "done" ? changedAt : null;
      if (!Array.isArray(task.statusHistory)) {
        task.statusHistory = [];
      }
      task.statusHistory.push({
        status: body.status,
        actor: req.user._id,
        createdAt: changedAt,
      });
      statusChangedTo = STATUS_LABELS[body.status];
      notes.push(`Moved this task to ${statusChangedTo}`);
    }
  }

  notes.forEach((message) => pushActivity(task, req.user._id, message));
  await task.save();

  const involvedNow = uniqueIds([task.createdBy, task.owner, ...(task.assignees || [])]);
  const newlyAdded = involvedNow.filter((id) => !previouslyInvolved.has(String(id)));
  const alreadyInvolved = involvedNow.filter((id) => !newlyAdded.includes(String(id)));

  if (newlyAdded.length) {
    await notifyUsers({
      recipientIds: newlyAdded,
      actor: req.user,
      task,
      type: "assigned",
      message: `${actorName(req.user)} assigned you to "${task.title}".`,
    });
    await emailTaskPeople({
      recipientIds: newlyAdded,
      actor: req.user,
      task,
      kind: "assigned",
    });
  }

  if (statusChangedTo) {
    await notifyUsers({
      recipientIds: alreadyInvolved,
      actor: req.user,
      task,
      type: "status",
      message: `${actorName(req.user)} moved "${task.title}" to ${statusChangedTo}.`,
    });

    if (task.status === "done") {
      await emailTaskPeople({
        recipientIds: involvedNow,
        actor: req.user,
        task,
        kind: "done",
      });
    }
  } else if (detailsChanged) {
    await notifyUsers({
      recipientIds: alreadyInvolved,
      actor: req.user,
      task,
      type: "updated",
      message: `${actorName(req.user)} updated "${task.title}".`,
    });
  }

  const populated = await loadTask(task._id);
  const removed = [...previouslyInvolved].filter(
    (id) => id && !involvedNow.includes(String(id))
  );
  publishTask(populated, involvedNow);
  if (removed.length) {
    emitToUsers(removed, "task:remove", { taskId: String(task._id) });
  }
  res.json({
    message: "Task updated",
    task: serializeTask(populated),
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Task not found");
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    fail(res, 404, "Task not found");
  }

  if (!isOwnerOrCreator(task, req.user._id)) {
    fail(res, 403, "Only the owner or the person who created the task can delete it");
  }

  const taskId = String(task._id);
  const readers = memberIds(task);
  await task.deleteOne();
  emitToUsers(readers, "task:remove", { taskId });
  res.json({ message: "Task deleted" });
});

const listTodos = asyncHandler(async (req, res) => {
  const date = isDateKey(req.query.date) ? req.query.date : lagosDateKey();
  const todos = await DailyTodo.find({ user: req.user._id, date }).sort({
    createdAt: 1,
  });

  res.json({ date, todos });
});

const createTodo = asyncHandler(async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) {
    fail(res, 400, "Write a to-do before adding it");
  }

  const date = isDateKey(req.body.date) ? req.body.date : lagosDateKey();
  const todo = await DailyTodo.create({
    user: req.user._id,
    text,
    date,
  });

  res.status(201).json({ message: "To-do added", todo });
});

const updateTodo = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "To-do not found");
  }

  const todo = await DailyTodo.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!todo) {
    fail(res, 404, "To-do not found");
  }

  if (typeof req.body.done === "boolean") {
    todo.done = req.body.done;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "text")) {
    const text = String(req.body.text || "").trim();
    if (!text) {
      fail(res, 400, "To-do cannot be empty");
    }
    todo.text = text;
  }

  await todo.save();
  res.json({ message: "To-do updated", todo });
});

const listTaskChat = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Task not found");
  }

  const task = await Task.findById(req.params.id)
    .select("chat owner assignees createdBy title")
    .populate("chat.author", PEOPLE_FIELDS)
    .lean();

  if (!task) {
    fail(res, 404, "Task not found");
  }

  if (!isOnTask(task, req.user._id)) {
    fail(res, 403, "Only people on this task can read this chat");
  }

  res.json({ messages: task.chat || [] });
});

const createTaskChatMessage = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Task not found");
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    fail(res, 404, "Task not found");
  }

  if (!isOnTask(task, req.user._id)) {
    fail(res, 403, "Only people on this task can send messages");
  }

  const body = String(req.body.body || req.body.text || "").trim();
  if (!body) {
    fail(res, 400, "Message cannot be empty");
  }

  task.chat.push({ author: req.user._id, body });
  if (task.chat.length > 200) {
    task.chat = task.chat.slice(-200);
  }
  await task.save();

  const recipientIds = uniqueIds([task.owner, task.createdBy, ...(task.assignees || [])]);
  const preview =
    body.length > 72 ? `${body.slice(0, 72).trim()}…` : body;
  await notifyUsers({
    recipientIds,
    actor: req.user,
    task,
    type: "updated",
    message: `${actorName(req.user)} on "${task.title}": ${preview}`,
  });

  const populated = await loadTask(task._id);
  const latest = populated.chat[populated.chat.length - 1];
  const latestMessage =
    latest && typeof latest.toObject === "function" ? latest.toObject() : latest;

  emitToUsers(recipientIds, "task:chat", {
    taskId: String(task._id),
    message: latestMessage,
  });

  res.status(201).json({
    message: "Message sent",
    chatMessage: latest,
    task: serializeTask(populated),
  });
});

const addTaskCompletionAttachment = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "Task not found");
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    fail(res, 404, "Task not found");
  }

  if (!isOnTask(task, req.user._id)) {
    fail(res, 403, "Only people on this task can add files");
  }

  if (!req.file?.buffer?.length) {
    fail(res, 400, "Choose a file to upload");
  }

  const currentCount = Array.isArray(task.completionAttachments)
    ? task.completionAttachments.length
    : 0;
  if (currentCount >= MAX_COMPLETION_ATTACHMENTS) {
    fail(
      res,
      400,
      `This task already has the maximum of ${MAX_COMPLETION_ATTACHMENTS} files`
    );
  }

  if (!hasCloudinaryConfig) {
    fail(
      res,
      503,
      "File upload is temporarily unavailable. Try again later."
    );
  }

  const mimeType = String(req.file.mimetype || "").toLowerCase();
  const isImage = mimeType.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";
  const originalName = String(req.file.originalname || "file").slice(0, 180);
  const ext = extensionForUpload(originalName, mimeType);
  const publicStem = `task_${task._id}_${req.user._id}_${Date.now()}`;
  const publicId = ext ? `${publicStem}.${ext}` : publicStem;

  let upload;
  try {
    upload = await uploadBuffer(req.file.buffer, {
      folder: "akb/task-completion",
      resource_type: resourceType,
      public_id: publicId,
    });
  } catch (uploadError) {
    fail(
      res,
      uploadError.statusCode || 502,
      uploadError.message || "Could not upload the file"
    );
  }

  const attachment = {
    url: deliveryUrlForAttachment({
      publicId: upload.public_id,
      resourceType,
      originalName,
      mimeType,
      fallbackUrl: upload.secure_url || upload.url,
    }),
    publicId: upload.public_id || "",
    originalName,
    mimeType: mimeType.slice(0, 120),
    size: Math.min(req.file.size || 0, 2 * 1024 * 1024),
    resourceType,
    uploadedBy: req.user._id,
  };

  if (!Array.isArray(task.completionAttachments)) {
    task.completionAttachments = [];
  }
  task.completionAttachments.push(attachment);
  pushActivity(
    task,
    req.user._id,
    `Added file “${attachment.originalName || "attachment"}”`
  );
  await task.save();

  const involvedNow = uniqueIds([task.createdBy, task.owner, ...(task.assignees || [])]);
  const populated = await loadTask(task._id);
  publishTask(populated, involvedNow);

  const saved = populated.completionAttachments[populated.completionAttachments.length - 1];
  res.status(201).json({
    message: "File attached",
    attachment: saved,
    task: serializeTask(populated),
  });
});

const deleteTodo = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    fail(res, 404, "To-do not found");
  }

  const todo = await DailyTodo.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!todo) {
    fail(res, 404, "To-do not found");
  }

  res.json({ message: "To-do removed" });
});

module.exports = {
  addTaskCompletionAttachment,
  createTask,
  createTaskChatMessage,
  createTodo,
  deleteTask,
  deleteTodo,
  listDirectory,
  listTaskChat,
  listTasks,
  listTodos,
  updateTask,
  updateTodo,
};
