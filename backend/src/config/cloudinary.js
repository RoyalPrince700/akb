const { v2: cloudinary } = require("cloudinary");

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    if (!hasCloudinaryConfig) {
      reject(
        Object.assign(new Error("Cloudinary is not configured on the server"), {
          statusCode: 503,
        })
      );
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "akb/faces",
        resource_type: "image",
        overwrite: options.overwrite !== false,
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });

const deleteAsset = async (publicId) => {
  if (!hasCloudinaryConfig || !publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = {
  cloudinary,
  deleteAsset,
  hasCloudinaryConfig,
  uploadBuffer,
};
