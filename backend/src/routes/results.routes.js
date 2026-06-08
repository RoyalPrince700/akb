const express = require("express");

const {
  listAllResults,
  listMyResults,
  listStaffResults,
} = require("../controllers/results.controller");
const { authorizeHrOrAdmin, protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/me", protect, listMyResults);

router.use(protect, authorizeHrOrAdmin);
router.get("/", listAllResults);
router.get("/staff/:id", listStaffResults);

module.exports = router;
