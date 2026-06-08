const express = require("express");

const {
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
  listPublishedMaterials,
  updateMaterial,
} = require("../controllers/material.controller");
const {
  authorizeAdmin,
  authorizeHrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/published", protect, listPublishedMaterials);
router.get("/:id", protect, getMaterial);

router.get("/", protect, authorizeHrOrAdmin, listMaterials);
router.post("/", protect, authorizeAdmin, createMaterial);
router.put("/:id", protect, authorizeAdmin, updateMaterial);
router.delete("/:id", protect, authorizeAdmin, deleteMaterial);

module.exports = router;
