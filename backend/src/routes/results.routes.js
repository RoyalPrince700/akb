const express = require("express");

const {
  deleteResult,
  listAllResults,
  listMyResults,
  listStaffResults,
} = require("../controllers/results.controller");
const {
  authorizeAdmin,
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/me", protect, listMyResults);
router.delete("/:id", protect, authorizeAdmin, deleteResult);

router.use(protect, authorizeHrOrAdmin);
router.get("/", listAllResults);
router.get("/staff/:id", listStaffResults);

module.exports = router;
