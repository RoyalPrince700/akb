const express = require("express");

const {
  getContentLock,
  listContentLocks,
  updateContentLock,
} = require("../controllers/contentLock.controller");
const {
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", listContentLocks);
router.get("/:courseId", getContentLock);
router.patch("/:courseId", authorizeHrOrAdmin, updateContentLock);

module.exports = router;
