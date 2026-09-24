const express = require("express");

const {
  createHrAssessment,
  deleteHrAssessment,
  getHrAssessment,
  getHrAssessmentForTake,
  listHrAssessments,
  listPublishedHrAssessments,
  publishHrAssessment,
  setHrAssessmentAccess,
  updateHrAssessment,
} = require("../controllers/hrAssessment.controller");
const {
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/published", listPublishedHrAssessments);

router.use(protect);

router.get("/", authorizeHrOrAdmin, listHrAssessments);
router.post("/", authorizeHrOrAdmin, createHrAssessment);
router.get("/take/:id", getHrAssessmentForTake);
router.patch("/:id/access", authorizeHrOrAdmin, setHrAssessmentAccess);
router.post("/:id/publish", authorizeHrOrAdmin, publishHrAssessment);
router.get("/:id", authorizeHrOrAdmin, getHrAssessment);
router.patch("/:id", authorizeHrOrAdmin, updateHrAssessment);
router.delete("/:id", authorizeHrOrAdmin, deleteHrAssessment);

module.exports = router;
