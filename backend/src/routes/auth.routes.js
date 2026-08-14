const express = require("express");

const {
  changePassword,
  forgotPassword,
  getProfile,
  login,
  register,
  resetPassword,
  updateProfile,
  verifyResetToken,
} = require("../controllers/auth.controller");
const { authorize, protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", verifyResetToken);
router.post("/reset-password", resetPassword);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.get("/hr-only", protect, authorize("hr", "admin"), (req, res) => {
  res.json({ message: "HR/admin access confirmed" });
});

module.exports = router;
