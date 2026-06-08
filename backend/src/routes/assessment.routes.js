const express = require("express");

const {
  listAssessments,
  submitAssessment,
} = require("../controllers/assessment.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", listAssessments);
router.post("/:courseId/submit", submitAssessment);

module.exports = router;
