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

module.exports = {
  uploadImage,
};
