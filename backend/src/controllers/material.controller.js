const Material = require("../models/Material");
const asyncHandler = require("../utils/asyncHandler");
const courses = require("../data/courses");

const listPublishedMaterials = asyncHandler(async (req, res) => {
  const materials = await Material.find({ status: "published" })
    .populate("createdBy", "name staffId")
    .sort({ updatedAt: -1 })
    .select("-__v");

  res.json({
    courses,
    materials,
  });
});

const getMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id).populate(
    "createdBy",
    "name staffId"
  );

  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  if (material.status !== "published" && req.user.role === "staff") {
    res.status(403);
    throw new Error("This material is not published");
  }

  res.json({ material });
});

const listMaterials = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const materials = await Material.find(filter)
    .populate("createdBy", "name staffId")
    .sort({ updatedAt: -1 });

  res.json({ materials, courses });
});

const createMaterial = asyncHandler(async (req, res) => {
  const { title, description, category, tags, audience, status, courseSlug, file } =
    req.body;

  if (!title) {
    res.status(400);
    throw new Error("Title is required");
  }

  const material = await Material.create({
    title,
    description,
    category,
    tags: Array.isArray(tags) ? tags : [],
    audience,
    status,
    courseSlug,
    file,
    createdBy: req.user._id,
  });

  res.status(201).json({ material });
});

const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  const fields = [
    "title",
    "description",
    "category",
    "tags",
    "audience",
    "status",
    "courseSlug",
    "file",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      material[field] = req.body[field];
    }
  });

  await material.save();

  res.json({ material });
});

const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findByIdAndDelete(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  res.json({ message: "Material deleted successfully" });
});

module.exports = {
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
  listPublishedMaterials,
  updateMaterial,
};
