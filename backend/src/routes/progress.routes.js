const express = require("express");

const {
  completeChapter,
  getCourseProgress,
  getLeaderboard,
  getMyProgressSummary,
  getStaffCompletions,
} = require("../controllers/progress.controller");
const { authorizeHrOrAdmin, protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/leaderboard", protect, getLeaderboard);
router.get(
  "/staff-completions",
  protect,
  authorizeHrOrAdmin,
  getStaffCompletions
);
router.get("/me/summary", protect, getMyProgressSummary);
router.get("/:courseId", protect, getCourseProgress);
router.post(
  "/:courseId/chapters/:chapterId/complete",
  protect,
  completeChapter
);

module.exports = router;
