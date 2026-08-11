const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { deleteAsset, uploadBuffer } = require("../config/cloudinary");

const ROLES = ["staff", "hr", "admin", "csr", "csrAdmin", "security"];
const CSR_MANAGED_ROLES = ["csr", "csrAdmin"];

const ROLE_LABELS = "staff, hr, admin, csr, csrAdmin, or security";

const parseFaceDescriptor = (raw) => {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      const error = new Error("faceDescriptor must be a JSON array of numbers");
      error.statusCode = 400;
      throw error;
    }
  }

  if (!Array.isArray(value) || value.length === 0) {
    const error = new Error("faceDescriptor must be a non-empty array of numbers");
    error.statusCode = 400;
    throw error;
  }

  const numbers = value.map((entry) => Number(entry));
  if (numbers.some((entry) => !Number.isFinite(entry))) {
    const error = new Error("faceDescriptor must contain only numbers");
    error.statusCode = 400;
    throw error;
  }

  return numbers;
};

const getStaffAccessScope = (user) => {
  if (user.role === "admin") {
    return "admin";
  }

  if (user.role === "csrAdmin") {
    return "csrAdmin";
  }

  return "staffOnly";
};

const buildManagedRoleFilter = (scope, queryRole) => {
  if (scope === "admin") {
    return queryRole && ROLES.includes(queryRole) ? queryRole : undefined;
  }

  if (scope === "csrAdmin") {
    return queryRole && CSR_MANAGED_ROLES.includes(queryRole)
      ? queryRole
      : { $in: CSR_MANAGED_ROLES };
  }

  return "staff";
};

/** Matches toSafeObject faceEnrolled: facePhotoUrl or faceEnrolledAt is set. */
const FACE_ENROLLED_CLAUSE = {
  $or: [{ faceEnrolledAt: { $ne: null } }, { facePhotoUrl: { $ne: null } }],
};

const FACE_NOT_ENROLLED_CLAUSE = {
  $and: [
    { $or: [{ faceEnrolledAt: null }, { faceEnrolledAt: { $exists: false } }] },
    {
      $or: [
        { facePhotoUrl: null },
        { facePhotoUrl: { $exists: false } },
        { facePhotoUrl: "" },
      ],
    },
  ],
};

const buildUserFilter = (query, scope) => {
  const filter = {};
  const andClauses = [];
  const roleFilter = buildManagedRoleFilter(scope, query.role);

  if (roleFilter) {
    filter.role = roleFilter;
  }

  if (query.department) {
    filter.department = new RegExp(query.department.trim(), "i");
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = query.isActive === "true";
  }

  if (query.search) {
    const search = query.search.trim();
    andClauses.push({
      $or: [
        { name: new RegExp(search, "i") },
        { staffId: new RegExp(search, "i") },
        { department: new RegExp(search, "i") },
        { position: new RegExp(search, "i") },
      ],
    });
  }

  if (query.faceEnrolled === "true") {
    andClauses.push(FACE_ENROLLED_CLAUSE);
  } else if (query.faceEnrolled === "false") {
    andClauses.push(FACE_NOT_ENROLLED_CLAUSE);
  }

  if (andClauses.length === 1) {
    Object.assign(filter, andClauses[0]);
  } else if (andClauses.length > 1) {
    filter.$and = andClauses;
  }

  return filter;
};

const findUserById = async (id) => User.findById(id).select("-password");

const assertCanManageRole = (actor, role) => {
  if (actor.role === "admin") {
    return;
  }

  if (actor.role === "csrAdmin" && CSR_MANAGED_ROLES.includes(role)) {
    return;
  }

  const error = new Error("You can only manage CSR and CSR Admin accounts");
  error.statusCode = 403;
  throw error;
};

const assertCanManageStaffMember = (actor, staffMember) => {
  if (actor.role === "admin") {
    return;
  }

  if (actor.role === "csrAdmin" && CSR_MANAGED_ROLES.includes(staffMember.role)) {
    return;
  }

  if (actor.role === "hr" && staffMember.role === "staff") {
    return;
  }

  const error = new Error("You are not authorized to manage this user");
  error.statusCode = 403;
  throw error;
};

const assertNotSelf = (actorId, targetId, message) => {
  if (actorId.toString() === targetId.toString()) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
};

const listStaff = asyncHandler(async (req, res) => {
  const scope = getStaffAccessScope(req.user);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const filter = buildUserFilter(req.query, scope);

  const [staff, total] = await Promise.all([
    User.find(filter)
      .select("-password -faceDescriptor")
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
  const scope = getStaffAccessScope(req.user);
  const filter = { _id: req.params.id };
  const roleFilter = buildManagedRoleFilter(scope, req.query.role);

  if (roleFilter) {
    filter.role = roleFilter;
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

  const assignedRole = role || (req.user.role === "csrAdmin" ? "csr" : "staff");

  if (!ROLES.includes(assignedRole)) {
    res.status(400);
    throw new Error(`Role must be ${ROLE_LABELS}`);
  }

  assertCanManageRole(req.user, assignedRole);

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

  assertCanManageStaffMember(req.user, staffMember);

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
      throw new Error(`Role must be ${ROLE_LABELS}`);
    }

    assertCanManageRole(req.user, role);

    if (
      req.user._id.toString() === staffMember._id.toString() &&
      role !== req.user.role
    ) {
      res.status(400);
      throw new Error("You cannot change your own administrator role");
    }

    staffMember.role = role;
  }

  await staffMember.save();

  res.json({ staff: staffMember.toSafeObject() });
});

/**
 * Admin-only face enrollment.
 * Face matching v1: client (face-api) computes descriptor; server stores photo + descriptor.
 * Official attendance punches still use server timestamps only.
 */
const enrollStaffFace = asyncHandler(async (req, res) => {
  const staffMember = await User.findById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("User not found");
  }

  const faceDescriptor = parseFaceDescriptor(
    req.body.faceDescriptor ?? req.body.descriptor
  );

  if (!req.file?.buffer && !faceDescriptor && !req.body.facePhotoUrl) {
    res.status(400);
    throw new Error("Provide a face image file and/or faceDescriptor");
  }

  if (req.file?.buffer) {
    try {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: "akb/faces",
        public_id: `staff_${staffMember.staffId}_${Date.now()}`,
      });

      if (staffMember.facePhotoPublicId) {
        try {
          await deleteAsset(staffMember.facePhotoPublicId);
        } catch {
          // Keep enrollment even if prior asset cleanup fails
        }
      }

      staffMember.facePhotoUrl = upload.secure_url || upload.url;
      staffMember.facePhotoPublicId = upload.public_id;
    } catch (uploadError) {
      // Allow descriptor-only enrollment when Cloudinary is unavailable
      if (!faceDescriptor) {
        res.status(uploadError.statusCode || 503);
        throw uploadError;
      }
    }
  } else if (req.body.facePhotoUrl) {
    staffMember.facePhotoUrl = String(req.body.facePhotoUrl).trim();
  }

  if (faceDescriptor) {
    staffMember.faceDescriptor = faceDescriptor;
  }

  if (!staffMember.faceDescriptor?.length && !staffMember.facePhotoUrl) {
    res.status(400);
    throw new Error(
      "Enrollment failed: need a valid faceDescriptor or image upload"
    );
  }

  staffMember.faceEnrolledAt = new Date();
  await staffMember.save();

  res.json({
    message: "Face enrolled successfully",
    staff: {
      ...staffMember.toSafeObject(),
      faceEnrolled: true,
    },
  });
});

const clearStaffFace = asyncHandler(async (req, res) => {
  const staffMember = await User.findById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("User not found");
  }

  if (staffMember.facePhotoPublicId) {
    try {
      await deleteAsset(staffMember.facePhotoPublicId);
    } catch {
      // Continue clearing local fields
    }
  }

  staffMember.facePhotoUrl = null;
  staffMember.facePhotoPublicId = null;
  staffMember.faceDescriptor = undefined;
  staffMember.faceEnrolledAt = null;
  await staffMember.save();

  res.json({
    message: "Face enrollment cleared",
    staff: staffMember.toSafeObject(),
  });
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

  assertCanManageStaffMember(req.user, staffMember);

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

  assertCanManageStaffMember(req.user, staffMember);

  assertNotSelf(req.user._id, staffMember._id, "You cannot delete your own account");

  await staffMember.deleteOne();

  res.json({ message: "User deleted successfully" });
});

module.exports = {
  clearStaffFace,
  createStaff,
  deleteStaff,
  enrollStaffFace,
  getStaff,
  listStaff,
  updateStaff,
  updateStaffStatus,
};
