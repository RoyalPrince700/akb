const express = require("express");

const {
  changePassword,
  getProfile,
  login,
  register,
  updateProfile,
} = require("../controllers/auth.controller");
const { authorize, protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, changePassword);
router.get("/hr-only", protect, authorize("hr", "admin"), (req, res) => {
  res.json({ message: "HR/admin access confirmed" });
});

module.exports = router;
