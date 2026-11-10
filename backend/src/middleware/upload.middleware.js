const multer = require("multer");

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype?.startsWith("image/")) {
    cb(Object.assign(new Error("Only image uploads are allowed"), { statusCode: 400 }));
    return;
  }

  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const TASK_COMPLETION_MAX_BYTES = 2 * 1024 * 1024;

const TASK_COMPLETION_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const taskCompletionFileFilter = (req, file, cb) => {
  const mime = String(file.mimetype || "").toLowerCase();
  if (!TASK_COMPLETION_MIME_TYPES.has(mime)) {
    cb(
      Object.assign(new Error("Use an image or PDF, Word, or text file (max 2MB)"), {
        statusCode: 400,
      })
    );
    return;
  }
  cb(null, true);
};

const uploadTaskCompletion = multer({
  storage,
  fileFilter: taskCompletionFileFilter,
  limits: {
    fileSize: TASK_COMPLETION_MAX_BYTES,
    files: 1,
  },
});

module.exports = {
  uploadImage,
  uploadTaskCompletion,
  TASK_COMPLETION_MAX_BYTES,
};
