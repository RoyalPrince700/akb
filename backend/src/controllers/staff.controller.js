const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const ROLES = ["staff", "hr", "admin"];

const buildUserFilter = (query, isAdmin) => {
  const filter = {};

  if (!isAdmin) {
    filter.role = "staff";
  } else if (query.role && ROLES.includes(query.role)) {
    filter.role = query.role;
  }

  if (query.department) {
    filter.department = new RegExp(query.department.trim(), "i");
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = query.isActive === "true";
  }

  if (query.search) {
    const search = query.search.trim();
    filter.$or = [
      { name: new RegExp(search, "i") },
      { staffId: new RegExp(search, "i") },
      { department: new RegExp(search, "i") },
      { position: new RegExp(search, "i") },
    ];
  }

  return filter;
};

const findUserById = async (id) => User.findById(id).select("-password");

const assertNotSelf = (actorId, targetId, message) => {
  if (actorId.toString() === targetId.toString()) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
};

const listStaff = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const filter = buildUserFilter(req.query, isAdmin);

  const [staff, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    staff: staff.map((user) => user.toSafeObject()),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const getStaff = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const filter = { _id: req.params.id };

  if (!isAdmin) {
    filter.role = "staff";
  }

  const staffMember = await User.findOne(filter).select("-password");

  if (!staffMember) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ staff: staffMember.toSafeObject() });
});

const createStaff = asyncHandler(async (req, res) => {
  const { name, email, staffId, password, department, position, role } =
    req.body;

  if (!name || !email || !staffId || !password || !department || !position) {
    res.status(400);
    throw new Error(
      "Name, email, staff ID, password, department, and position are required"
    );
  }

  const assignedRole = role || "staff";

  if (!ROLES.includes(assignedRole)) {
    res.status(400);
    throw new Error("Role must be staff, hr, or admin");
  }

  const normalizedStaffId = staffId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({
    $or: [{ staffId: normalizedStaffId }, { email: normalizedEmail }],
  });

  if (existingUser?.staffId === normalizedStaffId) {
    res.status(409);
    throw new Error("A user with this staff ID already exists");
  }

  if (existingUser?.email === normalizedEmail) {
    res.status(409);
    throw new Error("A user with this email already exists");
  }

  const staffMember = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    staffId: normalizedStaffId,
    password,
    department: department.trim(),
    position: position.trim(),
    role: assignedRole,
    isActive: true,
  });

  res.status(201).json({ staff: staffMember.toSafeObject() });
});

const updateStaff = asyncHandler(async (req, res) => {
  const staffMember = await findUserById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email, staffId, department, position, password, role } =
    req.body;

  if (name !== undefined) {
    staffMember.name = name.trim();
  }
  if (staffId !== undefined) {
    const normalizedStaffId = staffId.trim().toUpperCase();

    if (!normalizedStaffId) {
      res.status(400);
      throw new Error("Staff ID is required");
    }

    const existingUser = await User.findOne({
      staffId: normalizedStaffId,
      _id: { $ne: staffMember._id },
    });

    if (existingUser) {
      res.status(409);
      throw new Error("A user with this staff ID already exists");
    }

    staffMember.staffId = normalizedStaffId;
  }
  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: staffMember._id },
    });

    if (existingUser) {
      res.status(409);
      throw new Error("A user with this email already exists");
    }

    staffMember.email = normalizedEmail;
  }
  if (department !== undefined) {
    staffMember.department = department.trim();
  }
  if (position !== undefined) {
    staffMember.position = position.trim();
  }
  if (password) {
    staffMember.password = password;
  }

  if (role !== undefined) {
    if (!ROLES.includes(role)) {
      res.status(400);
      throw new Error("Role must be staff, hr, or admin");
    }

    if (
      req.user._id.toString() === staffMember._id.toString() &&
      role !== "admin"
    ) {
      res.status(400);
      throw new Error("You cannot remove your own administrator access");
    }

    staffMember.role = role;
  }

  await staffMember.save();

  res.json({ staff: staffMember.toSafeObject() });
});

const updateStaffStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    res.status(400);
    throw new Error("isActive must be a boolean");
  }

  const staffMember = await findUserById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("User not found");
  }

  assertNotSelf(
    req.user._id,
    staffMember._id,
    "You cannot deactivate your own account"
  );

  staffMember.isActive = isActive;
  await staffMember.save();

  res.json({ staff: staffMember.toSafeObject() });
});

const deleteStaff = asyncHandler(async (req, res) => {
  const staffMember = await findUserById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("User not found");
  }

  assertNotSelf(req.user._id, staffMember._id, "You cannot delete your own account");

  await staffMember.deleteOne();

  res.json({ message: "User deleted successfully" });
});

module.exports = {
  createStaff,
  deleteStaff,
  getStaff,
  listStaff,
  updateStaff,
  updateStaffStatus,
};
