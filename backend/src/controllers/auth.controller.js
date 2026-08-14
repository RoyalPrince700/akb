const crypto = require("crypto");

const User = require("../models/User");
const { sendPasswordResetEmail } = require("../mailtrap/email");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const RESET_SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a password reset link.";

const getClientUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const findUserByResetToken = (token) => {
  return User.findOne({
    passwordResetToken: hashResetToken(token),
    passwordResetExpires: { $gt: Date.now() },
  });
};

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const capitalizeWords = (value) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const normalizePhoneNumbers = (phoneNumbers = []) => {
  if (!Array.isArray(phoneNumbers)) {
    return [];
  }

  return [...new Set(phoneNumbers.map((phoneNumber) => phoneNumber.trim()).filter(Boolean))];
};

const sendAuthResponse = (res, statusCode, user) => {
  res.status(statusCode).json({
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, staffId, password, department, position } = req.body;

  if (!name || !email || !staffId || !password || !department || !position) {
    res.status(400);
    throw new Error(
      "Name, email, staff ID, password, department, and position are required"
    );
  }

  if (!passwordPattern.test(password)) {
    res.status(400);
    throw new Error(
      "Password must contain one uppercase letter, one lowercase letter, and one number"
    );
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

  const user = await User.create({
    name: capitalizeWords(name),
    email: normalizedEmail,
    staffId: normalizedStaffId,
    password,
    role: "staff",
    department: capitalizeWords(department),
    position: capitalizeWords(position),
  });

  sendAuthResponse(res, 201, user);
});

const login = asyncHandler(async (req, res) => {
  const { staffId, password } = req.body;

  if (!staffId || !password) {
    res.status(400);
    throw new Error("Staff ID and password are required");
  }

  const user = await User.findOne({
    staffId: staffId.trim().toUpperCase(),
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid staff ID or password");
  }

  if (user.isActive === false) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact an administrator.");
  }

  sendAuthResponse(res, 200, user);
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    user: req.user.toSafeObject(),
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, department, position, csrDisplayName, csrPhoneNumbers } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (name?.trim()) {
    user.name = capitalizeWords(name);
  }

  if (department?.trim()) {
    user.department = capitalizeWords(department);
  }

  if (position?.trim()) {
    user.position = capitalizeWords(position);
  }

  if (email?.trim()) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        res.status(409);
        throw new Error("A user with this email already exists");
      }
      user.email = normalizedEmail;
    }
  }

  if (csrDisplayName !== undefined || csrPhoneNumbers !== undefined) {
    if (!["csr", "csrAdmin"].includes(user.role)) {
      res.status(403);
      throw new Error("Only CSR users can update CSR settings");
    }
  }

  if (csrDisplayName !== undefined) {
    user.csrDisplayName = csrDisplayName.trim() || undefined;
  }

  if (csrPhoneNumbers !== undefined) {
    user.csrPhoneNumbers = normalizePhoneNumbers(csrPhoneNumbers);
  }

  await user.save();

  res.json({
    user: user.toSafeObject(),
    message: "Profile updated successfully",
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  if (!passwordPattern.test(newPassword)) {
    res.status(400);
    throw new Error(
      "Password must contain one uppercase letter, one lowercase letter, and one number"
    );
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user || user.isActive === false) {
    res.json({ message: RESET_SUCCESS_MESSAGE });
    return;
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${getClientUrl()}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (mailError) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(mailError.statusCode || 500);
    throw new Error(
      mailError.statusCode
        ? mailError.message
        : "Unable to send the reset email. Please try again later."
    );
  }

  res.json({ message: RESET_SUCCESS_MESSAGE });
});

const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    res.status(400);
    throw new Error("Reset token is required");
  }

  const user = await findUserByResetToken(token);

  if (!user || user.isActive === false) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired");
  }

  res.json({ valid: true });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error("Reset token and new password are required");
  }

  if (!passwordPattern.test(password)) {
    res.status(400);
    throw new Error(
      "Password must contain one uppercase letter, one lowercase letter, and one number"
    );
  }

  const user = await findUserByResetToken(token);

  if (!user || user.isActive === false) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successfully. You can now sign in." });
});

module.exports = {
  changePassword,
  forgotPassword,
  getProfile,
  login,
  register,
  resetPassword,
  updateProfile,
  verifyResetToken,
};
