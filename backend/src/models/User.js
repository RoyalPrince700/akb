const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    staffId: {
      type: String,
      required: [true, "Staff ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      match: [
        passwordPattern,
        "Password must contain one uppercase letter, one lowercase letter, and one number",
      ],
      select: false,
    },
    role: {
      type: String,
      enum: ["staff", "hr", "admin", "csr", "csrAdmin", "security"],
      default: "staff",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    gems: {
      type: Number,
      default: 0,
      min: 0,
    },
    csrPhoneNumbers: {
      type: [String],
      default: [],
    },
    csrDisplayName: {
      type: String,
      trim: true,
    },
    // Facial attendance enrollment (admin-only via /api/staff/:id/face)
    facePhotoUrl: {
      type: String,
      default: null,
    },
    facePhotoPublicId: {
      type: String,
      default: null,
    },
    // 128-d face-api descriptor averaged across enrollment photos (client-computed)
    faceDescriptor: {
      type: [Number],
      default: undefined,
      select: false,
    },
    faceEnrolledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.virtual("faceEnrolled").get(function faceEnrolled() {
  return Boolean(this.facePhotoUrl || (this.faceDescriptor && this.faceDescriptor.length));
});

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const user = this.toObject({ virtuals: true });
  delete user.password;
  delete user.faceDescriptor;
  user.faceEnrolled = Boolean(
    user.facePhotoUrl || user.faceEnrolledAt
  );
  return user;
};

module.exports = mongoose.model("User", userSchema);
